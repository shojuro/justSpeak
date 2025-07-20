'use client'

interface ConversationHeaderProps {
  talkTime: number
}

export default function ConversationHeader({ talkTime }: ConversationHeaderProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-warm-coral p-4 text-white safe-top">
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-semibold">Conversation Time</h2>
        <span className="text-xl sm:text-2xl font-mono">{formatTime(talkTime)}</span>
      </div>
    </div>
  )
}