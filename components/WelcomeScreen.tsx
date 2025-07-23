'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

interface WelcomeScreenProps {
  onStart: () => void
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    setMounted(true)
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light">
      {/* Mobile-optimized header */}
      {user && (
        <div className="flex items-center justify-end p-4 gap-3">
          <span className="text-white/60 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{user.email}</span>
          <button
            onClick={() => signOut()}
            className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      )}
      
      {/* Main content - centered with flex-1 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-safe-bottom">
        <div className={`max-w-md w-full text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Logo - responsive sizing */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
            <span className="text-warm-coral">Talk</span>
            <span className="text-white font-light">Time</span>
          </h1>
          
          {/* Tagline - responsive text */}
          <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-8 sm:mb-12 px-4">
            Practice English conversation with your friendly AI partner
          </p>
          
          {/* Main CTA - mobile-optimized */}
          <button
            onClick={onStart}
            className="w-full max-w-[280px] sm:max-w-xs mx-auto bg-warm-coral hover:bg-warm-coral-light text-white font-semibold py-4 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-base sm:text-lg"
          >
            Start Talking
          </button>
          
          {/* Secondary actions - stack on small screens */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 px-4">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 sm:py-2 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/20 transition-all duration-300"
              >
                View Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="inline-block px-6 py-3 sm:py-2 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/20 transition-all duration-300"
              >
                Sign In to Track Progress
              </Link>
            )}
          </div>
          
          {/* Animation - smaller on mobile */}
          <div className="mt-8 sm:mt-12 animate-pulse">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto text-warm-coral/30" viewBox="0 0 100 100">
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