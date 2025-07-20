'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { checkAPIConfiguration, getBestProvider, APIStatus } from '@/lib/api-config-client'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { FeedbackButton } from '@/components/ui/FeedbackButton'

function APISettingsContent() {
  const { user } = useAuth()
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null)
  const [selectedProviders, setSelectedProviders] = useState({
    chat: 'openai',
    voiceRecognition: 'browser',
    voiceSynthesis: 'browser'
  })

  useEffect(() => {
    // Check API configuration status
    checkAPIConfiguration().then(status => {
      setApiStatus(status)
      
      // Set best available providers
      setSelectedProviders({
        chat: getBestProvider('chat', status) || 'openai',
        voiceRecognition: getBestProvider('stt', status) || 'browser',
        voiceSynthesis: getBestProvider('tts', status) || 'browser'
      })
    })
  }, [])

  const providerOptions = {
    chat: [
      { value: 'openai', label: 'OpenAI GPT', icon: '🤖' },
    ],
    voiceRecognition: [
      { value: 'browser', label: 'Browser (Free)', icon: '🌐' },
      { value: 'openai', label: 'OpenAI Whisper', icon: '🎙️' },
      { value: 'google', label: 'Google Speech', icon: '🔵' },
    ],
    voiceSynthesis: [
      { value: 'browser', label: 'Browser (Free)', icon: '🌐' },
      { value: 'openai', label: 'OpenAI TTS', icon: '🔊' },
      { value: 'elevenlabs', label: 'ElevenLabs', icon: '🎵' },
    ]
  }

  const handleProviderChange = (service: string, provider: string) => {
    setSelectedProviders(prev => ({
      ...prev,
      [service]: provider
    }))
    
    // Save to user preferences
    localStorage.setItem('apiProviders', JSON.stringify({
      ...selectedProviders,
      [service]: provider
    }))
  }

  const getStatusIcon = (configured: boolean) => {
    return configured ? '✅' : '❌'
  }

  const getStatusText = (configured: boolean) => {
    return configured ? 'Configured' : 'Not Configured'
  }

  if (!apiStatus) {
    return (
      <div className="min-h-screen bg-deep-charcoal flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-deep-charcoal">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-warm-coral mb-8">API Configuration</h1>

        {/* API Status Overview */}
        <div className="bg-jet rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-warm-coral mb-4">API Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-deep-charcoal rounded-lg">
              <div>
                <h3 className="font-semibold">OpenAI</h3>
                <p className="text-sm text-warm-coral-light">Chat, Voice Recognition, Voice Synthesis</p>
              </div>
              <div className="text-right">
                <span className="text-2xl">{getStatusIcon(apiStatus.openai.configured)}</span>
                <p className="text-sm text-warm-coral-light">{getStatusText(apiStatus.openai.configured)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-deep-charcoal rounded-lg">
              <div>
                <h3 className="font-semibold">ElevenLabs</h3>
                <p className="text-sm text-warm-coral-light">Premium Voice Synthesis</p>
              </div>
              <div className="text-right">
                <span className="text-2xl">{getStatusIcon(apiStatus.elevenLabs.configured)}</span>
                <p className="text-sm text-warm-coral-light">{getStatusText(apiStatus.elevenLabs.configured)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-deep-charcoal rounded-lg">
              <div>
                <h3 className="font-semibold">Google Cloud</h3>
                <p className="text-sm text-warm-coral-light">Speech Recognition</p>
              </div>
              <div className="text-right">
                <span className="text-2xl">{getStatusIcon(apiStatus.google.configured)}</span>
                <p className="text-sm text-warm-coral-light">{getStatusText(apiStatus.google.configured)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="bg-jet rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-warm-coral mb-4">Service Providers</h2>
          
          <div className="space-y-6">
            {/* Chat Provider */}
            <div>
              <h3 className="font-semibold mb-3">Chat Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {providerOptions.chat.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleProviderChange('chat', option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedProviders.chat === option.value
                        ? 'border-warm-coral bg-warm-coral/20'
                        : 'border-warm-coral/30 hover:border-warm-coral/50'
                    }`}
                    disabled={!apiStatus.openai.configured && option.value === 'openai'}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <p className="font-medium mt-2">{option.label}</p>
                    {!apiStatus.openai.configured && option.value === 'openai' && (
                      <p className="text-xs text-error mt-1">Not Available</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Recognition Provider */}
            <div>
              <h3 className="font-semibold mb-3">Voice Recognition</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {providerOptions.voiceRecognition.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleProviderChange('voiceRecognition', option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedProviders.voiceRecognition === option.value
                        ? 'border-warm-coral bg-warm-coral/20'
                        : 'border-warm-coral/30 hover:border-warm-coral/50'
                    }`}
                    disabled={
                      (option.value === 'openai' && !apiStatus.openai.configured) ||
                      (option.value === 'google' && !apiStatus.google.configured)
                    }
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <p className="font-medium mt-2">{option.label}</p>
                    {option.value === 'browser' && (
                      <p className="text-xs text-success mt-1">Always Available</p>
                    )}
                    {option.value === 'openai' && !apiStatus.openai.configured && (
                      <p className="text-xs text-error mt-1">Not Available</p>
                    )}
                    {option.value === 'google' && !apiStatus.google.configured && (
                      <p className="text-xs text-error mt-1">Not Available</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Synthesis Provider */}
            <div>
              <h3 className="font-semibold mb-3">Voice Synthesis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {providerOptions.voiceSynthesis.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleProviderChange('voiceSynthesis', option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedProviders.voiceSynthesis === option.value
                        ? 'border-warm-coral bg-warm-coral/20'
                        : 'border-warm-coral/30 hover:border-warm-coral/50'
                    }`}
                    disabled={
                      (option.value === 'openai' && !apiStatus.openai.configured) ||
                      (option.value === 'elevenlabs' && !apiStatus.elevenLabs.configured)
                    }
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <p className="font-medium mt-2">{option.label}</p>
                    {option.value === 'browser' && (
                      <p className="text-xs text-success mt-1">Always Available</p>
                    )}
                    {option.value === 'openai' && !apiStatus.openai.configured && (
                      <p className="text-xs text-error mt-1">Not Available</p>
                    )}
                    {option.value === 'elevenlabs' && !apiStatus.elevenLabs.configured && (
                      <p className="text-xs text-error mt-1">Not Available</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Instructions */}
        <div className="bg-jet rounded-lg p-6">
          <h2 className="text-xl font-bold text-warm-coral mb-4">Configuration Instructions</h2>
          
          <div className="space-y-4 text-sm text-warm-coral-light">
            <div>
              <h3 className="font-semibold text-white mb-2">For Developers:</h3>
              <p>To enable API features, add the following environment variables to your .env.local file:</p>
              <pre className="bg-deep-charcoal p-3 rounded mt-2 overflow-x-auto">
{`OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GOOGLE_SPEECH_API_KEY=your_google_api_key`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Free Options:</h3>
              <p>The browser-based options are always available and work offline. They provide good quality for most use cases.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Premium Options:</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>OpenAI:</strong> Better conversation quality and more natural voices</li>
                <li><strong>ElevenLabs:</strong> Most realistic voice synthesis available</li>
                <li><strong>Google:</strong> Excellent speech recognition accuracy</li>
              </ul>
            </div>
          </div>
        </div>

        <FeedbackButton variant="primary" className="mt-8">
          Save Settings
        </FeedbackButton>
      </div>
    </div>
  )
}

export default function APISettingsPage() {
  return (
    <ProtectedRoute>
      <APISettingsContent />
    </ProtectedRoute>
  )
}