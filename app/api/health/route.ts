import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  
  // Check API keys
  const openAIConfigured = !!(apiKey && apiKey !== 'your_openai_api_key_here')
  const elevenLabsConfigured = !!(elevenLabsKey && elevenLabsKey !== 'your_elevenlabs_api_key_here')
  
  // Test OpenAI API if configured
  let openAIStatus = 'not configured'
  let openAIError = null
  
  if (openAIConfigured) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      
      if (response.ok) {
        openAIStatus = 'working'
      } else {
        openAIStatus = 'error'
        openAIError = `Status: ${response.status}`
      }
    } catch (error) {
      openAIStatus = 'error'
      openAIError = error instanceof Error ? error.message : 'Unknown error'
    }
  }
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    apis: {
      openAI: {
        configured: openAIConfigured,
        status: openAIStatus,
        error: openAIError,
        keyLength: apiKey ? apiKey.length : 0
      },
      elevenLabs: {
        configured: elevenLabsConfigured,
        keyLength: elevenLabsKey ? elevenLabsKey.length : 0
      }
    }
  })
}