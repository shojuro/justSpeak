import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Validation schema
const synthesizeSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().optional().default('nova'),
  speed: z.number().min(0.5).max(2).optional().default(1),
  provider: z.enum(['openai', 'elevenlabs', 'browser']).optional().default('browser')
})

// ElevenLabs voices mapping
const elevenLabsVoices = {
  'nova': '21m00Tcm4TlvDq8ikWAM', // Rachel
  'alloy': 'AZnzlk1XvdvUeBnXmlld', // Domi
  'echo': 'EXAVITQu4vr4xnSDxMaL', // Bella
  'fable': 'MF3mGyEYCl7XYWbV9V6O', // Elli
  'onyx': 'N2lVS1w4EtoT3dr4eOWO', // Callum
  'shimmer': 'ThT5KcBeYPX3keUQqHPh' // Charlotte
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate input
    const result = synthesizeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { text, voice, speed, provider } = result.data

    // Browser-based TTS (free, works offline)
    if (provider === 'browser') {
      // Return instructions for client-side synthesis
      return NextResponse.json({
        provider: 'browser',
        text,
        voice,
        speed,
        instructions: 'Use window.speechSynthesis API on client'
      })
    }

    // OpenAI TTS
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 503 }
        )
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice,
          speed: speed
        })
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('OpenAI TTS error', new Error(error))
        return NextResponse.json(
          { error: 'Failed to synthesize speech' },
          { status: response.status }
        )
      }

      // Stream the audio response
      const audioData = await response.arrayBuffer()
      return new NextResponse(audioData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioData.byteLength.toString(),
        }
      })
    }

    // ElevenLabs TTS
    if (provider === 'elevenlabs') {
      const apiKey = process.env.ELEVENLABS_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'ElevenLabs API key not configured' },
          { status: 503 }
        )
      }

      const voiceId = elevenLabsVoices[voice as keyof typeof elevenLabsVoices] || elevenLabsVoices.nova
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        logger.error('ElevenLabs TTS error', new Error(error))
        return NextResponse.json(
          { error: 'Failed to synthesize speech' },
          { status: response.status }
        )
      }

      // Stream the audio response
      const audioData = await response.arrayBuffer()
      return new NextResponse(audioData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioData.byteLength.toString(),
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid provider specified' },
      { status: 400 }
    )

  } catch (error) {
    logger.error('Voice synthesis error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}