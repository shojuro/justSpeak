'use client'

import { useState, useEffect } from 'react'
import { checkAPIConfiguration, APIStatus } from '@/lib/api-config-client'
import { FeedbackButton } from '@/components/ui/FeedbackButton'

interface ProviderSelectorProps {
  voiceProvider: 'browser' | 'openai' | 'google'
  synthProvider: 'browser' | 'openai' | 'elevenlabs'
  onProviderChange: (type: 'stt' | 'tts', provider: string) => void
  onClose: () => void
}

export default function ProviderSelector({
  voiceProvider,
  synthProvider,
  onProviderChange,
  onClose
}: ProviderSelectorProps) {
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null)
  
  useEffect(() => {
    checkAPIConfiguration().then(setApiStatus)
  }, [])
  
  if (!apiStatus) {
    return (
      <div className="fixed inset-0 bg-deep-charcoal/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-jet rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral"></div>
        </div>
      </div>
    )
  }

  const voiceOptions = [
    { 
      value: 'browser', 
      label: 'Browser (Free)', 
      icon: '🌐',
      description: 'Works offline, good quality',
      available: true
    },
    { 
      value: 'openai', 
      label: 'OpenAI Whisper', 
      icon: '🎙️',
      description: 'High accuracy, requires API key',
      available: apiStatus.openai.configured
    },
    { 
      value: 'google', 
      label: 'Google Speech', 
      icon: '🔵',
      description: 'Excellent accuracy, requires API key',
      available: apiStatus.google.configured
    },
  ]

  const synthOptions = [
    { 
      value: 'browser', 
      label: 'Browser (Free)', 
      icon: '🌐',
      description: 'Works offline, basic quality',
      available: true
    },
    { 
      value: 'openai', 
      label: 'OpenAI TTS', 
      icon: '🔊',
      description: 'Natural voices, requires API key',
      available: apiStatus.openai.configured
    },
    { 
      value: 'elevenlabs', 
      label: 'ElevenLabs', 
      icon: '🎵',
      description: 'Most realistic voices, premium',
      available: apiStatus.elevenLabs.configured
    },
  ]

  return (
    <div className="fixed inset-0 bg-deep-charcoal/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-jet rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-warm-coral">Voice Provider Settings</h2>
            <button
              onClick={onClose}
              className="text-warm-coral-light hover:text-warm-coral transition-colors"
              aria-label="Close settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Voice Recognition Provider */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Voice Recognition (Speech-to-Text)</h3>
            <div className="grid gap-3">
              {voiceOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onProviderChange('stt', option.value)}
                  disabled={!option.available}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    voiceProvider === option.value
                      ? 'border-warm-coral bg-warm-coral/20'
                      : option.available
                      ? 'border-warm-coral/30 hover:border-warm-coral/50'
                      : 'border-warm-coral/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-warm-coral-light mt-1">{option.description}</p>
                      {!option.available && (
                        <p className="text-xs text-error mt-2">API key not configured</p>
                      )}
                    </div>
                    {voiceProvider === option.value && (
                      <span className="text-warm-coral">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Synthesis Provider */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Voice Synthesis (Text-to-Speech)</h3>
            <div className="grid gap-3">
              {synthOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onProviderChange('tts', option.value)}
                  disabled={!option.available}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    synthProvider === option.value
                      ? 'border-warm-coral bg-warm-coral/20'
                      : option.available
                      ? 'border-warm-coral/30 hover:border-warm-coral/50'
                      : 'border-warm-coral/20 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-warm-coral-light mt-1">{option.description}</p>
                      {!option.available && (
                        <p className="text-xs text-error mt-2">API key not configured</p>
                      )}
                    </div>
                    {synthProvider === option.value && (
                      <span className="text-warm-coral">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* ElevenLabs Voice Selection */}
            {synthProvider === 'elevenlabs' && apiStatus.elevenLabs.configured && (
              <div className="mt-4 p-4 bg-deep-charcoal rounded-lg">
                <h4 className="font-medium mb-3">ElevenLabs Voice</h4>
                <select
                  value={selectedElevenLabsVoice}
                  onChange={(e) => {
                    setSelectedElevenLabsVoice(e.target.value)
                    onElevenLabsVoiceChange?.(e.target.value)
                  }}
                  className="w-full p-2 bg-jet border border-warm-coral/30 rounded-lg text-warm-coral-light"
                >
                  <optgroup label="Default Voices">
                    {DEFAULT_ELEVENLABS_VOICES.filter(v => v.category !== 'voice-library').map(voice => (
                      <option key={voice.voiceId} value={voice.voiceId}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Voice Library">
                    {DEFAULT_ELEVENLABS_VOICES.filter(v => v.category === 'voice-library').map(voice => (
                      <option key={voice.voiceId} value={voice.voiceId}>
                        {voice.name} - {voice.description}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
          </div>

          {/* API Status Summary */}
          <div className="bg-deep-charcoal rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-2">API Configuration Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>OpenAI API:</span>
                <span className={apiStatus.openai.configured ? 'text-success' : 'text-error'}>
                  {apiStatus.openai.configured ? '✓ Configured' : '✗ Not configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ElevenLabs API:</span>
                <span className={apiStatus.elevenLabs.configured ? 'text-success' : 'text-error'}>
                  {apiStatus.elevenLabs.configured ? '✓ Configured' : '✗ Not configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Google Speech API:</span>
                <span className={apiStatus.google.configured ? 'text-success' : 'text-error'}>
                  {apiStatus.google.configured ? '✓ Configured' : '✗ Not configured'}
                </span>
              </div>
            </div>
          </div>

          <FeedbackButton 
            variant="secondary" 
            onClick={onClose}
            className="w-full"
          >
            Done
          </FeedbackButton>
        </div>
      </div>
    </div>
  )
}