import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    deployment: {
      environment: process.env.NODE_ENV || 'unknown',
      vercel: process.env.VERCEL === '1',
      url: process.env.VERCEL_URL || 'local',
      region: process.env.VERCEL_REGION || 'unknown'
    },
    configuration: {
      require_auth: process.env.REQUIRE_AUTH,
      require_auth_trimmed: process.env.REQUIRE_AUTH?.trim(),
      redis_enabled: process.env.REDIS_ENABLED,
      has_trailing_newlines: {
        openai_key: process.env.OPENAI_API_KEY?.includes('\n') || false,
        require_auth: process.env.REQUIRE_AUTH?.includes('\n') || false,
        node_env: process.env.NODE_ENV?.includes('\n') || false
      }
    },
    apis: {
      openAI: await checkOpenAI(),
      elevenLabs: await checkElevenLabs(),
      supabase: await checkSupabase()
    },
    routes: {
      chat: await testRoute('/api/chat', 'POST', { message: 'Health check test' }),
      verify_setup: await testRoute('/api/verify-setup', 'GET')
    }
  }
  
  return NextResponse.json(checks)
}

async function checkOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  
  const result = {
    configured: !!(apiKey && apiKey !== 'your_openai_api_key_here'),
    keyLength: apiKey ? apiKey.length : 0,
    keyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : null,
    status: 'not configured',
    error: null as string | null
  }
  
  if (result.configured && apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      
      if (response.ok) {
        result.status = 'working'
      } else {
        result.status = 'error'
        const errorText = await response.text()
        result.error = `Status ${response.status}: ${errorText.substring(0, 100)}...`
      }
    } catch (error) {
      result.status = 'error'
      result.error = error instanceof Error ? error.message : 'Unknown error'
    }
  }
  
  return result
}

async function checkElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
  
  return {
    configured: !!(apiKey && apiKey !== 'your_elevenlabs_api_key_here'),
    keyLength: apiKey ? apiKey.length : 0,
    keyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : null
  }
}

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const dbUrl = process.env.DATABASE_URL?.trim()
  
  return {
    url_configured: !!url,
    anon_key_configured: !!anonKey,
    database_url_configured: !!dbUrl,
    url_has_newline: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('\n') || false
  }
}

async function testRoute(path: string, method: string = 'GET', body?: any) {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    if (body && method === 'POST') {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${baseUrl}${path}`, options)
    
    return {
      status: response.status,
      ok: response.ok,
      tested: true
    }
  } catch (error) {
    return {
      status: 0,
      ok: false,
      tested: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}