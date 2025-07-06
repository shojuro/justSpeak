import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/supabase-db'

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
    
    // Get request body if mode is specified
    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'conversation'
    
    // Create session in database
    const session = await db.sessions.create({
      user_id: user.id,
      mode: mode,
      start_time: new Date().toISOString(),
      user_talk_time: 0,
      ai_talk_time: 0
    })
    
    return NextResponse.json({
      sessionId: session.id,
      startTime: session.start_time,
      mode: session.mode
    })
  } catch (error) {
    console.error('Start session error:', error)
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    )
  }
}