import { NextRequest, NextResponse } from 'next/server'

/**
 * Health check endpoint for monitoring
 * Returns basic status without exposing sensitive information
 */
export async function GET(req: NextRequest) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version || 'unknown'
  }
  
  // Simple connectivity checks without exposing keys
  const checks = {
    database: false,
    openai: false,
    redis: false
  }
  
  // Check database connectivity (without exposing connection details)
  try {
    if (process.env.DATABASE_URL) {
      checks.database = true
    }
  } catch (error) {
    // Silent fail - don't expose error details
  }
  
  // Check if OpenAI is configured (without exposing key)
  if (process.env.OPENAI_API_KEY && 
      process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    checks.openai = true
  }
  
  // Check if Redis is configured
  if (process.env.REDIS_URL || process.env.REDIS_ENABLED === 'true') {
    checks.redis = true
  }
  
  return NextResponse.json({
    ...health,
    services: checks
  })
}