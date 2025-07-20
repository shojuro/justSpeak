import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('Test chat endpoint called')
    
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        debug: {
          keyExists: false,
          envVars: Object.keys(process.env).filter(k => k.includes('OPENAI'))
        }
      }, { status: 503 })
    }
    
    // Try a simple OpenAI call
    const testBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello in 5 words or less.' }
      ],
      max_tokens: 50
    }
    
    console.log('Calling OpenAI API...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(testBody)
    })
    
    console.log('OpenAI response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: 'OpenAI API error',
        status: response.status,
        details: errorText
      }, { status: response.status })
    }
    
    const data = await response.json()
    return NextResponse.json({
      success: true,
      reply: data.choices[0]?.message?.content || 'No response',
      model: data.model,
      usage: data.usage
    })
    
  } catch (error) {
    console.error('Test chat error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}