import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cors, corsConfigs } from '@/lib/cors'

// Security headers configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://api.elevenlabs.io wss://*.supabase.co https://*.supabase.co",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()
  
  // Apply CORS for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin') || ''
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      // Production domains
      'https://justspeak.vercel.app',
      'https://justspeak.app', // Add your custom domain here
    ]
    
    // Check if origin is allowed
    const isAllowed = process.env.NODE_ENV === 'development' 
      ? allowedOrigins.includes(origin) || origin === 'null' // file:// in dev only
      : allowedOrigins.includes(origin)
      
    if (isAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin || 'http://localhost:3000')
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    const corsConfig = process.env.NODE_ENV === 'production' 
      ? corsConfigs.production 
      : corsConfigs.development
    const corsMiddleware = cors(corsConfig)
    res = await corsMiddleware(req, res)
  }
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value)
  })
  
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}