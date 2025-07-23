// API Rate Limiting
export const RATE_LIMITS = {
  MAX_REQUESTS: 30,
  WINDOW_MS: 60 * 1000, // 1 minute
} as const

// Message Constraints
export const MESSAGE_LIMITS = {
  MAX_LENGTH: 5000, // Increased from 1000 to allow longer user inputs
  MAX_MESSAGE_LENGTH: 5000, // Alias for compatibility
  MAX_CONTEXT_MESSAGES: 10,
} as const

// Content Safety
export const BLOCKED_TOPICS = [
  'sexual',
  'violence', 
  'harm',
  'illegal',
  'drugs',
  'hate',
] as const

// OpenAI Configuration
export const OPENAI_CONFIG = {
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 500, // Increased from 400 for more natural responses
  TEMPERATURE: 0.8,
  FREQUENCY_PENALTY: 0.5,
  PRESENCE_PENALTY: 0.3,
} as const

// Session Configuration
export const SESSION_CONFIG = {
  MIN_DURATION_SECONDS: 30,
  MAX_DURATION_SECONDS: 3600, // 1 hour
  MAX_CONTEXT_MESSAGES: 10, // Add for compatibility
} as const

// Redis Configuration
export const REDIS_CONFIG = {
  DEFAULT_TTL: 3600, // 1 hour
  CACHE_PREFIX: 'talktime:',
} as const

// UI Constants
export const UI_CONFIG = {
  MESSAGE_SCROLL_DELAY: 100,
  DEBOUNCE_DELAY: 500,
  ANIMATION_DURATION: 300,
} as const

// Voice Configuration
export const VOICE_CONFIG = {
  DEFAULT_VOICE: 'hope',
  SPEECH_RATE: 1.0,
  SPEECH_PITCH: 1.0,
  SPEECH_VOLUME: 1.0,
} as const

// Assessment Configuration
export const ASSESSMENT_CONFIG = {
  MIN_MESSAGE_LENGTH: 10,
  CORRECTION_THRESHOLD: 0.8,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  INVALID_MESSAGE: 'Please enter a valid message.',
  API_ERROR: 'Sorry, I encountered an error. Please try again.',
  AUTH_REQUIRED: 'Please sign in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please refresh the page.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  SESSION_STARTED: 'Session started successfully!',
  SESSION_ENDED: 'Great job! Session completed.',
  ASSESSMENT_SAVED: 'Your progress has been saved.',
} as const