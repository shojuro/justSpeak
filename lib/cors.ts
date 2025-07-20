import { NextRequest, NextResponse } from 'next/server'

export interface CorsOptions {
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

const defaultOptions: CorsOptions = {
  allowedOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_APP_URL || 'https://talktime.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400, // 24 hours
}

export function cors(options: CorsOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return async function corsMiddleware(
    request: NextRequest,
    response?: NextResponse
  ): Promise<NextResponse> {
    // Get origin from request
    const origin = request.headers.get('origin') || ''
    
    // Create response if not provided
    const res = response || NextResponse.next()

    // Check if origin is allowed
    const isAllowedOrigin = !config.allowedOrigins || 
      config.allowedOrigins.includes('*') ||
      config.allowedOrigins.includes(origin)

    if (isAllowedOrigin && origin) {
      res.headers.set('Access-Control-Allow-Origin', origin)
    }

    // Handle credentials
    if (config.credentials) {
      res.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      // Set allowed methods
      if (config.allowedMethods) {
        res.headers.set(
          'Access-Control-Allow-Methods',
          config.allowedMethods.join(', ')
        )
      }

      // Set allowed headers
      if (config.allowedHeaders) {
        res.headers.set(
          'Access-Control-Allow-Headers',
          config.allowedHeaders.join(', ')
        )
      }

      // Set max age
      if (config.maxAge) {
        res.headers.set(
          'Access-Control-Max-Age',
          config.maxAge.toString()
        )
      }

      return new NextResponse(null, { status: 200, headers: res.headers })
    }

    // Set exposed headers for actual requests
    if (config.exposedHeaders) {
      res.headers.set(
        'Access-Control-Expose-Headers',
        config.exposedHeaders.join(', ')
      )
    }

    return res
  }
}

// API Route wrapper with CORS
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: CorsOptions
) {
  const corsMiddleware = cors(options)

  return async function corsHandler(req: NextRequest): Promise<NextResponse> {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return corsMiddleware(req)
    }

    try {
      // Execute the actual handler
      const response = await handler(req)
      
      // Apply CORS headers to the response
      return corsMiddleware(req, response)
    } catch (error) {
      // Even on error, we need CORS headers
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
      return corsMiddleware(req, errorResponse)
    }
  }
}

// Environment-specific CORS configurations
export const corsConfigs = {
  // Development - more permissive
  development: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'file://',  // Allow file:// URLs for testing
      null  // Allow null origin for file:// in some browsers
    ].filter(Boolean),
    credentials: true,
  },
  
  // Production - restrictive
  production: {
    allowedOrigins: [
      process.env.NEXT_PUBLIC_APP_URL || 'https://talktime.app',
      'https://www.talktime.app',
    ],
    credentials: true,
  },
  
  // Public API - no credentials
  publicApi: {
    allowedOrigins: ['*'],
    credentials: false,
    allowedMethods: ['GET', 'POST'],
    maxAge: 3600, // 1 hour
  },
}