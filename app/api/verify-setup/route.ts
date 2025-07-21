import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    console.log('Verify setup endpoint called')
    
    // Check environment variables
    const checks = {
      openai_key_exists: !!process.env.OPENAI_API_KEY,
      openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
      openai_key_has_newline: process.env.OPENAI_API_KEY?.includes('\n') || false,
      require_auth: process.env.REQUIRE_AUTH,
      node_env: process.env.NODE_ENV,
      supabase_url_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_url_has_newline: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('\n') || false,
    }
    
    // Test OpenAI API if key exists
    let openai_test = { success: false, error: 'No API key' }
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        })
        
        if (response.ok) {
          openai_test = { success: true, error: null }
        } else {
          const errorText = await response.text()
          openai_test = { 
            success: false, 
            error: `${response.status}: ${errorText.substring(0, 100)}...` 
          }
        }
      } catch (error) {
        openai_test = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks,
      openai_test,
      deployment_url: 'https://just-speak-2155muecy-shojuros-projects.vercel.app'
    })
    
  } catch (error) {
    console.error('Verify setup error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}