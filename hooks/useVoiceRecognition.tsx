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
  const streamRef = useRef<MediaStream | null>(null)

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
        recognition.maxAlternatives = 1 // Only get the best result

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
        }

        recognition.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          // Only process NEW results starting from resultIndex
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcript = result[0].transcript
            
            if (result.isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          // For continuous recognition, we only want the current utterance
          const currentTranscript = (finalTranscript + interimTranscript).trim()
          
          if (currentTranscript) {
            setTranscript(currentTranscript)
            
            if (onTranscript) {
              onTranscript(currentTranscript)
            }
            
            // Call final transcript callback if we have final results
            if (finalTranscript && onFinalTranscript) {
              onFinalTranscript(finalTranscript.trim())
            }
          }
        }

        recognition.onerror = (event: any) => {
          const errorMessage = event.error || 'Unknown error'
          setError(`Speech recognition error: ${errorMessage}`)
          setIsListening(false)
          
          // Handle common errors
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            setError('Microphone permission denied. Please allow microphone access and refresh the page.')
          } else if (event.error === 'no-speech') {
            setError('No speech detected. Please try speaking again.')
          } else if (event.error === 'network') {
            setError('Network error. Please check your connection.')
          } else if (event.error === 'aborted') {
            setError('Speech recognition stopped. Click the microphone to start again.')
          } else {
            setError(`Speech recognition error: ${event.error}`)
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech
          channelCount: 1, // Mono is sufficient for speech
          // Advanced constraints for better noise handling
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        } as any
      })
      streamRef.current = stream
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
        console.error('Transcription API error:', {
          status: response.status,
          error: errorData,
          provider: provider
        })
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
      console.error('Transcription error:', {
        provider: provider,
        error: error.message,
        stack: error.stack
      })
      setError(`Failed to transcribe audio: ${error.message}`)
      
      // If using OpenAI and it fails, suggest using browser
      if (provider === 'openai') {
        setError(`OpenAI transcription failed. Try switching to browser voice recognition in settings.`)
      }
    }
  }, [provider, language, onTranscript, onFinalTranscript])

  // Start listening
  const startListening = useCallback(async () => {
    // Check microphone permissions first
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        } as any
      })
      // Stop test stream immediately
      testStream.getTracks().forEach(track => track.stop())
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access in your browser settings.')
      console.error('Microphone permission error:', err)
      return
    }
    
    if (provider === 'browser') {
      if (!recognitionRef.current) {
        // Try to initialize again
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) {
          setError('Speech recognition not available. Please use Chrome, Edge, or Safari on desktop/mobile.')
          console.error('Browser Speech Recognition not available')
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
    console.log('Stopping voice recognition')
    if (provider === 'browser') {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.abort() // Use abort instead of stop for immediate termination
        } catch (e) {
          console.error('Error stopping recognition:', e)
        }
      }
    } else {
      // Stop API-based recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
        setIsListening(false)
      }
      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
    // Clear transcript when stopping
    setTranscript('')
    setIsListening(false)
  }, [provider, isListening])
  
  // Clear transcript manually
  // clearTranscript defined in return statement

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