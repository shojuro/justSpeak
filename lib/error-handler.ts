import { NextResponse } from 'next/server'
import { logger } from './logger'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class AppError extends Error implements ApiError {
  statusCode: number
  code: string
  details?: any

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

export function handleApiError(error: unknown): NextResponse {
  logger.error('API Error', error as Error)

  // Default error response
  let statusCode = 500
  let message = 'An unexpected error occurred'
  let code = 'INTERNAL_ERROR'
  let details = undefined

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
    details = error.details
  } else if (error instanceof Error) {
    message = error.message
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      statusCode = 400
      code = 'VALIDATION_ERROR'
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401
      code = 'UNAUTHORIZED'
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403
      code = 'FORBIDDEN'
    } else if (error.name === 'NotFoundError') {
      statusCode = 404
      code = 'NOT_FOUND'
    }
  }

  // Log error details (in production, this would go to a logging service)
  const errorLog = {
    timestamp: new Date().toISOString(),
    statusCode,
    code,
    message,
    details,
    stack: error instanceof Error ? error.stack : undefined,
  }
  
  logger.error('Error details', new Error(errorLog.message), { errorLog })

  // Return error response
  const response = {
    error: {
      code,
      message: process.env.NODE_ENV === 'production' && statusCode === 500 
        ? 'An unexpected error occurred' 
        : message,
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    },
  }

  return NextResponse.json(response, { status: statusCode })
}

// Async error wrapper for API routes
export function asyncHandler(fn: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      return await fn(req, ...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}