'use client'

import { useState, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useElevenLabsSpeech, ELEVENLABS_VOICES } from '@/hooks/useElevenLabsSpeech'

interface ConversationScreenProps {
  onEnd: (talkTime: number) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ConversationScreen({ onEnd }: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [talkTime, setTalkTime] = useState(0)
  const [lastTranscript, setLastTranscript] = useState('')
  const [mode, setMode] = useState<'conversation' | 'learning'>('conversation')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const talkStartRef = useRef<Date | null>(null)
  const talkTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition()
  // Use ElevenLabs with fallback to browser TTS
  const { speak: speakElevenLabs, isSpeaking: isSpeakingElevenLabs } = useElevenLabsSpeech(
    ELEVENLABS_VOICES.bella, // You can change the voice here
    true // Enable fallback to browser TTS
  )
  const { speak: speakBrowser, isSpeaking: isSpeakingBrowser } = useSpeechSynthesis()
  
  // Use ElevenLabs if available, otherwise use browser TTS
  const speak = speakElevenLabs
  const isSpeaking = isSpeakingElevenLabs || isSpeakingBrowser

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm excited to chat with you. What would you like to talk about today?",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    speak(welcomeMessage.content)
  }, [speak])

  useEffect(() => {
    // Only process if we have a meaningful transcript that's different from the last one
    if (transcript && 
        transcript.trim().length > 0 && 
        transcript !== lastTranscript && 
        !isListening && 
        !isSpeaking) {
      setLastTranscript(transcript)
      handleUserMessage(transcript.trim())
    }
  }, [transcript, isListening, isSpeaking, lastTranscript])

  useEffect(() => {
    if (isListening && !talkStartRef.current) {
      talkStartRef.current = new Date()
      talkTimeIntervalRef.current = setInterval(() => {
        if (talkStartRef.current) {
          setTalkTime(Math.floor((Date.now() - talkStartRef.current.getTime()) / 1000))
        }
      }, 1000)
    } else if (!isListening && talkStartRef.current) {
      talkStartRef.current = null
      if (talkTimeIntervalRef.current) {
        clearInterval(talkTimeIntervalRef.current)
        talkTimeIntervalRef.current = null
      }
    }
  }, [isListening])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleUserMessage = async (userText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsAIThinking(true)

    try {
      // Build conversation context (last 10 messages)
      const context = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          context: context,
          ageGroup: 'adult',
          mode: mode
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const aiReply = data.reply

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsAIThinking(false)
      speak(aiResponse.content)

    } catch (error) {
      console.error('Error getting AI response:', error)
      
      // Check if it's an API key error
      let fallback = "I'm having trouble connecting right now. Can you tell me more about that?"
      
      if (error instanceof Error && error.message.includes('API key')) {
        fallback = "Please configure your OpenAI API key in the .env file to enable AI responses."
      }
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsAIThinking(false)
      speak(aiResponse.content)
    }
  }

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening()
    } else if (!isSpeaking && !isAIThinking) {
      startListening()
    }
  }

  const handleEndSession = () => {
    stopListening()
    onEnd(talkTime)
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light overflow-hidden">
      <header className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">TalkTime</h2>
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setMode('conversation')}
                className={`px-3 py-1 rounded-full transition-all ${
                  mode === 'conversation'
                    ? 'bg-warm-coral text-white'
                    : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                Conversation
              </button>
              <button
                onClick={() => setMode('learning')}
                className={`px-3 py-1 rounded-full transition-all ${
                  mode === 'learning'
                    ? 'bg-warm-coral text-white'
                    : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                Learning Mode
              </button>
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-warm-coral text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isAIThinking && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-4 rounded-2xl">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 p-6 border-t border-white/10 bg-gradient-to-t from-deep-charcoal-light to-transparent">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleMicrophoneClick}
            disabled={isSpeaking || isAIThinking}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-warm-coral animate-pulse shadow-xl scale-110'
                : isSpeaking || isAIThinking
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-sage-green hover:bg-sage-green/80 shadow-lg hover:scale-105'
            }`}
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          
          <p className="text-white/60 text-sm">
            {isListening ? 'Listening...' : isSpeaking ? 'AI is speaking...' : isAIThinking ? 'AI is thinking...' : 'Tap to speak'}
          </p>
        </div>
      </div>
    </div>
  )
}