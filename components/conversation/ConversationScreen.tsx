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
import MicrophonePermission from '@/components/MicrophonePermission'
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
  const [showDebugPanel, setShowDebugPanel] = useState(process.env.NODE_ENV === 'development')
  const [voiceControlMode, setVoiceControlMode] = useState<'continuous' | 'push-to-talk'>('push-to-talk')
  const [voiceSensitivity, setVoiceSensitivity] = useState(3)
  const [isWaitingForSilence, setIsWaitingForSilence] = useState(false)
  const [silenceCountdown, setSilenceCountdown] = useState(0)
  const [showMicPermission, setShowMicPermission] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  
  // Refs for tracking time
  const talkStartRef = useRef<Date | null>(null)
  const talkTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const speakingStartRef = useRef<Date | null>(null)
  const processingRef = useRef<boolean>(false)
  
  // Speech recognition refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef<string>('')
  const greetingSentRef = useRef<boolean>(false)

  // Track if AI is currently speaking (more robust than isSpeaking)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isVoiceLoading, setIsVoiceLoading] = useState(true)
  
  // Speech hooks with API support
  const { 
    transcript, 
    isListening, 
    startListening: _startListening, 
    stopListening, 
    clearTranscript,
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
      // Reset transcript tracking
      lastTranscriptRef.current = ''
      clearTranscript()
      _startListening()
    } else {
      logger.debug('Cannot start listening - AI is speaking')
    }
  }, [_startListening, isAISpeaking, clearTranscript])
  
  const { 
    speak: _speak, 
    isSpeaking, 
    stop: stopSpeaking,
    error: synthError,
    isReady: isSynthReady 
  } = useSpeechSynthesis({
    provider: synthProvider,
    voice: synthProvider === 'elevenlabs' ? elevenLabsVoiceId : 'nova',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  })
  
  // Wrapped speak function that manages AI speaking state
  const speak = useCallback(async (text: string) => {
    logger.debug('AI speaking', { preview: text.substring(0, 50) + '...' })
    setIsAISpeaking(true)
    // Force stop any listening
    if (isListening) {
      stopListening()
    }
    
    try {
      await _speak(text)
    } finally {
      // Add longer delay before allowing microphone to restart
      setTimeout(() => {
        logger.debug('AI finished speaking, waiting before enabling mic')
        setIsAISpeaking(false)
      }, 1500) // Increased from 500ms to 1.5s
    }
  }, [_speak, isListening, stopListening])

  // Define sendInitialGreeting before using it in useEffect
  const sendInitialGreeting = useCallback(async () => {
    // Prevent multiple greetings
    if (greetingSentRef.current) {
      logger.debug('Greeting already sent, skipping')
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
    
    // Wait for speech synthesis to be ready with retry logic
    const maxRetries = 10
    let retryCount = 0
    
    const attemptSpeak = async () => {
      try {
        // Check if synthesis is ready
        if (isSynthReady && window.speechSynthesis) {
          logger.debug('Speech synthesis ready, speaking greeting')
          setIsVoiceLoading(false)
          await speak(greeting)
        } else if (retryCount < maxRetries) {
          retryCount++
          logger.debug(`Speech synthesis not ready, retry ${retryCount}/${maxRetries}`)
          // Exponential backoff: 100ms, 200ms, 400ms, etc.
          setTimeout(attemptSpeak, Math.min(100 * Math.pow(2, retryCount - 1), 3000))
        } else {
          logger.warn('Speech synthesis failed to initialize after retries')
          setIsVoiceLoading(false)
          // Fallback to text-only mode after 5 seconds
          logger.warn('Voice synthesis unavailable - falling back to text mode')
        }
      } catch (err) {
        logger.error('Failed to speak greeting', err as Error)
        setIsVoiceLoading(false)
        // Continue anyway - text is still shown
      }
    }
    
    // Start attempting after initial delay
    setTimeout(attemptSpeak, 500)
  }, [speak, isListening, stopListening, isSynthReady, setIsVoiceLoading])

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
      } else {
        // Default to push-to-talk to prevent feedback
        setVoiceControlMode('push-to-talk')
        localStorage.setItem('voice_control_mode', 'push-to-talk')
      }
      
      // Mark initialization complete after greeting
      setTimeout(() => {
        setIsInitializing(false)
        logger.info('Initialization complete', { voiceControlMode: savedMode || 'push-to-talk' })
      }, 3000) // Wait 3 seconds after greeting before allowing any mic
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
        logger.debug('Push-to-talk: Starting listening')
        startListening()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release spacebar to stop
      if (e.code === 'Space' && isListening) {
        e.preventDefault()
        logger.debug('Push-to-talk: Stopping listening')
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

  // Simple silence-based transcript processing
  useEffect(() => {
    if (!transcript || processingRef.current || isAISpeaking || isInitializing) return
    
    // Clear existing timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    
    // Show waiting indicator
    setIsWaitingForSilence(true)
    
    // Much longer silence detection for language learners
    // Dynamic thresholds based on utterance length
    const wordCount = transcript.trim().split(/\s+/).length
    let silenceDelay: number
    
    if (voiceControlMode === 'push-to-talk') {
      // Push-to-talk: More generous for manual control
      silenceDelay = 5000 // 5 seconds base
    } else {
      // Continuous mode: Dynamic based on speech length
      if (wordCount < 20) {
        silenceDelay = 5000 // 5 seconds for short utterances
      } else if (wordCount < 50) {
        silenceDelay = 8000 // 8 seconds for medium utterances
      } else {
        silenceDelay = 10000 // 10 seconds for long utterances
      }
    }
    
    console.log(`Transcript: "${transcript}" | Waiting ${silenceDelay}ms for silence`)
    
    // Set initial countdown
    setSilenceCountdown(Math.ceil(silenceDelay / 1000))
    
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    
    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setSilenceCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    silenceTimerRef.current = setTimeout(() => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      const finalTranscript = transcript.trim()
      
      // Process if we have content and it's different from last processed
      if (finalTranscript && finalTranscript !== lastTranscriptRef.current) {
        // Check if this is the AI's own speech (greeting or common AI phrases)
        const lowerContent = finalTranscript.toLowerCase()
        const aiPhrases = [
          "hello i'm talktime",
          "hello i am talktime",
          "friendly english conversation partner",
          "what would you like to talk about",
          "how can i help you",
          "i'm here to help",
          "let's practice english",
          "feel free to ask"
        ]
        
        if (aiPhrases.some(phrase => lowerContent.includes(phrase))) {
          console.log('Ignoring AI\'s own speech:', finalTranscript.substring(0, 50))
          clearTranscript()
          processingRef.current = false
          return
        }
        
        console.log('Processing user speech:', finalTranscript)
        processingRef.current = true
        lastTranscriptRef.current = finalTranscript
        
        // Stop listening and clear transcript
        stopListening()
        
        // Sanitize and send
        const sanitizedTranscript = finalTranscript
          .replace(/[<>]/g, '')
          .substring(0, 5000)
        
        addUserMessage(sanitizedTranscript)
        sendMessage(sanitizedTranscript)
      }
      
      // Hide waiting indicator
      setIsWaitingForSilence(false)
      setSilenceCountdown(0)
    }, silenceDelay)
    
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      setIsWaitingForSilence(false)
      setSilenceCountdown(0)
    }
  }, [transcript, isAISpeaking, isInitializing, voiceControlMode, stopListening, clearTranscript])

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
        if (window.speechSynthesis) {
          await speak(data.reply || data.response)
        } else {
          console.log('Speech synthesis not available, showing text only')
        }
      } catch (speechError) {
        console.error('Failed to speak AI response:', speechError)
        // Don't throw - the text response is still shown
      }
      
    } catch (error) {
      logger.error('Error sending message', error as Error)
      console.error('Chat error details:', error)
      
      let errorContent: string = ERROR_MESSAGES.API_ERROR
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorContent = ERROR_MESSAGES.API_ERROR
        } else if (error.message.includes('rate limit')) {
          errorContent = ERROR_MESSAGES.RATE_LIMIT
        } else if (error.message.includes('network')) {
          errorContent = ERROR_MESSAGES.API_ERROR
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
      
      // Only restart listening in continuous mode AND not during initialization
      if (voiceControlMode === 'continuous' && !isInitializing) {
        setTimeout(() => {
          if (!isAISpeaking) {
            console.log('Restarting microphone after AI response')
            startListening()
          }
        }, 2000) // 2 second delay after AI finishes
      }
    }
  }

  const handleMicrophoneToggle = async () => {
    if (isListening) {
      stopListening()
    } else {
      // Check if we've already verified permission
      if (!micPermissionGranted) {
        // Test for permission
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          setMicPermissionGranted(true)
          startListening()
        } catch (err) {
          // Show permission dialog
          setShowMicPermission(true)
          logger.error('Microphone permission needed', err as Error)
        }
      } else {
        startListening()
      }
    }
  }

  const handlePermissionGranted = () => {
    setMicPermissionGranted(true)
    setShowMicPermission(false)
    // Start listening after permission is granted
    setTimeout(() => {
      startListening()
    }, 500)
  }

  const handlePermissionDenied = () => {
    setShowMicPermission(false)
    // Show error in UI via speech error state
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
    <div className="flex flex-col h-full bg-jet text-white relative">
      <ConversationHeader talkTime={talkTime} />
      
      <MessageList 
        messages={messages}
        isAIThinking={isAIThinking}
        mode={mode}
      />
      
      {/* Mobile-friendly initialization indicator */}
      {isInitializing && (
        <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 bg-warm-coral/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full mx-4">
          <p className="text-xs sm:text-sm text-warm-coral animate-pulse whitespace-nowrap">
            Initializing... Please wait
          </p>
        </div>
      )}
      
      {/* Voice loading indicator */}
      {!isInitializing && isVoiceLoading && (
        <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 bg-blue-500/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full mx-4">
          <p className="text-xs sm:text-sm text-blue-400 animate-pulse whitespace-nowrap">
            Loading voices...
          </p>
        </div>
      )}
      
      {/* Mobile-friendly waiting indicator with countdown */}
      {isWaitingForSilence && isListening && !isInitializing && (
        <div className="absolute bottom-24 sm:bottom-32 left-1/2 transform -translate-x-1/2 bg-dark-gray/90 px-3 sm:px-4 py-2 rounded-full mx-4">
          <p className="text-xs sm:text-sm text-warm-coral animate-pulse flex items-center gap-2">
            <span>Listening...</span>
            {silenceCountdown > 0 && (
              <span className="font-mono bg-warm-coral/20 px-2 py-0.5 rounded">
                {silenceCountdown}s
              </span>
            )}
          </p>
        </div>
      )}
      
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
      
      {/* Mobile-optimized modal */}
      {showProviderSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-dark-gray rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none">
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
      
      {/* Debug panel - hidden on mobile by default */}
      {showDebugPanel && (speechError || synthError || !isListening) && (
        <div className="hidden sm:block">
          <VoiceDebugPanel
            error={speechError || synthError}
            isListening={isListening}
            isSpeaking={isSpeaking}
            transcript={transcript}
          />
        </div>
      )}
      
      {/* Microphone permission dialog */}
      {showMicPermission && (
        <MicrophonePermission
          onPermissionGranted={handlePermissionGranted}
          onPermissionDenied={handlePermissionDenied}
        />
      )}
    </div>
  )
}