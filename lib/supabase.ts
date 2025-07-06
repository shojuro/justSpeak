import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Types for database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          age_group: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          age_group?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          age_group?: string
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          mode: string
          user_talk_time: number
          ai_talk_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time?: string
          end_time?: string | null
          mode?: string
          user_talk_time?: number
          ai_talk_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          mode?: string
          user_talk_time?: number
          ai_talk_time?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}