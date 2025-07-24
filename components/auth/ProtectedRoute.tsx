'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, getUserRole } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredRole?: 'student' | 'teacher' | 'admin'
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  requiredRole,
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [user, loading, router, redirectTo])

  useEffect(() => {
    const checkPermissions = async () => {
      if (user && (requiredPermission || requiredRole)) {
        const userRole = await getUserRole(user.id)
        
        if (requiredRole && userRole.role !== requiredRole) {
          router.push('/unauthorized')
          return
        }
        
        if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
          router.push('/unauthorized')
          return
        }
      }
    }

    if (user) {
      checkPermissions()
    }
  }, [user, requiredPermission, requiredRole, router])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-charcoal">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-warm-coral">Loading...</p>
      </div>
    </div>
  )
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredPermission?: string
    requiredRole?: 'student' | 'teacher' | 'admin'
    redirectTo?: string
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}