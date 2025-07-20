import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // For MVP, redirect all auth pages to practice
  const authPaths = ['/auth', '/settings', '/onboarding', '/dashboard']
  
  if (authPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/practice', req.url))
  }
  
  // Let everything else through
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