'use client'

import { useEffect, useRef, useState } from 'react'

interface UseSpeechRecognitionReturn {
  transcript: string
  isListening: boolean
  startListening: () => void
  stopListening: () => void
  error: string | null
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const clearTranscript = () => setTranscript('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        console.log('[SpeechRecognition] Started')
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

        if (finalTranscript) {
          console.log('[SpeechRecognition] Final transcript:', finalTranscript.trim())
          setTranscript(finalTranscript.trim())
        }
      }

      recognition.onerror = (event: any) => {
        console.error('[SpeechRecognition] Error:', event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log('[SpeechRecognition] Ended')
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    error,
  }
}