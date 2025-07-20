// ElevenLabs Voice Configuration
export interface ElevenLabsVoice {
  voiceId: string
  name: string
  category?: string
  description?: string
}

// Default voices available in ElevenLabs
export const DEFAULT_ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    category: 'default',
    description: 'Default female voice'
  },
  {
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'default',
    description: 'Calm female voice'
  },
  {
    voiceId: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    category: 'default',
    description: 'Strong female voice'
  },
  {
    voiceId: 'CYw3kZ02Hs0563khs1Fj',
    name: 'Dave',
    category: 'default',
    description: 'Conversational male voice'
  },
  {
    voiceId: 'D38z5RcWu1voky8WS1ja',
    name: 'Fin',
    category: 'default',
    description: 'Energetic male voice'
  },
  {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    category: 'default',
    description: 'Warm female voice'
  },
  {
    voiceId: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    category: 'default',
    description: 'Young female voice'
  },
  {
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    category: 'default',
    description: 'Hoarse male voice'
  },
  {
    voiceId: 'ODq5zmih8GrVes37Dizd',
    name: 'Patrick',
    category: 'default',
    description: 'Shouty male voice'
  },
  {
    voiceId: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry',
    category: 'default',
    description: 'Anxious male voice'
  },
  {
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    category: 'default',
    description: 'Articulate male voice'
  },
  {
    voiceId: 'ThT5KcBeYPX3keUQqHPh',
    name: 'Dorothy',
    category: 'default',
    description: 'Pleasant female voice'
  },
  {
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'default',
    description: 'Deep male voice'
  },
  {
    voiceId: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    category: 'default',
    description: 'Crisp male voice'
  },
  {
    voiceId: 'Z1NCgSJnwVborDcglLOp',
    name: 'Ethan',
    category: 'default',
    description: 'ASMR male voice'
  },
  {
    voiceId: 'Zlb1dXrM653N07WRdFW3',
    name: 'Lord',
    category: 'default',
    description: 'Deep male voice'
  },
  {
    voiceId: 'bVMeCyTHy58xNoL34h3p',
    name: 'Jeremy',
    category: 'default',
    description: 'Excited male voice'
  },
  {
    voiceId: 'g5CIjZEefAph4nQFvHAz',
    name: 'Michael',
    category: 'default',
    description: 'Calm male voice'
  },
  {
    voiceId: 'oWAxZDx7w5VEj9dCyTzz',
    name: 'Grace',
    category: 'default',
    description: 'Southern US female voice'
  },
  {
    voiceId: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    category: 'default',
    description: 'Warm female voice'
  },
  {
    voiceId: 'piTKgcLEGmPE4e6mEKli',
    name: 'Nicole',
    category: 'default',
    description: 'Whisper female voice'
  },
  // Custom voices from voice library
  {
    voiceId: '1t1EeRixsJrKbiF1zwM6',
    name: 'Jerry B.',
    category: 'voice-library',
    description: 'Male voice from ElevenLabs voice library'
  }
]

// Get voice by ID
export function getElevenLabsVoice(voiceId: string): ElevenLabsVoice | undefined {
  return DEFAULT_ELEVENLABS_VOICES.find(voice => voice.voiceId === voiceId)
}

// Get voice ID by name
export function getElevenLabsVoiceId(name: string): string | undefined {
  const voice = DEFAULT_ELEVENLABS_VOICES.find(
    v => v.name.toLowerCase() === name.toLowerCase()
  )
  return voice?.voiceId
}