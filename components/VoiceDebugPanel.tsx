'use client'

import { useEffect, useState } from 'react'

interface VoiceDebugPanelProps {
  error: string | null
  isListening: boolean
  isSpeaking: boolean
  transcript: string
}

export default function VoiceDebugPanel({ error, isListening, isSpeaking, transcript }: VoiceDebugPanelProps) {
  const [browserSupport, setBrowserSupport] = useState({
    speechRecognition: false,
    speechSynthesis: false,
    mediaDevices: false,
  })

  useEffect(() => {
    setBrowserSupport({
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      speechSynthesis: 'speechSynthesis' in window,
      mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    })
  }, [])

  if (!error && browserSupport.speechRecognition && browserSupport.speechSynthesis) {
    return null // Don't show if everything is working
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-eerie-black border border-warm-coral p-4 rounded-lg shadow-lg z-50">
      <h3 className="text-warm-coral font-bold mb-2">Voice Debug Info</h3>
      
      <div className="text-sm space-y-2">
        <div>
          <span className="text-cadet-gray">Speech Recognition:</span>
          <span className={browserSupport.speechRecognition ? "text-green-500 ml-2" : "text-red-500 ml-2"}>
            {browserSupport.speechRecognition ? '✓ Supported' : '✗ Not Supported'}
          </span>
        </div>
        
        <div>
          <span className="text-cadet-gray">Speech Synthesis:</span>
          <span className={browserSupport.speechSynthesis ? "text-green-500 ml-2" : "text-red-500 ml-2"}>
            {browserSupport.speechSynthesis ? '✓ Supported' : '✗ Not Supported'}
          </span>
        </div>
        
        <div>
          <span className="text-cadet-gray">Microphone Access:</span>
          <span className={browserSupport.mediaDevices ? "text-green-500 ml-2" : "text-red-500 ml-2"}>
            {browserSupport.mediaDevices ? '✓ Available' : '✗ Not Available'}
          </span>
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-500/20 border border-red-500 rounded">
            <span className="text-red-500 font-bold">Error:</span>
            <p className="text-ghost-white mt-1">{error}</p>
          </div>
        )}
        
        <div className="mt-2 text-xs text-cadet-gray">
          <p>Status: {isListening ? '🎤 Listening' : isSpeaking ? '🔊 Speaking' : '⏸️ Idle'}</p>
          {transcript && <p>Last: "{transcript.substring(0, 50)}..."</p>}
        </div>
        
        <div className="mt-2 text-xs text-cadet-gray">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside">
            <li>Use Chrome or Edge for best compatibility</li>
            <li>Allow microphone permission when prompted</li>
            <li>Check if other apps are using the microphone</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>
      </div>
    </div>
  )
}