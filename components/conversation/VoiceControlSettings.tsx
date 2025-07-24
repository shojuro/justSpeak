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
  // Force push-to-talk mode only for safety
  const [mode, setMode] = useState<'continuous' | 'push-to-talk'>('push-to-talk')
  const [sensitivity, setSensitivity] = useState(3) // 1-5 scale
  const [silenceThreshold, setSilenceThreshold] = useState(8) // 3-15 seconds
  const [patientMode, setPatientMode] = useState(false)

  // Load saved preferences on mount
  useEffect(() => {
    // ALWAYS use push-to-talk mode for safety
    setMode('push-to-talk')
    onModeChange('push-to-talk')
    localStorage.setItem('voice_control_mode', 'push-to-talk')
    
    const savedSensitivity = localStorage.getItem('voice_sensitivity')
    const savedThreshold = localStorage.getItem('silence_threshold')
    const savedPatientMode = localStorage.getItem('patient_mode')
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
        <div className="bg-charcoal p-3 rounded">
          <p className="text-sm text-coral font-semibold mb-1">🎤 Push-to-Talk Mode Only</p>
          <p className="text-xs text-gray-300">
            For safety and privacy, the microphone requires manual activation.
            Hold the spacebar or click the mic button to speak.
          </p>
        </div>
        <div className="mt-3 p-3 bg-jet rounded border border-coral/20">
          <p className="text-xs text-coral-light">
            <strong>Why Push-to-Talk?</strong><br/>
            • Prevents the AI from hearing itself<br/>
            • Ensures privacy for you and your family<br/>
            • Gives you full control over when to speak
          </p>
        </div>
      </div>

      {/* Voice sensitivity settings removed - not needed for push-to-talk */}

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