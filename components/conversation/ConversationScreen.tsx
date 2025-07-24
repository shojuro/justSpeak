'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { checkAPIConfiguration, getSavedProvider } from '@/lib/api-config-client'
import MessageList, { Message } from './MessageList'
import SessionControls from './SessionControls'
import ConversationHeader from './ConversationHeader'
import ProviderSelector from './ProviderSelector'
import VoiceControlSettings from './VoiceControlSettings'
import VoiceDebugPanel from '@/components/VoiceDebugPanel'
import MicrophonePermission from '@/components/MicrophonePermission'
import { ERROR_MESSAGES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { detectSentenceCompletion, shouldProcessTranscript } from '@/lib/speech-utils'
import { SpeechSessionManager, AISpeechFilter, VoiceSynthesisStateManager } from '@/lib/speech-session-manager'

interface ConversationScreenProps {
  onEnd: (talkTime: number) => void
}

export default function ConversationScreen({ onEnd }: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [talkTime, setTalkTime] = useState(0)
  const [userSpeakingTime, setUserSpeakingTime] = useState(0)
  const [_lastTranscript, _setLastTranscript] = useState('')
  const [mode, setMode] = useState<'conversation' | 'learning'>('conversation')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [voiceProvider, setVoiceProvider] = useState<'browser' | 'openai' | 'google'>('browser')
  const [synthProvider, setSynthProvider] = useState<'browser' | 'openai' | 'elevenlabs'>('browser')
  const [elevenLabsVoiceId, _setElevenLabsVoiceId] = useState('1t1EeRixsJrKbiF1zwM6') // Jerry B. voice
  const [showProviderSettings, setShowProviderSettings] = useState(false)
  const [showDebugPanel, _setShowDebugPanel] = useState(process.env.NODE_ENV === 'development')
  const [voiceControlMode, setVoiceControlMode] = useState<'continuous' | 'push-to-talk'>('push-to-talk')
  const [_voiceSensitivity, setVoiceSensitivity] = useState(3)
  const [customSilenceThreshold, setCustomSilenceThreshold] = useState<number | null>(null)
  const [patientMode, setPatientMode] = useState(false)
  const [isWaitingForSilence, setIsWaitingForSilence] = useState(false)
  const [silenceCountdown, setSilenceCountdown] = useState(0)
  const [showMicPermission, setShowMicPermission] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [listeningDuration, setListeningDuration] = useState(0)
  
  // Refs for tracking time
  const talkStartRef = useRef<Date | null>(null)
  const talkTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const speakingStartRef = useRef<Date | null>(null)
  const processingRef = useRef<boolean>(false)
  
  // Speech recognition refs
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const earlyCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const listeningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef<string>('')
  const greetingSentRef = useRef<boolean>(false)
  const speechSessionRef = useRef<SpeechSessionManager>(new SpeechSessionManager())
  const voiceSynthManagerRef = useRef(VoiceSynthesisStateManager.getInstance())

  // Track if AI is currently speaking (more robust than isSpeaking)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isVoiceLoading, setIsVoiceLoading] = useState(true)
  const [isSpeakingLocked, setIsSpeakingLocked] = useState(false) // Prevents ANY mic activation
  
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
    if (!isAISpeaking && !isSpeakingLocked) {
      // Start a new speech session
      speechSessionRef.current.startSession()
      // Reset transcript tracking
      lastTranscriptRef.current = ''
      clearTranscript()
      _startListening()
    } else {
      logger.debug('Cannot start listening - AI is speaking or locked', { isAISpeaking, isSpeakingLocked })
    }
  }, [_startListening, isAISpeaking, isSpeakingLocked, clearTranscript])
  
  const { 
    speak: _speak, 
    isSpeaking, 
    stop: _stopSpeaking,
    error: _synthError,
    isReady: _isSynthReady 
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
    
    // Add this response to the AI speech filter
    AISpeechFilter.addAIResponse(text)
    
    // Set speaking lock IMMEDIATELY
    setIsSpeakingLocked(true)
    setIsAISpeaking(true)
    
    // Force stop any listening
    if (isListening) {
      stopListening()
      // End any active speech session
      speechSessionRef.current.endSession()
    }
    
    try {
      await _speak(text)
    } finally {
      // Add much longer delay before allowing microphone to restart
      setTimeout(() => {
        logger.debug('AI finished speaking, extended wait before enabling mic')
        setIsAISpeaking(false)
        // Much longer delay before unlocking to prevent echo
        setTimeout(() => {
          logger.debug('Unlocking microphone after extended delay')
          setIsSpeakingLocked(false)
        }, 8000) // 8s after speech ends to prevent echo
      }, 2000) // 2s buffer for synthesis to fully complete
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
    
    // Initialize voice synthesis properly before speaking
    const initAndSpeak = async () => {
      try {
        setIsVoiceLoading(true)
        
        // Initialize voice synthesis manager with timeout
        const initPromise = voiceSynthManagerRef.current.initialize()
        const timeoutPromise = new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(false), 5000) // 5 second timeout
        )
        
        const synthReady = await Promise.race([initPromise, timeoutPromise])
        
        if (synthReady) {
          logger.debug('Voice synthesis fully initialized, speaking greeting')
          setIsVoiceLoading(false)
          
          // Try to speak with fallback
          try {
            await speak(greeting)
          } catch (speakErr) {
            logger.error('Failed to speak greeting', speakErr as Error)
            // Try browser TTS as fallback
            if (window.speechSynthesis) {
              const utterance = new SpeechSynthesisUtterance(greeting)
              window.speechSynthesis.speak(utterance)
            }
          }
        } else {
          logger.warn('Voice synthesis initialization timeout - attempting fallback')
          setIsVoiceLoading(false)
          
          // Try browser TTS directly as fallback
          if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(greeting)
            window.speechSynthesis.speak(utterance)
          }
        }
      } catch (err) {
        logger.error('Failed to initialize voice synthesis', err as Error)
        setIsVoiceLoading(false)
        
        // Last resort: try browser TTS
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(greeting)
          window.speechSynthesis.speak(utterance)
        }
      }
    }
    
    // Start initialization after a brief delay
    setTimeout(initAndSpeak, 1000)
  }, [speak, isListening, stopListening])

  // Initialize providers and start session
  useEffect(() => {
    // Load provider preferences
    const initializeProviders = async () => {
      await checkAPIConfiguration()
      
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
      
      // ALWAYS use push-to-talk mode for safety (ignore saved preference)
      setVoiceControlMode('push-to-talk')
      localStorage.setItem('voice_control_mode', 'push-to-talk')
      
      // Mark initialization complete after greeting
      setTimeout(() => {
        setIsInitializing(false)
        logger.info('Initialization complete', { voiceControlMode: 'push-to-talk' })
      }, 5000) // Wait 5 seconds after greeting before allowing any mic
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
      if (e.code === 'Space' && !e.repeat && !isListening && !isAISpeaking && !isSpeakingLocked) {
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
        // End speech session immediately for push-to-talk
        speechSessionRef.current.endSession()
        // Clear any pending timers
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
        if (earlyCheckIntervalRef.current) {
          clearInterval(earlyCheckIntervalRef.current)
        }
        setIsWaitingForSilence(false)
        setSilenceCountdown(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [voiceControlMode, isListening, isAISpeaking, isSpeakingLocked, startListening, stopListening])

  // Track user speaking time and listening duration
  useEffect(() => {
    if (isListening) {
      if (!speakingStartRef.current) {
        speakingStartRef.current = new Date()
      }
      
      // Start listening duration timer
      setListeningDuration(0)
      let seconds = 0
      listeningTimerRef.current = setInterval(() => {
        seconds++
        setListeningDuration(seconds)
      }, 1000)
    } else {
      if (speakingStartRef.current) {
        const elapsed = (new Date().getTime() - speakingStartRef.current.getTime()) / 1000
        setUserSpeakingTime(prev => prev + elapsed)
        speakingStartRef.current = null
      }
      
      // Clear listening timer
      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
        setListeningDuration(0)
      }
    }
    
    return () => {
      if (listeningTimerRef.current) {
        clearInterval(listeningTimerRef.current)
      }
    }
  }, [isListening])


  // Stop listening when AI is speaking (echo cancellation)
  useEffect(() => {
    if (isAISpeaking && isListening) {
      console.log('AI is speaking, stopping microphone to prevent feedback')
      stopListening()
    }
  }, [isAISpeaking, isListening, stopListening])

  // Transcript processing with session management
  useEffect(() => {
    if (!transcript || processingRef.current || isAISpeaking || isInitializing || isSpeakingLocked) return
    
    // Add transcript to session
    speechSessionRef.current.addTranscript(transcript, false)
    
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
    
    // Skip processing if too few words (prevent accidental noises)
    // Require at least 5 words to prevent premature processing
    if (wordCount < 5 && !patientMode) {
      // Clear timer and return early
      setIsWaitingForSilence(false)
      return
    }
    
    // Use custom threshold if set, otherwise use defaults
    if (customSilenceThreshold !== null) {
      silenceDelay = customSilenceThreshold * 1000 // Convert to milliseconds
    } else if (patientMode) {
      // Patient mode: Extra long delays
      silenceDelay = 15000 // 15 seconds for language learners
    } else if (voiceControlMode === 'push-to-talk') {
      // Push-to-talk: More generous for manual control
      silenceDelay = 8000 // 8 seconds base
    } else {
      // Continuous mode: Dynamic based on speech length
      if (wordCount < 10) {
        silenceDelay = 8000 // 8 seconds for short utterances
      } else if (wordCount < 30) {
        silenceDelay = 10000 // 10 seconds for medium utterances
      } else {
        silenceDelay = 12000 // 12 seconds for long utterances
      }
    }
    
    // Check sentence completion
    const completion = detectSentenceCompletion(transcript)
    console.log(`Transcript: "${transcript}" | Waiting ${silenceDelay}ms | Completion: ${completion.isComplete} (${completion.confidence}) - ${completion.reason}`)
    
    // Set initial countdown (may be shortened by completion detection)
    setSilenceCountdown(Math.ceil(silenceDelay / 1000))
    
    // Clear any existing countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    
    // Clear any existing early check
    if (earlyCheckIntervalRef.current) {
      clearInterval(earlyCheckIntervalRef.current)
    }
    
    // Check for early completion every 500ms
    let earlyCheckCount = 0
    earlyCheckIntervalRef.current = setInterval(() => {
      earlyCheckCount++
      const elapsedMs = earlyCheckCount * 500
      
      // Check if we should process early based on completion
      if (shouldProcessTranscript(transcript, elapsedMs, silenceDelay)) {
        console.log(`Early completion detected after ${elapsedMs}ms`)
        if (earlyCheckIntervalRef.current) {
          clearInterval(earlyCheckIntervalRef.current)
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          // Process immediately
          silenceTimerRef.current = setTimeout(() => {
            processTranscript()
          }, 0)
        }
      }
      
      // Stop checking after half the silence delay
      if (elapsedMs >= silenceDelay / 2) {
        if (earlyCheckIntervalRef.current) {
          clearInterval(earlyCheckIntervalRef.current)
        }
      }
    }, 500)
    
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
    
    // Extract processing logic to reuse for early completion
    const processTranscript = () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      if (earlyCheckIntervalRef.current) {
        clearInterval(earlyCheckIntervalRef.current)
      }
      
      // Get the full session transcript
      const sessionTranscript = speechSessionRef.current.endSession()
      const processedTranscript = sessionTranscript || transcript.trim()
      
      // Process if we have content and it's different from last processed
      if (processedTranscript && processedTranscript !== lastTranscriptRef.current) {
        // Check if this is the AI's own speech using the filter
        if (AISpeechFilter.isAISpeech(processedTranscript)) {
          console.log('Filtered out AI speech:', processedTranscript.substring(0, 50))
          clearTranscript()
          processingRef.current = false
          setIsWaitingForSilence(false)
          setSilenceCountdown(0)
          return
        }
        
        console.log('Processing user speech:', processedTranscript)
        processingRef.current = true
        lastTranscriptRef.current = processedTranscript
        
        // Stop listening and clear transcript
        stopListening()
        
        // Sanitize and send
        const sanitizedTranscript = processedTranscript
          .replace(/[<>]/g, '')
          .substring(0, 5000)
        
        addUserMessage(sanitizedTranscript)
        sendMessage(sanitizedTranscript)
        
        // Clear transcript buffer after processing
        clearTranscript()
      }
      
      // Hide waiting indicator
      setIsWaitingForSilence(false)
      setSilenceCountdown(0)
    }
    
    silenceTimerRef.current = setTimeout(processTranscript, silenceDelay)
    
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      if (earlyCheckIntervalRef.current) {
        clearInterval(earlyCheckIntervalRef.current)
      }
      setIsWaitingForSilence(false)
      setSilenceCountdown(0)
    }
  }, [transcript, isAISpeaking, isInitializing, isSpeakingLocked, voiceControlMode, customSilenceThreshold, patientMode, stopListening, clearTranscript])

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
      
      // NEVER restart listening automatically - require manual activation
      // This prevents echo and ensures user control
      console.log('Microphone requires manual activation (push-to-talk mode)')
    }
  }

  const handleMicrophoneToggle = async () => {
    if (isListening) {
      stopListening()
      // End speech session when manually stopping
      speechSessionRef.current.endSession()
    } else if (!isSpeakingLocked && !isAISpeaking) {
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
    } else {
      logger.debug('Cannot toggle microphone - AI is speaking', { isAISpeaking, isSpeakingLocked })
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
      
      {/* AI Speaking Lock Indicator */}
      {isSpeakingLocked && (
        <div className="absolute bottom-56 sm:bottom-64 left-1/2 transform -translate-x-1/2 bg-red-500/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full mx-4 flex items-center gap-2">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs sm:text-sm text-red-400">
            Microphone locked - AI speaking
          </p>
        </div>
      )}
      
      {/* Push-to-talk indicator */}
      {voiceControlMode === 'push-to-talk' && isListening && (
        <div className="absolute bottom-52 sm:bottom-60 left-1/2 transform -translate-x-1/2 bg-green-500/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full mx-4 flex items-center gap-2 ring-2 ring-green-500/50">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
          <p className="text-xs sm:text-sm text-green-400 font-semibold">
            🔴 Recording - Release SPACE to stop
          </p>
        </div>
      )}
      
      {/* Still listening indicator - shows after 3 seconds */}
      {isListening && listeningDuration >= 3 && !isWaitingForSilence && !isInitializing && voiceControlMode !== 'push-to-talk' && (
        <div className="absolute bottom-40 sm:bottom-48 left-1/2 transform -translate-x-1/2 bg-jet/80 px-3 sm:px-4 py-2 rounded-full mx-4">
          <p className="text-xs sm:text-sm text-warm-coral-light animate-pulse">
            Still listening... Take your time 🎤
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
        isLocked={isSpeakingLocked}
        speechError={speechError || _synthError}
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
              onSilenceThresholdChange={setCustomSilenceThreshold}
              onPatientModeChange={setPatientMode}
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
      {showDebugPanel && (speechError || _synthError || !isListening) && (
        <div className="hidden sm:block">
          <VoiceDebugPanel
            error={speechError || _synthError}
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