// Client-side API configuration helper
// This file provides client-safe API configuration checks

import { logger } from './logger'

export interface APIStatus {
  openai: {
    configured: boolean
    features: {
      chat: boolean
      whisper: boolean
      tts: boolean
    }
  }
  elevenLabs: {
    configured: boolean
    features: {
      tts: boolean
    }
  }
  google: {
    configured: boolean
    features: {
      stt: boolean
    }
  }
  overall: {
    chat: boolean
    voiceRecognition: boolean
    voiceSynthesis: boolean
  }
}

// Client-side function to check API configuration
export async function checkAPIConfiguration(): Promise<APIStatus> {
  try {
    // Call server endpoint to check API configuration
    const response = await fetch('/api/config/status')
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    logger.error('Failed to check API configuration', error as Error)
  }

  // Default status if API check fails
  return {
    openai: {
      configured: false,
      features: {
        chat: false,
        whisper: false,
        tts: false,
      }
    },
    elevenLabs: {
      configured: false,
      features: {
        tts: false,
      }
    },
    google: {
      configured: false,
      features: {
        stt: false,
      }
    },
    overall: {
      chat: false,
      voiceRecognition: true, // Always true due to browser support
      voiceSynthesis: true, // Always true due to browser support
    }
  }
}

// Get the best available provider for a service
export function getBestProvider(service: 'tts' | 'stt' | 'chat', status: APIStatus): string | null {
  switch (service) {
    case 'tts':
      if (status.openai.features.tts) return 'openai'
      if (status.elevenLabs.features.tts) return 'elevenlabs'
      return 'browser'
    
    case 'stt':
      if (status.openai.features.whisper) return 'openai'
      if (status.google.features.stt) return 'google'
      return 'browser'
    
    case 'chat':
      if (status.openai.features.chat) return 'openai'
      return null
    
    default:
      return null
  }
}

// Get saved provider preference from localStorage
export function getSavedProvider(type: 'stt' | 'tts'): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`provider_${type}`)
  }
  return null
}

// Save provider preference to localStorage
export function saveProvider(type: 'stt' | 'tts', provider: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`provider_${type}`, provider)
  }
}