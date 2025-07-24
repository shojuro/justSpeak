import { supabase } from './supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { logger } from './logger'

export interface AuthResponse {
  user?: User | null
  session?: Session | null
  error?: AuthError | null
}

export interface UserProfile {
  id: string
  email: string
  name?: string | null
  age_group?: string
  avatar_url?: string | null
  preferred_language?: string
  learning_goals?: string[]
  created_at: string
  updated_at: string
}

// Authentication functions
export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: { name?: string; age_group?: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      // Create user profile
      if (data.user) {
        await createUserProfile(data.user.id, email, metadata)
      }

      return { user: data.user, session: data.session, error: null }
    } catch (error) {
      return { user: null, session: null, error: error as AuthError }
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { user: data.user, session: data.session, error: null }
    } catch (error) {
      return { user: null, session: null, error: error as AuthError }
    }
  },

  // Sign in with social providers
  async signInWithProvider(provider: 'google' | 'github' | 'facebook') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      return { url: data.url, error: null }
    } catch (error) {
      return { url: null, error: error as AuthError }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error: error as AuthError }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error) {
      return { session: null, error: error as AuthError }
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  },

  // Verify email with OTP
  async verifyEmail(email: string, token: string) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }
}

// User profile functions
export async function createUserProfile(
  userId: string, 
  email: string, 
  metadata?: { name?: string; age_group?: string }
) {
  try {
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name: metadata?.name || null,
        age_group: metadata?.age_group || 'adult',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return { error: null }
  } catch (error) {
    logger.error('Error creating user profile', error)
    return { error }
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Error fetching user profile', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error }
  }
}

// Session management
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// Role-based access control
export interface UserRole {
  role: 'student' | 'teacher' | 'admin'
  permissions: string[]
}

export async function getUserRole(_userId: string): Promise<UserRole> {
  // For now, return default student role
  // In production, this would query a roles table
  return {
    role: 'student',
    permissions: ['read:own_profile', 'write:own_profile', 'read:sessions', 'write:sessions']
  }
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return userRole.permissions.includes(permission)
}

// Activity logging
export async function logUserActivity(
  userId: string, 
  action: string, 
  metadata?: Record<string, any>
) {
  try {
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        action,
        metadata,
        created_at: new Date().toISOString()
      })

    if (error) throw error
    return { error: null }
  } catch (error) {
    logger.error('Error logging activity', error)
    return { error }
  }
}