'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { VoiceSynthesisStateManager } from '@/lib/speech-session-manager'

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
  const synthManagerRef = useRef(VoiceSynthesisStateManager.getInstance())
  const initPromiseRef = useRef<Promise<boolean> | null>(null)

  useEffect(() => {
    const initializeSynthesis = async () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setIsSupported(true)
        console.log('Speech synthesis supported, initializing...')
        
        // Initialize through state manager
        if (!initPromiseRef.current) {
          initPromiseRef.current = synthManagerRef.current.initialize()
        }
        
        await initPromiseRef.current
        const state = synthManagerRef.current.getReadyState()
        
        console.log('Speech synthesis initialization result:', state)
        
        // Load voices for the UI
        const loadVoices = () => {
          const availableVoices = window.speechSynthesis.getVoices()
          console.log('Available voices:', availableVoices.length)
          setVoices(availableVoices)
        }
        
        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices
        
        // Set ready based on manager state
        setIsReady(state.isReady)
      } else {
        console.error('Speech synthesis not available in window')
        setIsSupported(false)
        setIsReady(false)
      }
    }
    
    initializeSynthesis()
  }, [])

  const speakWithBrowser = useCallback((text: string) => {
    // Check window.speechSynthesis directly instead of relying on state
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported', { isSupported, hasSynthesis: !!window.speechSynthesis })
      setError('Speech synthesis not available')
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Set voice if available
      if (voices.length > 0) {
        // Try to find a good English voice
        const preferredVoices = [
          'Google US English',
          'Microsoft David - English (United States)',
          'Microsoft Mark - English (United States)',
          'Microsoft Zira - English (United States)',
          'Alex',
          'Samantha'
        ]
        
        let selectedVoice = null
        for (const preferred of preferredVoices) {
          selectedVoice = voices.find(v => v.name.includes(preferred))
          if (selectedVoice) break
        }
        
        // Fallback to any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                         voices.find(v => v.lang.startsWith('en'))
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice
          console.log('Selected voice:', selectedVoice.name)
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
  }, [voices, rate, pitch, volume])

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
        await response.json()
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