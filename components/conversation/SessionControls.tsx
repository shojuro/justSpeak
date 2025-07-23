'use client'

interface SessionControlsProps {
  mode: 'conversation' | 'learning'
  isListening: boolean
  isSpeaking: boolean
  isLocked?: boolean
  speechError: any
  userTime: number
  voiceControlMode?: 'continuous' | 'push-to-talk'
  onModeToggle: () => void
  onMicrophoneToggle: () => void
  onEndSession: () => void
  onProviderSettings?: () => void
}

export default function SessionControls({
  mode,
  isListening,
  isSpeaking,
  isLocked = false,
  speechError,
  userTime,
  voiceControlMode = 'continuous',
  onModeToggle,
  onMicrophoneToggle,
  onEndSession,
  onProviderSettings,
}: SessionControlsProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-jet/50 border-t border-warm-coral-light">
      {/* Mobile-optimized padding with safe area */}
      <div className="p-3 sm:p-4 pb-safe-bottom">
        {/* Mode Toggle - smaller on mobile */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="bg-jet/30 rounded-full p-0.5 sm:p-1 flex text-xs sm:text-sm" role="tablist" aria-label="Conversation mode selector">
            <button
              onClick={onModeToggle}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
                mode === 'conversation'
                  ? 'bg-warm-coral text-white'
                  : 'text-warm-coral hover:text-warm-coral-light'
              }`}
              role="tab"
              aria-selected={mode === 'conversation'}
              aria-controls="conversation-panel"
              id="conversation-tab"
              tabIndex={mode === 'conversation' ? 0 : -1}
            >
              Conversation
            </button>
            <button
              onClick={onModeToggle}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
                mode === 'learning'
                  ? 'bg-warm-coral text-white'
                  : 'text-warm-coral hover:text-warm-coral-light'
              }`}
              role="tab"
              aria-selected={mode === 'learning'}
              aria-controls="learning-panel"
              id="learning-tab"
              tabIndex={mode === 'learning' ? 0 : -1}
            >
              Learning Mode
            </button>
          </div>
        </div>

        {/* Speaking Time Tracker - responsive text */}
        <div className="mb-3 sm:mb-4 text-center">
          <div className="text-base sm:text-lg text-warm-coral font-medium">
            Your speaking time: {formatTime(userTime)}
          </div>
          <p className="text-xs text-warm-coral/60 mt-1 px-4">
            {voiceControlMode === 'push-to-talk' 
              ? <span className="hidden sm:inline">Hold spacebar or click mic button to speak</span>
              : 'Keep talking to improve your English!'}
            {voiceControlMode === 'push-to-talk' && 
              <span className="sm:hidden">Tap mic button to speak</span>}
          </p>
        </div>

        {/* Controls - mobile layout */}
        <div className="flex items-center justify-between gap-3">
          {/* Left side controls */}
          <div className="flex gap-2">
            <button
              onClick={onEndSession}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-jet/50 text-warm-coral text-sm sm:text-base rounded-full hover:bg-jet/70 transition-colors"
            >
              End
            </button>
            
            {onProviderSettings && (
              <button
                onClick={onProviderSettings}
                className="p-2.5 sm:p-3 bg-jet/50 text-warm-coral rounded-full hover:bg-jet/70 transition-colors"
                aria-label="Voice provider settings"
                title="Voice provider settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>
          
          {/* Center - Microphone button with activity indicator */}
          <div className="relative">
            {/* Animated ring for listening state */}
            {isListening && (
              <div className="absolute inset-0 rounded-full animate-ping bg-warm-coral opacity-75" />
            )}
            
            {/* Microphone button */}
            <button
              onClick={onMicrophoneToggle}
              disabled={isSpeaking || isLocked}
              className={`relative p-4 sm:p-5 rounded-full transition-all transform ${
                isLocked
                  ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                  : isListening
                  ? 'bg-warm-coral text-white scale-110 shadow-lg'
                  : 'bg-warm-coral-light text-jet hover:bg-warm-coral hover:text-white'
              } ${isSpeaking || isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isLocked ? 'Microphone locked' : isListening ? 'Stop recording' : 'Start recording'}
            >
              {isLocked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7 sm:w-6 sm:h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`w-7 h-7 sm:w-6 sm:h-6 ${isListening ? 'animate-pulse' : ''}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                  />
                </svg>
              )}
              
              {/* Live indicator dot */}
              {isListening && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Right side - mode indicator */}
          {mode === 'learning' && (
            <div className="text-xs text-warm-coral/80 bg-warm-coral/10 px-2 sm:px-3 py-1 rounded-full">
              <span className="hidden sm:inline">📝 Grammar</span>
              <span className="sm:hidden">📝</span>
            </div>
          )}
          
          {/* Spacer for when not in learning mode */}
          {mode !== 'learning' && <div className="w-12 sm:w-20" />}
        </div>

        {/* Error message - mobile-friendly */}
        {speechError && (
          <div className="mt-2 text-xs text-red-400 text-center px-4">
            {speechError.message || 'Microphone error'}
          </div>
        )}
      </div>
    </div>
  )
}