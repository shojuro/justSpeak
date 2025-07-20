import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/supabase-db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'week'
    
    // If no database is configured, return demo log data
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const mockLogContent = `TalkTime Session Logs
=====================
User: Demo User (Local Mode)
Period: ${period === 'all' ? 'All Time' : `Last ${period}`}
Generated: ${new Date().toLocaleString()}

Summary
-------
Total Sessions: 5
Total Talk Time: 25 minutes
- User Speaking: 15 minutes
- AI Speaking: 10 minutes

Learning Mode Sessions: 2
Conversation Mode Sessions: 3

Recent Sessions
--------------

Session 1 - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
Mode: Conversation
Duration: 5 minutes
Topic: Daily routine and hobbies

Session 2 - ${new Date(Date.now() - 86400000).toLocaleDateString()}
Mode: Learning
Duration: 10 minutes

Sample Corrections:
User: "I goed to the store yesterday"
Corrected: "I went to the store yesterday"
- Grammar: "goed" → "went" (irregular past tense)

Progress Notes
--------------
• Good conversation flow
• Working on past tense verbs
• Improving pronunciation

Note: This is demo data. Configure Supabase database to track real sessions.
`
      
      return new NextResponse(mockLogContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="talktime-logs-${period}-${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    }
    
    // Try to get authenticated user
    let user = null
    try {
      user = await getAuthenticatedUser()
    } catch (error) {
      logger.debug('Auth check failed in download logs', { error })
    }
    
    // If no user, return mock log data
    if (!user) {
      const mockLogContent = `TalkTime Session Logs
=====================
User: Demo User
Period: ${period === 'all' ? 'All Time' : `Last ${period}`}
Generated: ${new Date().toLocaleString()}

Summary
-------
Total Sessions: 5
Total Talk Time: 25 minutes
- User Speaking: 15 minutes
- AI Speaking: 10 minutes

Learning Mode Sessions: 2
Conversation Mode Sessions: 3

Recent Sessions
--------------

Session 1 - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
Mode: Conversation
Duration: 5 minutes
Topic: Daily routine and hobbies

Session 2 - ${new Date(Date.now() - 86400000).toLocaleDateString()}
Mode: Learning
Duration: 10 minutes

Sample Corrections:
User: "I goed to the store yesterday"
Corrected: "I went to the store yesterday"
- Grammar: "goed" → "went" (irregular past tense)

Progress Notes
--------------
• Good conversation flow
• Working on past tense verbs
• Improving pronunciation

Note: This is demo data. Connect to a database to track real sessions.
`
      
      return new NextResponse(mockLogContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="talktime-logs-${period}-${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    }
    
    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
    }
    
    // Get all user sessions and filter by date
    const allSessions = await db.sessions.findByUserId(user.id, 1000)
    const sessions = allSessions
      .filter(s => {
        const sessionDate = new Date(s.start_time)
        return sessionDate >= startDate && sessionDate <= endDate
      })
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    
    // Get related data for each session
    const sessionsWithData = await Promise.all(
      sessions.map(async (session) => {
        const messages = await db.messages.findBySessionId(session.id)
        const assessments = await db.assessments.findBySessionId(session.id)
        return {
          ...session,
          messages,
          assessments
        }
      })
    )
    
    // Get user stats
    const userStats = await db.userStats.findByUserId(user.id)
    
    // Calculate totals
    const totalSessions = sessions.length
    const totalUserTime = sessions.reduce((sum, s) => sum + s.user_talk_time, 0)
    const totalAiTime = sessions.reduce((sum, s) => sum + s.ai_talk_time, 0)
    const totalTime = totalUserTime + totalAiTime
    
    const learningModeSessions = sessions.filter(s => s.mode === 'learning').length
    const conversationModeSessions = sessions.filter(s => s.mode === 'conversation').length
    
    // Aggregate improvement areas from assessments
    const improvementAreas = new Map<string, number>()
    sessionsWithData.forEach(session => {
      session.assessments.forEach(assessment => {
        assessment.areas_to_improve.forEach(area => {
          improvementAreas.set(area, (improvementAreas.get(area) || 0) + 1)
        })
      })
    })
    
    // Sort improvement areas by frequency
    const topAreas = Array.from(improvementAreas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    
    // Format time helper
    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
      }
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    
    // Generate report
    let logContent = `TalkTime Session Logs
=====================
User: ${user.name || user.email}
Period: ${period === 'all' ? 'All Time' : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
Generated: ${new Date().toLocaleString()}

Summary
-------
Total Sessions: ${totalSessions}
Total Talk Time: ${formatTime(totalTime)}
- User Speaking: ${formatTime(totalUserTime)}
- AI Speaking: ${formatTime(totalAiTime)}

Learning Mode Sessions: ${learningModeSessions}
Conversation Mode Sessions: ${conversationModeSessions}

${topAreas.length > 0 ? `Top Areas for Improvement
-------------------------
${topAreas.map((area, i) => `${i + 1}. ${area[0]} (${area[1]} occurrences)`).join('\n')}

` : ''}Session Details
--------------
`
    
    // Add session details
    sessionsWithData.forEach((session, index) => {
      const duration = session.end_time 
        ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000)
        : 0
      
      logContent += `
Session ${index + 1} - ${new Date(session.start_time).toLocaleDateString()} ${new Date(session.start_time).toLocaleTimeString()}
Mode: ${session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}
Duration: ${formatTime(duration)}
User Talk Time: ${formatTime(session.user_talk_time)}
AI Talk Time: ${formatTime(session.ai_talk_time)}
Messages: ${session.messages.length}
`
      
      if (session.mode === 'learning' && session.assessments.length > 0) {
        logContent += `\nAssessments:\n`
        session.assessments.forEach(assessment => {
          if (assessment.original_text !== assessment.corrected_text) {
            logContent += `\nUser: "${assessment.original_text}"\n`
            logContent += `Corrected: "${assessment.corrected_text}"\n`
            if (assessment.corrections && assessment.corrections.length > 0) {
              logContent += `Corrections:\n`
              if (Array.isArray(assessment.corrections)) {
                assessment.corrections.forEach(correction => {
                  logContent += `- ${typeof correction === 'string' ? correction : JSON.stringify(correction)}\n`
                })
              }
            }
          }
        })
      }
      
      logContent += `\n---\n`
    })
    
    // Add overall stats if available
    if (userStats) {
      logContent += `
Overall Progress
---------------
Total Talk Time (All Time): ${formatTime(userStats.total_talk_time)}
Sessions Completed: ${(await db.sessions.findByUserId(user.id, 1000)).length}

Recommendations
--------------
${topAreas.length > 0 ? 
  topAreas.slice(0, 3).map((area, i) => 
    `${i + 1}. Focus on improving ${area[0].toLowerCase()}`
  ).join('\n') : 
  '1. Continue regular practice to build fluency\n2. Try learning mode for targeted feedback\n3. Explore different conversation topics'}
`
    }
    
    // Return as downloadable text file
    return new NextResponse(logContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="talktime-logs-${period}-${new Date().toISOString().split('T')[0]}.txt"`
      }
    })
  } catch (error) {
    logger.error('Download logs error', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate logs' },
      { status: 500 }
    )
  }
}