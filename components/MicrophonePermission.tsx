'use client'

import { useState } from 'react'

interface MicrophonePermissionProps {
  onPermissionGranted: () => void
  onPermissionDenied: () => void
}

export default function MicrophonePermission({ 
  onPermissionGranted, 
  onPermissionDenied 
}: MicrophonePermissionProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestPermission = async () => {
    setIsRequesting(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      onPermissionGranted()
    } catch (err) {
      const error = err as Error
      if (error.name === 'NotAllowedError') {
        setError('Microphone access was denied. Please allow access in your browser settings.')
        onPermissionDenied()
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.')
        onPermissionDenied()
      } else {
        setError('Failed to access microphone. Please check your device settings.')
        onPermissionDenied()
      }
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-deep-charcoal rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-warm-coral/20 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 sm:w-10 sm:h-10 text-warm-coral"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Microphone Access Required
          </h2>
          
          <p className="text-sm sm:text-base text-white/80">
            TalkTime needs access to your microphone to hear you speak and help you practice English.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={requestPermission}
          disabled={isRequesting}
          className="w-full bg-warm-coral hover:bg-warm-coral-light text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRequesting ? 'Requesting Access...' : 'Allow Microphone Access'}
        </button>

        <p className="mt-4 text-xs text-white/60">
          Your privacy is important. Audio is processed in real-time and not stored.
        </p>
      </div>
    </div>
  )
}