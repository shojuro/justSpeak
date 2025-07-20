import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/supabase-db'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const body = await req.json()
    const { sessionId } = body
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    // Update session end time
    const session = await db.sessions.update(sessionId, {
      end_time: new Date().toISOString()
    })
    
    // Get related data
    const messages = await db.messages.findBySessionId(sessionId)
    const assessments = await db.assessments.findBySessionId(sessionId)
    
    // Calculate session duration
    const duration = session.end_time 
      ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000
      : 0
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      duration: Math.round(duration),
      userTalkTime: session.user_talk_time,
      aiTalkTime: session.ai_talk_time,
      messageCount: messages.length,
      assessmentCount: assessments.length
    })
  } catch (error) {
    logger.error('End session error', error as Error)
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    )
  }
}