'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseVoiceRecognitionProps {
  provider?: 'browser' | 'openai' | 'google'
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onTranscript?: (transcript: string) => void
  onFinalTranscript?: (transcript: string) => void
}

export function useVoiceRecognition({
  provider = 'browser',
  continuous = false,
  interimResults = true,
  language = 'en-US',
  onTranscript,
  onFinalTranscript
}: UseVoiceRecognitionProps = {}) {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Initialize browser speech recognition
  useEffect(() => {
    if (provider === 'browser' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.lang = language

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
        }

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          const fullTranscript = finalTranscript || interimTranscript
          setTranscript(fullTranscript.trim())
          
          if (onTranscript) {
            onTranscript(fullTranscript.trim())
          }
          
          if (finalTranscript && onFinalTranscript) {
            onFinalTranscript(finalTranscript.trim())
          }
        }

        recognition.onerror = (event: any) => {
          const errorMessage = event.error || 'Unknown error'
          setError(`Speech recognition error: ${errorMessage}`)
          setIsListening(false)
          
          // Handle common errors
          if (errorMessage === 'not-allowed') {
            setError('Microphone permission denied. Please allow microphone access.')
          } else if (errorMessage === 'no-speech') {
            setError('No speech detected. Please try again.')
          } else if (errorMessage === 'network') {
            setError('Network error. Please check your connection.')
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } else {
        setError('Speech recognition is not supported in this browser')
        setIsSupported(false)
      }
    } else if (provider === 'browser') {
      setError('Speech recognition is not available')
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [provider, continuous, interimResults, language, onTranscript, onFinalTranscript])

  // Start recording for API-based recognition
  const startAPIRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeWithAPI(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsListening(true)
      setError(null)
    } catch (err) {
      const error = err as Error
      setError(`Failed to access microphone: ${error.message}`)
      setIsListening(false)
    }
  }, [provider])

  // Transcribe audio using API
  const transcribeWithAPI = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', language) // Full locale like en-US
      formData.append('provider', provider)

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to transcribe audio')
      }

      const data = await response.json()
      const transcribedText = data.text || ''
      
      setTranscript(transcribedText)
      
      if (onTranscript) {
        onTranscript(transcribedText)
      }
      
      if (onFinalTranscript) {
        onFinalTranscript(transcribedText)
      }
    } catch (err) {
      const error = err as Error
      setError(`Failed to transcribe audio: ${error.message}`)
    }
  }, [provider, language, onTranscript, onFinalTranscript])

  // Start listening
  const startListening = useCallback(async () => {
    if (provider === 'browser') {
      if (!recognitionRef.current) {
        // Try to initialize again
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) {
          setError('Speech recognition not available in this browser')
          return
        }
        
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
        }
        
        recognition.onerror = (event: any) => {
          const errorMessage = event.error || 'Unknown error'
          setError(`Speech recognition error: ${errorMessage}`)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
      
      setTranscript('')
      try {
        await recognitionRef.current.start()
      } catch (err) {
        const error = err as Error
        if (error.message.includes('already started')) {
          // Already running, ignore
        } else {
          setError(`Failed to start: ${error.message}`)
        }
      }
    } else {
      // Use API-based recognition
      startAPIRecording()
    }
  }, [provider, startAPIRecording])

  // Stop listening
  const stopListening = useCallback(() => {
    if (provider === 'browser') {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
    } else {
      // Stop API-based recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        setIsListening(false)
      }
    }
  }, [provider, isListening])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    transcript,
    isListening,
    error,
    isSupported: provider === 'browser' ? isSupported : true,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript: () => setTranscript(''),
  }
}