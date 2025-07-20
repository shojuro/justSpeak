'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'

interface UseSpeechSynthesisProps {
  provider?: 'browser' | 'openai' | 'elevenlabs'
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

export function useSpeechSynthesis({
  provider = 'browser',
  voice = 'nova',
  rate = 1,
  pitch = 1,
  volume = 1
}: UseSpeechSynthesisProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
        if (availableVoices.length > 0) {
          setIsReady(true)
        }
      }

      // Load voices immediately
      loadVoices()
      
      // Also listen for voices changed event
      window.speechSynthesis.onvoiceschanged = loadVoices
      
      // Force load voices on some browsers
      if (window.speechSynthesis.getVoices().length === 0) {
        // Speak empty string to trigger voice loading
        const utterance = new SpeechSynthesisUtterance('')
        utterance.volume = 0
        window.speechSynthesis.speak(utterance)
        window.speechSynthesis.cancel()
      }
      
      // Set ready after a delay if voices still haven't loaded
      setTimeout(() => {
        if (!isReady && isSupported) {
          setIsReady(true)
        }
      }, 500)
    }
  }, [isReady, isSupported])

  const speakWithBrowser = useCallback((text: string) => {
    if (!isSupported || !window.speechSynthesis) {
      setError('Speech synthesis not available')
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Set voice if available
      if (voices.length > 0) {
        // Try to find a male English voice (or the first English voice)
        const maleVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'))
        const englishVoice = voices.find(v => v.lang.startsWith('en'))
        const selectedVoice = maleVoice || englishVoice
        
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume
      utterance.lang = 'en-US'

      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
        setError(null)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
        resolve()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        setIsPaused(false)
        const errorMsg = `Speech error: ${event.error || 'Unknown'}`
        setError(errorMsg)
        resolve()
      }

      try {
        window.speechSynthesis.speak(utterance)
      } catch (err) {
        setError('Failed to speak')
        resolve()
      }
    })
  }, [isSupported, voices, rate, pitch, volume])

  const speakWithAPI = useCallback(async (text: string, useProvider: string) => {
    try {
      setIsSpeaking(true)
      setError(null)
      
      // Use different endpoint for ElevenLabs
      const endpoint = useProvider === 'elevenlabs' ? '/api/speech' : '/api/voice/synthesize'
      const body = useProvider === 'elevenlabs' 
        ? { text, voiceId: voice } 
        : { text, voice, speed: rate, provider: useProvider }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to synthesize speech')
      }

      if (useProvider === 'browser') {
        // Handle browser-based synthesis
        const data = await response.json()
        await speakWithBrowser(text)
        return
      }

      // For API providers, play the audio
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.playbackRate = rate
      audio.volume = volume

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
          resolve()
        }

        audio.onerror = () => {
          setIsSpeaking(false)
          setError('Failed to play audio')
          URL.revokeObjectURL(audioUrl)
          reject(new Error('Audio playback failed'))
        }

        audio.play().catch(err => {
          setIsSpeaking(false)
          setError('Failed to play audio: ' + err.message)
          URL.revokeObjectURL(audioUrl)
          reject(err)
        })
      })
    } catch (error) {
      setIsSpeaking(false)
      const errorMessage = error instanceof Error ? error.message : 'Failed to speak text'
      setError(errorMessage)
      
      // Fallback to browser synthesis
      if (useProvider !== 'browser') {
        showToast('Falling back to browser voice', 'info')
        await speakWithBrowser(text)
      }
    }
  }, [voice, rate, volume, speakWithBrowser, showToast])

  const speak = useCallback(async (text: string) => {
    if (!text) return

    if (provider === 'browser') {
      await speakWithBrowser(text)
    } else {
      await speakWithAPI(text, provider)
    }
  }, [provider, speakWithBrowser, speakWithAPI])

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused && window.speechSynthesis) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isSupported, isSpeaking, isPaused])

  const resume = useCallback(() => {
    if (isSupported && isSpeaking && isPaused && window.speechSynthesis) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }, [isSupported, isSpeaking, isPaused])

  const stop = useCallback(() => {
    if (isSupported && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }, [isSupported])

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
    isReady,
    voices,
    error,
  }
}