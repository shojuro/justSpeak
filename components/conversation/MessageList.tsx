'use client'

import { useEffect, useRef } from 'react'
import AssessmentDisplay from '@/components/AssessmentDisplay'
import { MessageSkeleton } from '@/components/ui/Skeleton'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  assessment?: {
    correctedText: string
    corrections: Array<{
      type: string
      original: string
      corrected: string
      explanation: string
    }>
    areasToImprove: string[]
  }
}

interface MessageListProps {
  messages: Message[]
  isAIThinking: boolean
  mode: 'conversation' | 'learning'
  isLoading?: boolean
}

export default function MessageList({ messages, isAIThinking, mode, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
              message.role === 'user'
                ? 'bg-warm-coral text-white'
                : 'bg-warm-coral-light text-jet'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
            <p className="text-xs mt-2 opacity-70">
              {message.timestamp.toLocaleTimeString()}
            </p>
            {message.assessment && mode === 'learning' && (
              <div className="mt-4">
                <AssessmentDisplay assessment={message.assessment} />
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isAIThinking && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-warm-coral-light rounded-2xl p-4 max-w-[85%] sm:max-w-[75%]">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-jet/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-jet/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-jet/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}