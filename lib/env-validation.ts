/**
 * Environment Variable Validation
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  // Required in all environments
  required: string[]
  // Required only in production
  requiredInProduction: string[]
  // Optional but recommended
  optional: string[]
}

const envConfig: EnvConfig = {
  required: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  requiredInProduction: [
    'OPENAI_API_KEY',
    'DATABASE_URL',
    'JWT_SECRET',
  ],
  optional: [
    'ELEVENLABS_API_KEY',
    'GOOGLE_SPEECH_API_KEY',
    'GOOGLE_CLOUD_PROJECT_ID',
    'REMOTE_LOGGING_ENDPOINT',
    'REMOTE_LOGGING_TOKEN',
    'REDIS_URL',
  ],
}

export interface ValidationResult {
  isValid: boolean
  missing: string[]
  warnings: string[]
}

/**
 * Validates environment variables
 * @throws Error if required variables are missing
 */
export function validateEnv(): ValidationResult {
  const isProduction = process.env.NODE_ENV === 'production'
  const errors: string[] = []
  const warnings: string[] = []

  // Check required variables
  const requiredVars = [
    ...envConfig.required,
    ...(isProduction ? envConfig.requiredInProduction : []),
  ]

  const missing = requiredVars.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    errors.push(...missing)
  }

  // Check optional variables
  const missingOptional = envConfig.optional.filter(key => !process.env[key])
  if (missingOptional.length > 0) {
    warnings.push(...missingOptional)
  }

  // Specific validations
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && 
      !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
  }

  if (process.env.DATABASE_URL && 
      !process.env.DATABASE_URL.startsWith('postgresql://') &&
      !process.env.DATABASE_URL.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string')
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long')
  }

  return {
    isValid: errors.length === 0,
    missing: errors,
    warnings: warnings,
  }
}

/**
 * Validates environment on startup
 * Logs warnings but only throws in production for missing required vars
 */
export function validateEnvStartup(): void {
  const result = validateEnv()
  
  if (!result.isValid) {
    const errorMessage = `Missing required environment variables:\n${result.missing.map(v => `  - ${v}`).join('\n')}`
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage)
    } else {
      console.error('⚠️  Environment Validation Error:')
      console.error(errorMessage)
      console.error('\nContinuing in development mode, but some features may not work.')
    }
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set:')
    result.warnings.forEach(v => console.warn(`  - ${v}`))
  }
}

/**
 * Type-safe environment variable access
 */
export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  
  // APIs
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  GOOGLE_SPEECH_API_KEY: process.env.GOOGLE_SPEECH_API_KEY,
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  
  // Logging
  REMOTE_LOGGING_ENDPOINT: process.env.REMOTE_LOGGING_ENDPOINT,
  REMOTE_LOGGING_TOKEN: process.env.REMOTE_LOGGING_TOKEN,
  
  // Cache
  REDIS_URL: process.env.REDIS_URL,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  
  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
}

// Validate on module load
if (typeof window === 'undefined') {
  // Skip validation in CI build environment
  const isCIBuild = process.env.CI === 'true' && process.env.NODE_ENV === 'production'
  if (!isCIBuild) {
    // Only validate on server-side and not during CI builds
    validateEnvStartup()
  }
}