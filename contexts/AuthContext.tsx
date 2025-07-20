'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth, getUserProfile, UserProfile, onAuthStateChange, updateUserProfile } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'github' | 'facebook') => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { showToast } = useToast()

  // Load user session on mount
  useEffect(() => {
    loadSession()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      
      if (event === 'SIGNED_IN' && session) {
        setSession(session)
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        router.push('/auth/login')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadSession = async () => {
    try {
      const { session: currentSession } = await auth.getSession()
      
      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
        await loadUserProfile(currentSession.user.id)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    const userProfile = await getUserProfile(userId)
    if (userProfile) {
      setProfile(userProfile)
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true)
    try {
      const { user, error } = await auth.signUp(email, password, metadata)
      
      if (error) throw error
      
      if (user) {
        showToast('Account created! Please check your email to verify.', 'success')
        router.push('/auth/verify-email')
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to create account', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user, session, error } = await auth.signIn(email, password)
      
      if (error) throw error
      
      if (user && session) {
        setUser(user)
        setSession(session)
        await loadUserProfile(user.id)
        showToast('Welcome back!', 'success')
        router.push('/dashboard')
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to sign in', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github' | 'facebook') => {
    setLoading(true)
    try {
      const { url, error } = await auth.signInWithProvider(provider)
      
      if (error) throw error
      
      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      showToast(error.message || `Failed to sign in with ${provider}`, 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await auth.signOut()
      
      if (error) throw error
      
      setUser(null)
      setSession(null)
      setProfile(null)
      showToast('Signed out successfully', 'info')
      router.push('/')
    } catch (error: any) {
      showToast(error.message || 'Failed to sign out', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await auth.resetPassword(email)
      
      if (error) throw error
      
      showToast('Password reset email sent! Check your inbox.', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to send reset email', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return
    
    setLoading(true)
    try {
      const { error } = await updateUserProfile(user.id, updates)
      
      if (error) throw error
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      showToast('Profile updated successfully', 'success')
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}