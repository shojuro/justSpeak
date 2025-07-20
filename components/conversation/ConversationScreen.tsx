'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { checkAPIConfiguration, getBestProvider, getSavedProvider } from '@/lib/api-config-client'
import MessageList, { Message } from './MessageList'
import SessionControls from './SessionControls'
import ConversationHeader from './ConversationHeader'
import ProviderSelector from './ProviderSelector'
import VoiceDebugPanel from '@/components/VoiceDebugPanel'
import { SESSION_CONFIG, ERROR_MESSAGES } from '@/lib/constants'
import { logger } from '@/lib/logger'

interface ConversationScreenProps {
  onEnd: (talkTime: number) => void
}

export default function ConversationScreen({ onEnd }: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [talkTime, setTalkTime] = useState(0)
  const [userSpeakingTime, setUserSpeakingTime] = useState(0)
  const [lastTranscript, setLastTranscript] = useState('')
  const [mode, setMode] = useState<'conversation' | 'learning'>('conversation')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [voiceProvider, setVoiceProvider] = useState<'browser' | 'openai' | 'google'>('browser')
  const [synthProvider, setSynthProvider] = useState<'browser' | 'openai' | 'elevenlabs'>('browser')
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('1t1EeRixsJrKbiF1zwM6') // Jerry B. voice
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(true) // Show debug panel by default
  
  // Refs for tracking time
  const talkStartRef = useRef<Date | null>(null)
  const talkTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const speakingStartRef = useRef<Date | null>(null)
  const processingRef = useRef<boolean>(false)

  // Speech hooks with API support
  const { 
    transcript, 
    isListening, 
    startListening, 
    stopListening, 
    error: speechError 
  } = useVoiceRecognition({
    provider: voiceProvider,
    continuous: true,
    interimResults: true,
    language: 'en-US',
    onFinalTranscript: (text) => logger.debug('Final transcript', { text })
  })
  
  const { 
    speak, 
    isSpeaking, 
    stop: stopSpeaking,
    error: synthError 
  } = useSpeechSynthesis({
    provider: synthProvider,
    voice: synthProvider === 'elevenlabs' ? elevenLabsVoiceId : 'nova',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  })

  // Define sendInitialGreeting before using it in useEffect
  const sendInitialGreeting = useCallback(async () => {
    const greeting = "Hello! I'm TalkTime, your friendly English conversation partner. What would you like to talk about today?"
    
    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }
    
    setMessages([message])
    await speak(greeting)
  }, [speak])

  // Initialize providers and start session
  useEffect(() => {
    // Load provider preferences
    const initializeProviders = async () => {
      const status = await checkAPIConfiguration()
      
      // Check saved preferences first, then fall back to best available
      const savedSTT = getSavedProvider('stt') as 'browser' | 'openai' | 'google'
      const savedTTS = getSavedProvider('tts') as 'browser' | 'openai' | 'elevenlabs'
      
      // For MVP, default to browser for STT to avoid API issues
      const bestSTT = savedSTT || 'browser'
      const bestTTS = savedTTS || getBestProvider('tts', status) as 'browser' | 'openai' | 'elevenlabs' || 'browser'
      
      setVoiceProvider(bestSTT)
      setSynthProvider(bestTTS)
    }
    
    initializeProviders()
    
    const startSession = async () => {
      try {
        const response = await fetch('/api/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (response.ok) {
          const data = await response.json()
          setSessionId(data.sessionId)
        } else {
          // If session creation fails (e.g., not authenticated), 
          // use a temporary session ID
          logger.debug('Session creation failed, using temporary session')
          setSessionId(`temp-${Date.now()}`)
        }
      } catch (error) {
        logger.error('Failed to start session', error as Error)
        // Use temporary session ID on error
        setSessionId(`temp-${Date.now()}`)
      }
    }

    startSession()
    
    // Start talk timer
    talkStartRef.current = new Date()
    talkTimeIntervalRef.current = setInterval(() => {
      if (talkStartRef.current) {
        const elapsed = Math.floor((new Date().getTime() - talkStartRef.current.getTime()) / 1000)
        setTalkTime(elapsed)
      }
    }, 1000)

    // Send initial greeting after a short delay
    const greetingTimer = setTimeout(() => {
      sendInitialGreeting()
    }, 1000)

    return () => {
      if (talkTimeIntervalRef.current) {
        clearInterval(talkTimeIntervalRef.current)
      }
      clearTimeout(greetingTimer)
    }
  }, [sendInitialGreeting])

  // Track user speaking time
  useEffect(() => {
    if (isListening && !speakingStartRef.current) {
      speakingStartRef.current = new Date()
    } else if (!isListening && speakingStartRef.current) {
      const elapsed = (new Date().getTime() - speakingStartRef.current.getTime()) / 1000
      setUserSpeakingTime(prev => prev + elapsed)
      speakingStartRef.current = null
    }
  }, [isListening])


  // Process transcript changes
  useEffect(() => {
    if (transcript && transcript !== lastTranscript && !processingRef.current && !isSpeaking) {
      setLastTranscript(transcript)
      
      const trimmedTranscript = transcript.trim()
      if (trimmedTranscript.length > 0) {
        processingRef.current = true
        // Sanitize input before sending
        const sanitizedTranscript = trimmedTranscript
          .replace(/[<>]/g, '') // Remove potential HTML
          .substring(0, 5000) // Limit length (increased from 1000)
        addUserMessage(sanitizedTranscript)
        sendMessage(sanitizedTranscript)
      }
    }
  }, [transcript, lastTranscript, isSpeaking])

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, message])
  }

  const sendMessage = async (userMessage: string) => {
    setIsAIThinking(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: messages.slice(-6),
          mode,
          sessionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Chat API error:', {
          status: response.status,
          error: errorData,
          message: userMessage
        })
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.reply || data.response,
        timestamp: new Date(),
        assessment: data.assessment,
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      // Speak the response
      await speak(data.reply || data.response)
      
    } catch (error) {
      logger.error('Error sending message', error as Error)
      console.error('Chat error details:', error)
      
      let errorContent = ERROR_MESSAGES.API_ERROR
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorContent = 'AI service not configured. Please check API keys.'
        } else if (error.message.includes('rate limit')) {
          errorContent = 'Too many requests. Please wait a moment and try again.'
        } else if (error.message.includes('network')) {
          errorContent = 'Network error. Please check your connection.'
        }
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      await speak(ERROR_MESSAGES.API_ERROR)
    } finally {
      setIsAIThinking(false)
      processingRef.current = false
    }
  }

  const handleMicrophoneToggle = async () => {
    if (isListening) {
      stopListening()
    } else {
      // Check microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        startListening()
      } catch (err) {
        logger.error('Microphone permission denied', err as Error)
        // The error will be shown in the voice recognition hook
        startListening() // Still try to start, the hook will handle the error
      }
    }
  }

  const handleProviderChange = (type: 'stt' | 'tts', provider: string) => {
    if (type === 'stt') {
      setVoiceProvider(provider as 'browser' | 'openai' | 'google')
      // Restart voice recognition with new provider if active
      if (isListening) {
        stopListening()
        setTimeout(() => startListening(), 100)
      }
    } else {
      setSynthProvider(provider as 'browser' | 'openai' | 'elevenlabs')
    }
    // Save to localStorage for persistence
    localStorage.setItem(`provider_${type}`, provider)
  }

  const handleModeToggle = () => {
    setMode(prev => prev === 'conversation' ? 'learning' : 'conversation')
  }

  const handleEndSession = async () => {
    if (talkTimeIntervalRef.current) {
      clearInterval(talkTimeIntervalRef.current)
    }
    
    stopListening()
    
    // End session API call
    if (sessionId) {
      try {
        await fetch('/api/session/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            duration: talkTime,
            messageCount: messages.length,
            mode,
          }),
        })
      } catch (error) {
        logger.error('Failed to end session', error as Error)
      }
    }
    
    onEnd(talkTime)
  }

  return (
    <div className="flex flex-col h-screen bg-jet text-white">
      <ConversationHeader talkTime={talkTime} />
      
      <MessageList 
        messages={messages}
        isAIThinking={isAIThinking}
        mode={mode}
      />
      
      <SessionControls
        mode={mode}
        isListening={isListening}
        isSpeaking={isSpeaking}
        speechError={speechError || synthError}
        userTime={Math.floor(userSpeakingTime)}
        onModeToggle={handleModeToggle}
        onMicrophoneToggle={handleMicrophoneToggle}
        onEndSession={handleEndSession}
        onProviderSettings={() => setShowProviderSettings(true)}
      />
      
      {showProviderSettings && (
        <ProviderSelector
          voiceProvider={voiceProvider}
          synthProvider={synthProvider}
          onProviderChange={handleProviderChange}
          onClose={() => setShowProviderSettings(false)}
        />
      )}
      
      {showDebugPanel && (speechError || synthError || !isListening) && (
        <VoiceDebugPanel
          error={speechError || synthError}
          isListening={isListening}
          isSpeaking={isSpeaking}
          transcript={transcript}
        />
      )}
    </div>
  )
}