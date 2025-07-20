// API Configuration for voice and chat services

export const API_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    models: {
      chat: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
      whisper: 'whisper-1',
      tts: 'tts-1',
    },
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    defaultVoice: 'nova',
  },

  // ElevenLabs Configuration
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    baseUrl: 'https://api.elevenlabs.io/v1',
    model: 'eleven_turbo_v2',
    voices: {
      'nova': '21m00Tcm4TlvDq8ikWAM', // Rachel
      'alloy': 'AZnzlk1XvdvUeBnXmlld', // Domi
      'echo': 'EXAVITQu4vr4xnSDxMaL', // Bella
      'fable': 'MF3mGyEYCl7XYWbV9V6O', // Elli
      'onyx': 'N2lVS1w4EtoT3dr4eOWO', // Callum
      'shimmer': 'ThT5KcBeYPX3keUQqHPh' // Charlotte
    },
  },

  // Google Cloud Configuration
  google: {
    apiKey: process.env.GOOGLE_SPEECH_API_KEY,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  },

  // Rate Limiting
  rateLimits: {
    chat: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
    },
    voice: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  // Voice Settings
  voice: {
    defaultProvider: process.env.VOICE_PROVIDER || 'browser',
    defaultLanguage: 'en-US',
    maxAudioDuration: 300, // 5 minutes in seconds
    maxAudioSize: 25 * 1024 * 1024, // 25MB
  },

  // Chat Settings
  chat: {
    maxMessageLength: 1000,
    maxContextMessages: 10,
    defaultTemperature: 0.8,
    maxTokens: 400,
  },
}

// Helper function to check if API keys are configured
export function checkAPIConfiguration() {
  const status = {
    openai: {
      configured: !!API_CONFIG.openai.apiKey,
      features: {
        chat: !!API_CONFIG.openai.apiKey,
        whisper: !!API_CONFIG.openai.apiKey,
        tts: !!API_CONFIG.openai.apiKey,
      }
    },
    elevenLabs: {
      configured: !!API_CONFIG.elevenLabs.apiKey,
      features: {
        tts: !!API_CONFIG.elevenLabs.apiKey,
      }
    },
    google: {
      configured: !!API_CONFIG.google.apiKey,
      features: {
        stt: !!API_CONFIG.google.apiKey,
      }
    },
    overall: {
      chat: !!API_CONFIG.openai.apiKey,
      voiceRecognition: true, // Always true due to browser support
      voiceSynthesis: true, // Always true due to browser support
    }
  }

  return status
}

// Get the best available provider for a service
export function getBestProvider(service: 'tts' | 'stt' | 'chat') {
  const config = checkAPIConfiguration()

  switch (service) {
    case 'tts':
      if (config.openai.features.tts) return 'openai'
      if (config.elevenLabs.features.tts) return 'elevenlabs'
      return 'browser'
    
    case 'stt':
      if (config.openai.features.whisper) return 'openai'
      if (config.google.features.stt) return 'google'
      return 'browser'
    
    case 'chat':
      if (config.openai.features.chat) return 'openai'
      return null
    
    default:
      return null
  }
}