'use client'

import { useState } from 'react'
import { Message } from './MessageList'
import { formatTime } from '@/lib/utils'

interface TranscriptViewProps {
  messages: Message[]
  sessionDuration: number
  showTimestamps?: boolean
}

export default function TranscriptView({ 
  messages, 
  sessionDuration,
  showTimestamps = true 
}: TranscriptViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const exportTranscript = () => {
    const transcript = generateTranscript()
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `talktime-transcript-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateTranscript = () => {
    let transcript = 'TalkTime Conversation Transcript\n'
    transcript += '================================\n\n'
    transcript += `Date: ${new Date().toLocaleDateString()}\n`
    transcript += `Duration: ${formatTime(sessionDuration)}\n`
    transcript += `Messages: ${messages.length}\n\n`
    transcript += 'Conversation:\n'
    transcript += '-------------\n\n'

    messages.forEach((message, index) => {
      const speaker = message.role === 'user' ? 'You' : 'TalkTime'
      const timestamp = showTimestamps ? `[${message.timestamp.toLocaleTimeString()}] ` : ''
      
      transcript += `${timestamp}${speaker}: ${message.content}\n\n`
      
      if (message.assessment) {
        transcript += '  📝 Language Assessment:\n'
        transcript += `  Corrected: ${message.assessment.correctedText}\n`
        transcript += `  Areas to improve: ${message.assessment.areasToImprove.join(', ')}\n\n`
      }
    })

    return transcript
  }

  return (
    <div className="bg-jet/50 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-warm-coral">
          Conversation Transcript
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-warm-coral-light text-jet rounded-full hover:bg-warm-coral hover:text-white transition-colors"
            aria-expanded={isExpanded}
            aria-controls="transcript-content"
          >
            {isExpanded ? 'Hide' : 'Show'} Transcript
          </button>
          <button
            onClick={exportTranscript}
            className="px-3 py-1 text-sm bg-warm-coral text-white rounded-full hover:bg-warm-coral-dark transition-colors"
            aria-label="Download transcript as text file"
          >
            Download TXT
          </button>
        </div>
      </div>

      {isExpanded && (
        <div 
          id="transcript-content"
          className="max-h-96 overflow-y-auto p-4 bg-jet/30 rounded-lg text-sm"
          role="log"
          aria-label="Conversation transcript"
        >
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={message.id} className="border-b border-warm-coral-light/20 pb-3 last:border-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-warm-coral">
                    {message.role === 'user' ? 'You' : 'TalkTime'}:
                  </span>
                  {showTimestamps && (
                    <span className="text-xs text-warm-coral/60">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-white/90">{message.content}</p>
                
                {message.assessment && (
                  <div className="mt-2 pl-4 border-l-2 border-warm-coral/30">
                    <p className="text-xs text-warm-coral/80 mb-1">📝 Corrected version:</p>
                    <p className="text-sm text-white/80 italic">{message.assessment.correctedText}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen reader announcement for transcript availability */}
      <div className="sr-only" role="status" aria-live="polite">
        A text transcript of this conversation is available. Press the Show Transcript button to view it or Download TXT to save it.
      </div>
    </div>
  )
}