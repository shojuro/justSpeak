import { NextRequest, NextResponse } from 'next/server'
import { checkAPIConfiguration } from '@/lib/api-config'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Get API configuration status
    const status = checkAPIConfiguration()
    
    // Return the status
    return NextResponse.json(status)
  } catch (error) {
    logger.error('Config status error', error as Error)
    return NextResponse.json(
      { error: 'Failed to check API configuration' },
      { status: 500 }
    )
  }
}