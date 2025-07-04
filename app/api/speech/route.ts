import { NextRequest, NextResponse } from 'next/server'

interface SpeechRequest {
  text: string
  voiceId?: string
}

interface ElevenLabsVoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
      console.error('ElevenLabs API key not configured')
      return NextResponse.json(
        { error: 'Speech service not configured' },
        { status: 503 }
      )
    }

    // Parse request body
    const body: SpeechRequest = await req.json()
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = body

    // Validate input
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text is too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Voice settings for natural speech
    const voiceSettings: ElevenLabsVoiceSettings = {
      stability: 0.75,
      similarity_boost: 0.85,
      style: 0.5,
      use_speaker_boost: true
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: voiceSettings
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('ElevenLabs API error:', errorData)
      throw new Error(errorData.detail?.message || 'Speech generation failed')
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer()

    // Return audio data
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Speech API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
}