import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

// Supported audio formats
const SUPPORTED_FORMATS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export async function POST(req: NextRequest) {
  try {
    // Authentication is mandatory
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'en'
    const provider = formData.get('provider') as string || 'openai'

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 25MB limit' },
        { status: 400 }
      )
    }

    // Validate file format
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Unsupported format. Supported: ${SUPPORTED_FORMATS.join(', ')}` },
        { status: 400 }
      )
    }

    // OpenAI Whisper transcription
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 503 }
        )
      }

      // Create form data for OpenAI
      const openaiFormData = new FormData()
      openaiFormData.append('file', audioFile)
      openaiFormData.append('model', 'whisper-1')
      // Convert language code to ISO-639-1 format for OpenAI
      const iso639Language = language.toLowerCase().split('-')[0] // Convert en-US to en
      openaiFormData.append('language', iso639Language)
      openaiFormData.append('response_format', 'json')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: openaiFormData
      })

      if (!response.ok) {
        const error = await response.text()
        logger.error('OpenAI Whisper error', new Error(error))
        return NextResponse.json(
          { error: 'Failed to transcribe audio' },
          { status: response.status }
        )
      }

      const data = await response.json()
      
      return NextResponse.json({
        text: data.text,
        language: data.language || language,
        duration: data.duration,
        provider: 'openai'
      })
    }

    // Google Speech-to-Text (alternative)
    if (provider === 'google') {
      const apiKey = process.env.GOOGLE_SPEECH_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Google Speech API key not configured' },
          { status: 503 }
        )
      }

      // Convert audio file to base64
      const arrayBuffer = await audioFile.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString('base64')

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: language,
              enableAutomaticPunctuation: true,
              model: 'latest_long'
            },
            audio: {
              content: base64Audio
            }
          })
        }
      )

      if (!response.ok) {
        const error = await response.text()
        logger.error('Google Speech error', new Error(error))
        return NextResponse.json(
          { error: 'Failed to transcribe audio' },
          { status: response.status }
        )
      }

      const data = await response.json()
      const transcript = data.results
        ?.map((result: any) => result.alternatives[0].transcript)
        .join(' ') || ''

      return NextResponse.json({
        text: transcript,
        language: language,
        confidence: data.results?.[0]?.alternatives[0].confidence,
        provider: 'google'
      })
    }

    // Browser-based transcription fallback
    if (provider === 'browser') {
      return NextResponse.json({
        provider: 'browser',
        instructions: 'Use Web Speech API on client for real-time transcription',
        note: 'Server-side transcription not available for browser provider'
      })
    }

    return NextResponse.json(
      { error: 'Invalid provider specified' },
      { status: 400 }
    )

  } catch (error) {
    logger.error('Voice transcription error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}