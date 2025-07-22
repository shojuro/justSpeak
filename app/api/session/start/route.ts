import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/supabase-db'
import { logger } from '@/lib/logger'
import { generateSecureSessionId, generateSessionMetadata, generateCSRFToken } from '@/lib/session-security'

export async function POST(req: NextRequest) {
  try {
    // Generate secure session components
    const { sessionId, token, fingerprint } = generateSecureSessionId()
    const csrfToken = generateCSRFToken()
    
    // Get session metadata
    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || undefined
    const sessionMeta = generateSessionMetadata(userAgent, ipAddress)
    
    // Authentication is mandatory
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
    
    // Save session to database
    try {
      // Create session in database with secure token
      const session = await db.sessions.create({
        user_id: user.id,
        mode: mode,
        start_time: new Date().toISOString(),
        user_talk_time: 0,
        ai_talk_time: 0,
        // Store session security data (you may need to add these columns)
        // session_token_hash: hashSessionToken(token).hash,
        // session_fingerprint: fingerprint,
        // expires_at: new Date(sessionMeta.expiresAt).toISOString()
      })
      
      logger.info('Secure session created', { 
        sessionId: session.id, 
        userId: user.id,
        fingerprint 
      })
    } catch (dbError) {
      logger.error('Failed to save session to database', dbError as Error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }
    
    // Return session info (token is sent securely)
    const response = NextResponse.json({
      sessionId,
      fingerprint,
      csrfToken,
      startTime: new Date().toISOString(),
      expiresAt: new Date(sessionMeta.expiresAt).toISOString(),
      mode
    })
    
    // Set secure session cookie
    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })
    
    return response
  } catch (error) {
    logger.error('Start session error', error as Error)
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    )
  }
}