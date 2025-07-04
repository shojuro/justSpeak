'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseElevenLabsSpeechReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  error: string | null
}

interface ElevenLabsVoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

export function useElevenLabsSpeech(
  voiceId: string = 'pFZP5JQG7iQjIQuC4Bku', // Default to "Hope" voice
  fallbackToBrowser: boolean = true
): UseElevenLabsSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Voice settings for more natural speech
  const voiceSettings: ElevenLabsVoiceSettings = {
    stability: 0.75,
    similarity_boost: 0.85,
    style: 0.5,
    use_speaker_boost: true
  }

  // Browser TTS fallback
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('Speech synthesis is not supported')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    utterance.onstart = () => {
      setIsSpeaking(true)
      setError(null)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`)
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  const speak = useCallback(async (text: string) => {
    try {
      // Stop any ongoing speech
      stop()

      setIsSpeaking(true)
      setError(null)

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()

      // Call our API route (which handles the ElevenLabs API securely)
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voiceId: voiceId
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail?.message || `ElevenLabs API error: ${response.status}`)
      }

      // Get audio data
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Create and play audio
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      audioRef.current.onerror = () => {
        setError('Failed to play audio')
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audioRef.current.play()

    } catch (err) {
      console.error('ElevenLabs speech error:', err)
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // Request was aborted, not an error
          return
        }
        setError(err.message)
      } else {
        setError('Failed to generate speech')
      }

      setIsSpeaking(false)

      // Fallback to browser TTS if enabled
      if (fallbackToBrowser) {
        console.log('Falling back to browser TTS')
        speakWithBrowserTTS(text)
      }
    }
  }, [voiceId, fallbackToBrowser, speakWithBrowserTTS])

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Cancel any ongoing API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Stop browser TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setIsSpeaking(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    speak,
    stop,
    isSpeaking,
    error,
  }
}

// Available ElevenLabs voice IDs (you can expand this list)
export const ELEVENLABS_VOICES = {
  hope: 'pFZP5JQG7iQjIQuC4Bku', // Female, soft and warm
  bella: 'EXAVITQu4vr4xnSDxMaL', // Female, young
  rachel: '21m00Tcm4TlvDq8ikWAM', // Female, mature
  antoni: 'ErXwobaYiN019PkySvjV', // Male, young
  josh: 'TxGEqnHWrfWFTfGW9XjX', // Male, mature
  arnold: 'VR6AewLTigWG4xSOukaG', // Male, deep
  adam: 'pNInz6obpgDQGcFmaJgB', // Male, middle aged
  sam: 'yoZ06aMxZJJ28mfd3POQ', // Male, young
} as const