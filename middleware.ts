import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // For MVP, redirect auth pages to home page
  const authPaths = ['/auth', '/settings', '/onboarding']
  
  if (authPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  // Let everything else through, including /dashboard and API routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}