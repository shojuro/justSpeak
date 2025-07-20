import { AppError } from './error-handler'

// Validation error class
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
}

// Sanitization functions
export const sanitize = {
  // Remove HTML tags and scripts
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  },

  // Escape special characters for HTML display
  escape: (input: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    }
    return input.replace(/[&<>"'/]/g, (char) => map[char])
  },

  // Clean and trim whitespace
  trim: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ')
  },

  // Remove non-alphanumeric characters
  alphanumeric: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9]/g, '')
  },

  // Normalize email
  email: (input: string): string => {
    return input.toLowerCase().trim()
  },
}

// Validation rules
export const validators = {
  required: (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  },

  email: (value: string): boolean => {
    return patterns.email.test(value)
  },

  url: (value: string): boolean => {
    return patterns.url.test(value)
  },

  minLength: (min: number) => (value: string): boolean => {
    return value.length >= min
  },

  maxLength: (max: number) => (value: string): boolean => {
    return value.length <= max
  },

  min: (min: number) => (value: number): boolean => {
    return value >= min
  },

  max: (max: number) => (value: number): boolean => {
    return value <= max
  },

  pattern: (pattern: RegExp) => (value: string): boolean => {
    return pattern.test(value)
  },

  strongPassword: (value: string): boolean => {
    return patterns.strongPassword.test(value)
  },

  in: (allowedValues: any[]) => (value: any): boolean => {
    return allowedValues.includes(value)
  },
}

// Schema validation
export interface ValidationRule {
  validator: (value: any) => boolean
  message: string
}

export interface ValidationSchema {
  [field: string]: ValidationRule[]
}

export function validate(data: Record<string, any>, schema: ValidationSchema): void {
  const errors: Record<string, string[]> = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    const fieldErrors: string[] = []

    for (const rule of rules) {
      if (!rule.validator(value)) {
        fieldErrors.push(rule.message)
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }
}

// Specific validators for the application
export const messageValidation = {
  validateChatMessage: (message: string): string => {
    // Sanitize
    let cleaned = sanitize.html(message)
    cleaned = sanitize.trim(cleaned)

    // Validate
    if (!validators.required(cleaned)) {
      throw new ValidationError('Message cannot be empty')
    }

    if (!validators.maxLength(1000)(cleaned)) {
      throw new ValidationError('Message must be less than 1000 characters')
    }

    return cleaned
  },

  validateContext: (context: any[]): any[] => {
    if (!Array.isArray(context)) {
      throw new ValidationError('Context must be an array')
    }

    if (context.length > 10) {
      throw new ValidationError('Context cannot exceed 10 messages')
    }

    return context.map((msg) => ({
      role: sanitize.trim(msg.role),
      content: sanitize.html(sanitize.trim(msg.content)),
    }))
  },
}

export const userValidation = {
  validateEmail: (email: string): string => {
    const cleaned = sanitize.email(email)
    
    if (!validators.email(cleaned)) {
      throw new ValidationError('Invalid email format')
    }

    return cleaned
  },

  validatePassword: (password: string): void => {
    if (!validators.minLength(8)(password)) {
      throw new ValidationError('Password must be at least 8 characters long')
    }

    if (!validators.strongPassword(password)) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )
    }
  },

  validateAge: (ageGroup: string): string => {
    const validAgeGroups = ['elementary', 'middle', 'high', 'adult']
    
    if (!validators.in(validAgeGroups)(ageGroup)) {
      throw new ValidationError('Invalid age group')
    }

    return ageGroup
  },
}

// Safe JSON parsing
export function safeJsonParse<T = any>(json: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// Request body validation
export async function validateRequestBody<T>(
  request: Request,
  schema: ValidationSchema
): Promise<T> {
  let body: any

  try {
    body = await request.json()
  } catch {
    throw new ValidationError('Invalid JSON in request body')
  }

  validate(body, schema)
  return body as T
}