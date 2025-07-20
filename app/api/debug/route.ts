import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length || 0,
      prefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not set'
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set'
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    },
    ELEVENLABS_API_KEY: {
      exists: !!process.env.ELEVENLABS_API_KEY,
      length: process.env.ELEVENLABS_API_KEY?.length || 0
    },
    JWT_SECRET: {
      exists: !!process.env.JWT_SECRET,
      length: process.env.JWT_SECRET?.length || 0
    },
    REQUIRE_AUTH: process.env.REQUIRE_AUTH,
    // Test crypto
    cryptoTest: {
      randomUUID: 'testing...'
    }
  }
  
  try {
    const { randomUUID } = require('crypto')
    envCheck.cryptoTest.randomUUID = randomUUID()
  } catch (error) {
    envCheck.cryptoTest.randomUUID = `Error: ${error}`
  }
  
  // Test OpenAI API
  const openAITest = {
    apiKeyValid: false,
    error: null as any
  }
  
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      })
      
      openAITest.apiKeyValid = response.ok
      if (!response.ok) {
        openAITest.error = {
          status: response.status,
          statusText: response.statusText,
          body: await response.text()
        }
      }
    } catch (error) {
      openAITest.error = error instanceof Error ? error.message : 'Unknown error'
    }
  }
  
  return NextResponse.json({
    status: 'Debug endpoint',
    timestamp: new Date().toISOString(),
    env: envCheck,
    openAI: openAITest,
    headers: {
      origin: req.headers.get('origin'),
      host: req.headers.get('host'),
      userAgent: req.headers.get('user-agent')
    }
  })
}