'use client'

interface SessionCompleteScreenProps {
  onContinue: () => void
  onNewSession: () => void
}

export default function SessionCompleteScreen({ onContinue, onNewSession }: SessionCompleteScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-deep-charcoal to-deep-charcoal-light">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg className="w-32 h-32 mx-auto text-soft-gold" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">
          Great conversation!
        </h2>
        
        <p className="text-lg text-white/80 mb-12">
          You're doing amazing. Every conversation helps you get more comfortable speaking English.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={onContinue}
            className="w-full bg-warm-coral hover:bg-warm-coral-light text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Continue Talking
          </button>
          
          <button
            onClick={onNewSession}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300"
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  )
}