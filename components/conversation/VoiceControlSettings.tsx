'use client'

import { useState, useEffect } from 'react'

interface VoiceControlSettingsProps {
  onModeChange: (mode: 'continuous' | 'push-to-talk') => void
  onSensitivityChange: (sensitivity: number) => void
  onSilenceThresholdChange?: (threshold: number) => void
  onPatientModeChange?: (enabled: boolean) => void
}

export default function VoiceControlSettings({ 
  onModeChange, 
  onSensitivityChange,
  onSilenceThresholdChange,
  onPatientModeChange
}: VoiceControlSettingsProps) {
  const [mode, setMode] = useState<'continuous' | 'push-to-talk'>('push-to-talk')
  const [sensitivity, setSensitivity] = useState(3) // 1-5 scale
  const [silenceThreshold, setSilenceThreshold] = useState(8) // 3-15 seconds
  const [patientMode, setPatientMode] = useState(false)

  // Load saved preferences on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('voice_control_mode') as 'continuous' | 'push-to-talk'
    const savedSensitivity = localStorage.getItem('voice_sensitivity')
    const savedThreshold = localStorage.getItem('silence_threshold')
    const savedPatientMode = localStorage.getItem('patient_mode')
    
    if (savedMode) {
      setMode(savedMode)
      onModeChange(savedMode)
    }
    if (savedSensitivity) {
      const value = Number(savedSensitivity)
      setSensitivity(value)
      onSensitivityChange(value)
    }
    if (savedThreshold) {
      const value = Number(savedThreshold)
      setSilenceThreshold(value)
      onSilenceThresholdChange?.(value)
    }
    if (savedPatientMode) {
      const enabled = savedPatientMode === 'true'
      setPatientMode(enabled)
      onPatientModeChange?.(enabled)
    }
  }, [])

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

  const handleSilenceThresholdChange = (value: number) => {
    setSilenceThreshold(value)
    onSilenceThresholdChange?.(value)
    localStorage.setItem('silence_threshold', value.toString())
  }

  const handlePatientModeChange = (enabled: boolean) => {
    setPatientMode(enabled)
    onPatientModeChange?.(enabled)
    localStorage.setItem('patient_mode', enabled.toString())
    
    // If enabling patient mode, set threshold to maximum
    if (enabled && silenceThreshold < 12) {
      handleSilenceThresholdChange(12)
    }
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

      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">
          Silence Detection Threshold
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="3"
            max="15"
            step="0.5"
            value={silenceThreshold}
            onChange={(e) => handleSilenceThresholdChange(Number(e.target.value))}
            className="flex-1"
            disabled={patientMode}
          />
          <span className="text-sm font-mono bg-charcoal px-2 py-1 rounded min-w-[3rem] text-center">
            {silenceThreshold}s
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          How long to wait after you stop speaking before processing (for thinking time)
        </p>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={patientMode}
            onChange={(e) => handlePatientModeChange(e.target.checked)}
            className="w-4 h-4 text-coral bg-charcoal border-gray-600 rounded focus:ring-coral"
          />
          <div>
            <span className="text-sm text-gray-300">Patient Mode</span>
            <p className="text-xs text-gray-400">
              Extra long pauses for language learners (12+ seconds)
            </p>
          </div>
        </label>
      </div>

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