import { createClient } from '@supabase/supabase-js'
import { env } from './env-validation'
import { logger } from './logger'

// Initialize Supabase client with validated credentials
let supabaseDb: ReturnType<typeof createClient> | null = null

try {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabaseDb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  } else {
    logger.warn('Supabase credentials not available, database features will be disabled')
  }
} catch (error) {
  logger.error('Failed to initialize Supabase client', error as Error)
}

export { supabaseDb }

// Database types for JustSpeak
export interface User {
  id: string
  auth_id: string
  email: string
  name?: string
  age_group: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  start_time: string
  end_time?: string
  mode: 'conversation' | 'learning'
  user_talk_time: number
  ai_talk_time: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Assessment {
  id: string
  session_id: string
  user_id: string
  message_id?: string
  original_text: string
  corrected_text: string
  corrections: any[]
  areas_to_improve: string[]
  assessment_notes?: string
  timestamp: string
}

export interface UserStats {
  id: string
  user_id: string
  daily_talk_time: number
  weekly_talk_time: number
  monthly_talk_time: number
  total_talk_time: number
  last_daily_update: string
  last_weekly_update: string
  last_monthly_update: string
  common_issues?: any
  improvement_areas?: any
  created_at: string
  updated_at: string
}

// Helper functions for database operations
export const db = {
  // User operations
  users: {
    async findByAuthId(authId: string) {
      const { data, error } = await supabaseDb
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single()
      
      if (error) throw error
      return data as User
    },
    
    async create(user: Partial<User>) {
      const { data, error } = await supabaseDb
        .from('users')
        .insert(user)
        .select()
        .single()
      
      if (error) throw error
      return data as User
    },
    
    async update(id: string, updates: Partial<User>) {
      const { data, error } = await supabaseDb
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as User
    }
  },
  
  // Session operations
  sessions: {
    async create(session: Partial<Session>) {
      const { data, error } = await supabaseDb
        .from('sessions')
        .insert(session)
        .select()
        .single()
      
      if (error) throw error
      return data as Session
    },
    
    async update(id: string, updates: Partial<Session>) {
      const { data, error } = await supabaseDb
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Session
    },
    
    async findByUserId(userId: string, limit = 10) {
      const { data, error } = await supabaseDb
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data as Session[]
    }
  },
  
  // Message operations
  messages: {
    async create(message: Partial<Message>) {
      const { data, error } = await supabaseDb
        .from('messages')
        .insert(message)
        .select()
        .single()
      
      if (error) throw error
      return data as Message
    },
    
    async findBySessionId(sessionId: string) {
      const { data, error } = await supabaseDb
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
      
      if (error) throw error
      return data as Message[]
    }
  },
  
  // Assessment operations
  assessments: {
    async create(assessment: Partial<Assessment>) {
      const { data, error } = await supabaseDb
        .from('assessments')
        .insert(assessment)
        .select()
        .single()
      
      if (error) throw error
      return data as Assessment
    },
    
    async findBySessionId(sessionId: string) {
      const { data, error } = await supabaseDb
        .from('assessments')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
      
      if (error) throw error
      return data as Assessment[]
    }
  },
  
  // User stats operations
  userStats: {
    async findByUserId(userId: string) {
      const { data, error } = await supabaseDb
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
      return data as UserStats | null
    },
    
    async create(stats: Partial<UserStats>) {
      const { data, error } = await supabaseDb
        .from('user_stats')
        .insert(stats)
        .select()
        .single()
      
      if (error) throw error
      return data as UserStats
    },
    
    async update(userId: string, updates: Partial<UserStats>) {
      const { data, error } = await supabaseDb
        .from('user_stats')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data as UserStats
    },
    
    async incrementTalkTime(userId: string, seconds: number) {
      // First get current stats
      let stats = await this.findByUserId(userId)
      
      if (!stats) {
        // Create new stats record
        stats = await this.create({
          user_id: userId,
          daily_talk_time: seconds,
          weekly_talk_time: seconds,
          monthly_talk_time: seconds,
          total_talk_time: seconds
        })
      } else {
        // Update existing stats
        const now = new Date()
        const lastDaily = new Date(stats.last_daily_update)
        const lastWeekly = new Date(stats.last_weekly_update)
        const lastMonthly = new Date(stats.last_monthly_update)
        
        // Reset daily if new day
        const dailyTime = isSameDay(now, lastDaily) 
          ? stats.daily_talk_time + seconds 
          : seconds
        
        // Reset weekly if new week
        const weeklyTime = isSameWeek(now, lastWeekly)
          ? stats.weekly_talk_time + seconds
          : seconds
        
        // Reset monthly if new month
        const monthlyTime = isSameMonth(now, lastMonthly)
          ? stats.monthly_talk_time + seconds
          : seconds
        
        stats = await this.update(userId, {
          daily_talk_time: dailyTime,
          weekly_talk_time: weeklyTime,
          monthly_talk_time: monthlyTime,
          total_talk_time: stats.total_talk_time + seconds,
          last_daily_update: isSameDay(now, lastDaily) ? stats.last_daily_update : now.toISOString(),
          last_weekly_update: isSameWeek(now, lastWeekly) ? stats.last_weekly_update : now.toISOString(),
          last_monthly_update: isSameMonth(now, lastMonthly) ? stats.last_monthly_update : now.toISOString()
        })
      }
      
      return stats
    }
  }
}

// Helper functions
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}

function isSameWeek(date1: Date, date2: Date): boolean {
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  return Math.abs(date1.getTime() - date2.getTime()) < oneWeek
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear()
}