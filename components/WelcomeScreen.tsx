'use client'

import { useEffect, useState } from 'react'

interface WelcomeScreenProps {
  onStart: () => void
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
    }
  }, [])

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light">
      <div className="max-w-md w-full text-center">
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-warm-coral">Talk</span>
            <span className="text-white font-light">Time</span>
          </h1>
          
          <p className="text-lg text-white/80 mb-12">
            Practice English conversation with your friendly AI partner
          </p>
          
          <button
            onClick={onStart}
            className="w-full max-w-xs mx-auto bg-warm-coral hover:bg-warm-coral-light text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Start Talking
          </button>
          
          <div className="mt-8 animate-pulse">
            <svg className="w-24 h-24 mx-auto text-warm-coral/30" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}