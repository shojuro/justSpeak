import { useState } from 'react'

export interface ValidationRule {
  test: (value: any, allValues?: any) => boolean
  message: string
}

export interface ValidationSchema {
  [field: string]: ValidationRule[]
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Common validation rules
export const validators = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => value !== undefined && value !== null && value !== '',
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      return value.length >= min
    },
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      return value.length <= max
    },
    message: message || `Must be no more than ${max} characters`,
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      return regex.test(value)
    },
    message,
  }),

  number: (message = 'Must be a number'): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      return !isNaN(parseFloat(value)) && isFinite(value)
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      const num = parseFloat(value)
      return !isNaN(num) && num >= min
    },
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      const num = parseFloat(value)
      return !isNaN(num) && num <= max
    },
    message: message || `Must be no more than ${max}`,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    test: (value) => {
      if (!value) return true // Let required handle empty values
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message,
  }),

  custom: (test: (value: any, allValues?: any) => boolean, message: string): ValidationRule => ({
    test,
    message,
  }),
}

// Validate a single field
export function validateField(value: any, rules: ValidationRule[], allValues?: Record<string, any>): string | null {
  for (const rule of rules) {
    if (!rule.test(value, allValues)) {
      return rule.message
    }
  }
  return null
}

// Validate entire form
export function validateForm(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
  const errors: ValidationError[] = []

  for (const [field, rules] of Object.entries(schema)) {
    const error = validateField(data[field], rules, data)
    if (error) {
      errors.push({ field, message: error })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// React hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  schema: ValidationSchema
) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name: string, value: any) => {
    const rules = schema[name]
    if (!rules) return null

    for (const rule of rules) {
      if (!rule.test(value, values)) {
        return rule.message
      }
    }
    return null
  }

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateField(name, values[name])
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const validate = () => {
    const result = validateForm(values, schema)
    const errorMap: Record<string, string> = {}
    
    result.errors.forEach(error => {
      errorMap[error.field] = error.message
    })
    
    setErrors(errorMap)
    setTouched(Object.keys(schema).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    
    return result.isValid
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    validate,
    reset,
    setIsSubmitting,
  }
}

// Accessibility helper for form errors
export function getFieldProps(name: string, error?: string, touched?: boolean) {
  const hasError = touched && error
  
  return {
    'aria-invalid': hasError ? true : undefined,
    'aria-describedby': hasError ? `${name}-error` : undefined,
  }
}

// Helper to format error messages for screen readers
export function formatErrorMessage(field: string, error: string): string {
  return `Error in ${field}: ${error}`
}