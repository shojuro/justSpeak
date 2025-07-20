import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, updateUserStats } from '@/lib/auth-helpers'
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
    const { sessionId, speakingTime, speaker } = body
    
    if (!sessionId || typeof speakingTime !== 'number' || !speaker) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get session from database to verify ownership
    const sessions = await db.sessions.findByUserId(user.id, 50)
    const session = sessions.find(s => s.id === sessionId)
    
    if (!session) {
      logger.warn('Session not found', { sessionId })
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Update session speaking time
    const currentUserTime = session.user_talk_time || 0
    const currentAiTime = session.ai_talk_time || 0
    
    const updatedSession = await db.sessions.update(sessionId, {
      user_talk_time: speaker === 'user' 
        ? currentUserTime + Math.round(speakingTime)
        : currentUserTime,
      ai_talk_time: speaker === 'ai' 
        ? currentAiTime + Math.round(speakingTime)
        : currentAiTime
    })
    
    // Update user stats if user was speaking
    if (speaker === 'user') {
      await updateUserStats(user.id, Math.round(speakingTime), 'user')
    }
    
    return NextResponse.json({
      success: true,
      totalUserTime: updatedSession.user_talk_time,
      totalAiTime: updatedSession.ai_talk_time
    })
  } catch (error) {
    logger.error('Update session error', error as Error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}