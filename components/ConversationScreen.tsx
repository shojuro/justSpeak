'use client'

import { useState, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const talkStartRef = useRef<Date | null>(null)
  const talkTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition()
  const { speak, isSpeaking } = useSpeechSynthesis()

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
    if (transcript && !isListening && !isSpeaking) {
      handleUserMessage(transcript)
    }
  }, [transcript, isListening, isSpeaking])

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

    // TODO: Replace with actual OpenAI API call
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "That's really interesting! Tell me more about that.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsAIThinking(false)
      speak(aiResponse.content)
    }, 1000)
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
    <div className="h-full flex flex-col bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light">
      <header className="p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">TalkTime</h2>
          <button
            onClick={handleEndSession}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      <div className="p-6 border-t border-white/10">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleMicrophoneClick}
            disabled={isSpeaking || isAIThinking}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-warm-coral animate-pulse shadow-xl scale-110'
                : isSpeaking || isAIThinking
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-sage-green hover:bg-sage-green/80 shadow-lg hover:scale-105'
            }`}
          >
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
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