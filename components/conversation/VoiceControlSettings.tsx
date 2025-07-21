'use client'

import { useState } from 'react'

interface VoiceControlSettingsProps {
  onModeChange: (mode: 'continuous' | 'push-to-talk') => void
  onSensitivityChange: (sensitivity: number) => void
}

export default function VoiceControlSettings({ onModeChange, onSensitivityChange }: VoiceControlSettingsProps) {
  const [mode, setMode] = useState<'continuous' | 'push-to-talk'>('continuous')
  const [sensitivity, setSensitivity] = useState(3) // 1-5 scale

  const handleModeChange = (newMode: 'continuous' | 'push-to-talk') => {
    setMode(newMode)
    onModeChange(newMode)
    localStorage.setItem('voice_control_mode', newMode)
  }

  const handleSensitivityChange = (value: number) => {
    setSensitivity(value)
    onSensitivityChange(value)
    localStorage.setItem('voice_sensitivity', value.toString())
  }

  return (
    <div className="bg-dark-gray p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-3">Voice Control Settings</h3>
      
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">Microphone Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('continuous')}
            className={`px-4 py-2 rounded ${
              mode === 'continuous' 
                ? 'bg-coral text-white' 
                : 'bg-charcoal text-gray-300 hover:bg-gray-700'
            }`}
          >
            Always On
          </button>
          <button
            onClick={() => handleModeChange('push-to-talk')}
            className={`px-4 py-2 rounded ${
              mode === 'push-to-talk' 
                ? 'bg-coral text-white' 
                : 'bg-charcoal text-gray-300 hover:bg-gray-700'
            }`}
          >
            Push to Talk
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {mode === 'continuous' 
            ? 'Microphone stays on (may cause feedback)' 
            : 'Hold spacebar or click mic button to speak'}
        </p>
      </div>

      {mode === 'continuous' && (
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">
            Voice Detection Sensitivity
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={sensitivity}
            onChange={(e) => handleSensitivityChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Higher sensitivity = less background noise but may miss quiet speech
          </p>
        </div>
      )}

      <div className="bg-charcoal p-3 rounded text-sm">
        <p className="text-yellow-400 font-semibold mb-1">Tip to Avoid Feedback:</p>
        <ul className="text-gray-300 space-y-1 text-xs">
          <li>• Use headphones or earbuds</li>
          <li>• Use Push-to-Talk mode</li>
          <li>• Lower your speaker volume</li>
          <li>• Position mic away from speakers</li>
        </ul>
      </div>
    </div>
  )
}