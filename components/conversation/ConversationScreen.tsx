'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { checkAPIConfiguration, getBestProvider, getSavedProvider } from '@/lib/api-config-client'
import MessageList, { Message } from './MessageList'
import SessionControls from './SessionControls'
import ConversationHeader from './ConversationHeader'
import ProviderSelector from './ProviderSelector'
import VoiceControlSettings from './VoiceControlSettings'
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
  const [voiceControlMode, setVoiceControlMode] = useState<'continuous' | 'push-to-talk'>('push-to-talk')
  const [voiceSensitivity, setVoiceSensitivity] = useState(3)
  
  // Refs for tracking time
  const talkStartRef = useRef<Date | null>(null)
  const talkTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const speakingStartRef = useRef<Date | null>(null)
  const processingRef = useRef<boolean>(false)
  
  // Debouncing refs for speech recognition
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const accumulatedTranscriptRef = useRef<string>('')
  const lastFinalTranscriptRef = useRef<string>('')
  const greetingSentRef = useRef<boolean>(false)

  // Track if AI is currently speaking (more robust than isSpeaking)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  
  // Speech hooks with API support
  const { 
    transcript, 
    isListening, 
    startListening: _startListening, 
    stopListening, 
    error: speechError 
  } = useVoiceRecognition({
    provider: voiceProvider,
    continuous: true,
    interimResults: true,
    language: 'en-US',
    onFinalTranscript: (text) => logger.debug('Final transcript', { text })
  })
  
  // Wrapped startListening that checks if AI is speaking
  const startListening = useCallback(() => {
    if (!isAISpeaking) {
      _startListening()
    } else {
      console.log('Cannot start listening - AI is speaking')
    }
  }, [_startListening, isAISpeaking])
  
  const { 
    speak: _speak, 
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
  
  // Wrapped speak function that manages AI speaking state
  const speak = useCallback(async (text: string) => {
    setIsAISpeaking(true)
    // Force stop any listening
    if (isListening) {
      stopListening()
    }
    
    try {
      await _speak(text)
    } finally {
      // Add delay before allowing microphone to restart
      setTimeout(() => {
        setIsAISpeaking(false)
      }, 500)
    }
  }, [_speak, isListening, stopListening])

  // Define sendInitialGreeting before using it in useEffect
  const sendInitialGreeting = useCallback(async () => {
    // Prevent multiple greetings
    if (greetingSentRef.current) {
      console.log('Greeting already sent, skipping')
      return
    }
    
    greetingSentRef.current = true
    
    const greeting = "Hello! I'm TalkTime, your friendly English conversation partner. What would you like to talk about today?"
    
    const message: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }
    
    setMessages([message])
    
    // Ensure microphone is stopped before speaking
    if (isListening) {
      stopListening()
    }
    
    await speak(greeting)
  }, [speak, isListening, stopListening])

  // Initialize providers and start session
  useEffect(() => {
    // Load provider preferences
    const initializeProviders = async () => {
      const status = await checkAPIConfiguration()
      
      // Check saved preferences first, then fall back to best available
      const savedSTT = getSavedProvider('stt') as 'browser' | 'openai' | 'google'
      const savedTTS = getSavedProvider('tts') as 'browser' | 'openai' | 'elevenlabs'
      
      // For MVP, default to browser for both STT and TTS to avoid API issues
      const bestSTT = savedSTT || 'browser'
      const bestTTS = savedTTS || 'browser'
      
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
    const greetingTimer = setTimeout(async () => {
      await sendInitialGreeting()
      
      // Load saved voice control mode AFTER greeting
      const savedMode = localStorage.getItem('voice_control_mode') as 'continuous' | 'push-to-talk'
      if (savedMode) {
        setVoiceControlMode(savedMode)
      }
      
      // Only auto-start listening in continuous mode AFTER greeting is done
      if (!savedMode || savedMode === 'continuous') {
        setTimeout(() => {
          if (!isAISpeaking) {
            console.log('Starting microphone after greeting')
            startListening()
          }
        }, 1000)
      }
    }, 1000)

    return () => {
      if (talkTimeIntervalRef.current) {
        clearInterval(talkTimeIntervalRef.current)
      }
      clearTimeout(greetingTimer)
    }
  }, []) // Remove dependencies to prevent re-runs

  // Keyboard event handlers for push-to-talk
  useEffect(() => {
    if (voiceControlMode !== 'push-to-talk') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Use spacebar for push-to-talk
      if (e.code === 'Space' && !e.repeat && !isListening && !isAISpeaking) {
        e.preventDefault()
        console.log('Push-to-talk: Starting listening')
        
        // Reset transcript tracking
        accumulatedTranscriptRef.current = ''
        lastFinalTranscriptRef.current = ''
        
        startListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release spacebar to stop
      if (e.code === 'Space' && isListening) {
        e.preventDefault()
        console.log('Push-to-talk: Stopping listening')
        stopListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [voiceControlMode, isListening, isAISpeaking, startListening, stopListening])

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


  // Stop listening when AI is speaking (echo cancellation)
  useEffect(() => {
    if (isAISpeaking && isListening) {
      console.log('AI is speaking, stopping microphone to prevent feedback')
      stopListening()
    }
  }, [isAISpeaking, isListening, stopListening])

  // Process transcript changes with debouncing
  useEffect(() => {
    if (!transcript || processingRef.current || isAISpeaking) return
    
    // Update accumulated transcript
    accumulatedTranscriptRef.current = transcript
    
    // Clear existing timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    
    // Set up silence detection timer
    const silenceDelay = voiceControlMode === 'push-to-talk' ? 500 : 1500 // Shorter delay for push-to-talk
    
    silenceTimerRef.current = setTimeout(() => {
      // Check if we have new content since last final transcript
      const currentTranscript = accumulatedTranscriptRef.current.trim()
      const lastFinal = lastFinalTranscriptRef.current.trim()
      
      // Only process if we have new content
      if (currentTranscript && currentTranscript !== lastFinal && currentTranscript.length > lastFinal.length) {
        // Extract only the new part
        const newContent = lastFinal ? currentTranscript.substring(lastFinal.length).trim() : currentTranscript
        
        if (newContent && newContent.length > 0) {
          // Check if this is the AI's own speech (greeting)
          const lowerContent = newContent.toLowerCase()
          if (lowerContent.includes("hello i'm talktime") || 
              lowerContent.includes("hello i am talktime") ||
              lowerContent.includes("friendly english conversation partner")) {
            console.log('Ignoring AI\'s own speech')
            lastFinalTranscriptRef.current = currentTranscript
            accumulatedTranscriptRef.current = ''
            return
          }
          
          console.log('Processing complete sentence:', newContent)
          processingRef.current = true
          lastFinalTranscriptRef.current = currentTranscript
          
          // Stop listening immediately
          stopListening()
          
          // Clear accumulated transcript
          accumulatedTranscriptRef.current = ''
          
          // Sanitize and send
          const sanitizedTranscript = newContent
            .replace(/[<>]/g, '')
            .substring(0, 5000)
          
          addUserMessage(sanitizedTranscript)
          sendMessage(sanitizedTranscript)
        }
      }
    }, silenceDelay)
    
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [transcript, isAISpeaking, voiceControlMode, stopListening])

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
    // Prevent sending if AI is already thinking or speaking
    if (isAIThinking || isAISpeaking) {
      console.log('Skipping message - AI is busy')
      processingRef.current = false
      return
    }
    
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
      try {
        await speak(data.reply || data.response)
      } catch (speechError) {
        console.error('Failed to speak AI response:', speechError)
        // Don't throw - the text response is still shown
      }
      
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
      // Try to speak the error, but don't fail if speech fails
      try {
        await speak(errorContent)
      } catch (speechError) {
        console.error('Failed to speak error message:', speechError)
      }
    } finally {
      setIsAIThinking(false)
      processingRef.current = false
      
      // Only restart listening in continuous mode
      if (voiceControlMode === 'continuous') {
        setTimeout(() => {
          if (!isListening && !isAISpeaking) {
            console.log('Restarting microphone after AI response (continuous mode)')
            startListening()
          }
        }, 1500) // 1.5 second delay to ensure speech synthesis has fully finished
      }
    }
  }

  const handleMicrophoneToggle = async () => {
    if (isListening) {
      stopListening()
    } else {
      // Reset transcript tracking when starting new session
      accumulatedTranscriptRef.current = ''
      lastFinalTranscriptRef.current = ''
      
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
        isSpeaking={isAISpeaking}
        speechError={speechError || synthError}
        userTime={Math.floor(userSpeakingTime)}
        voiceControlMode={voiceControlMode}
        onModeToggle={handleModeToggle}
        onMicrophoneToggle={handleMicrophoneToggle}
        onEndSession={handleEndSession}
        onProviderSettings={() => setShowProviderSettings(true)}
      />
      
      {showProviderSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-gray rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <VoiceControlSettings
              onModeChange={setVoiceControlMode}
              onSensitivityChange={setVoiceSensitivity}
            />
            <ProviderSelector
              voiceProvider={voiceProvider}
              synthProvider={synthProvider}
              onProviderChange={handleProviderChange}
              onClose={() => setShowProviderSettings(false)}
            />
          </div>
        </div>
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