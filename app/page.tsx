'use client'

import { useState } from 'react'
import WelcomeScreen from '@/components/WelcomeScreen'
import ConversationScreen from '@/components/ConversationScreen'
import SessionCompleteScreen from '@/components/SessionCompleteScreen'

type AppState = 'welcome' | 'conversation' | 'complete'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [sessionData, setSessionData] = useState({
    startTime: null as Date | null,
    talkTime: 0,
  })

  const handleStartConversation = () => {
    setSessionData({
      startTime: new Date(),
      talkTime: 0,
    })
    setAppState('conversation')
  }

  const handleEndConversation = (talkTime: number) => {
    setSessionData(prev => ({ ...prev, talkTime }))
    setAppState('complete')
  }

  const handleContinue = () => {
    setAppState('conversation')
  }

  const handleNewSession = () => {
    setSessionData({
      startTime: null,
      talkTime: 0,
    })
    setAppState('welcome')
  }

  return (
    <main className="h-screen overflow-hidden">
      {appState === 'welcome' && (
        <WelcomeScreen onStart={handleStartConversation} />
      )}
      {appState === 'conversation' && (
        <ConversationScreen onEnd={handleEndConversation} />
      )}
      {appState === 'complete' && (
        <SessionCompleteScreen
          onContinue={handleContinue}
          onNewSession={handleNewSession}
        />
      )}
    </main>
  )
}