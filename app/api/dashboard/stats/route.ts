import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/supabase-db'
import { logger } from '@/lib/logger'

export async function GET(_req: NextRequest) {
  try {
    // Try to get authenticated user
    let user = null
    try {
      user = await getAuthenticatedUser()
    } catch (error) {
      logger.debug('Auth check failed in dashboard stats', { error })
    }
    
    // If no user, return demo data with instructions
    if (!user) {
      const mockStats = {
        dailyTalkTime: 0, // Will be updated from client localStorage
        weeklyTalkTime: 0, // Will be updated from client localStorage  
        monthlyTalkTime: 0, // Will be updated from client localStorage
        totalSessions: 0,
        recentSessions: [],
        isDemo: true // Flag to indicate this is demo data
      }
      
      return NextResponse.json(mockStats)
    }
    
    // Get user stats from Supabase
    const userStats = await db.userStats.findByUserId(user.id)
    
    // Get recent sessions
    const recentSessions = await db.sessions.findByUserId(user.id, 10)
    
    // Get assessment counts for each session
    const sessionsWithCounts = await Promise.all(
      recentSessions.map(async (session) => {
        const assessments = await db.assessments.findBySessionId(session.id)
        return {
          id: session.id,
          date: session.start_time,
          duration: session.end_time 
            ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000)
            : 0,
          mode: session.mode,
          assessmentCount: assessments.length
        }
      })
    )
    
    const stats = {
      dailyTalkTime: userStats?.daily_talk_time || 0,
      weeklyTalkTime: userStats?.weekly_talk_time || 0,
      monthlyTalkTime: userStats?.monthly_talk_time || 0,
      totalSessions: recentSessions.length,
      recentSessions: sessionsWithCounts
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    logger.error('Dashboard stats error', error as Error)
    
    // Fallback to demo data on any error
    const mockStats = {
      dailyTalkTime: 0,
      weeklyTalkTime: 0,
      monthlyTalkTime: 0,
      totalSessions: 0,
      recentSessions: [],
      isDemo: true,
      error: 'Database connection failed - showing demo data'
    }
    
    return NextResponse.json(mockStats)
  }
}