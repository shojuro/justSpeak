import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // If Supabase is not configured, allow access (development mode)
  if (!supabaseUrl || !supabaseAnonKey) {
    return res
  }
  
  // In development mode, allow dashboard access without auth
  if (process.env.NODE_ENV === 'development' && req.nextUrl.pathname.startsWith('/dashboard')) {
    return res
  }
  
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Redirect to auth if accessing protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // Redirect to home if accessing auth with active session
  if (req.nextUrl.pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/auth/:path*'],
}