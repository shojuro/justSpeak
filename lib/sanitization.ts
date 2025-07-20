import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Configure DOMPurify for text-only content (no HTML)
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  })
  
  // Additional sanitization for common attack patterns
  return clean
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script/gi, '') // Remove script tags
    .replace(/\\x[0-9a-fA-F]{2}/g, '') // Remove hex escapes
    .replace(/\\u[0-9a-fA-F]{4}/g, '') // Remove unicode escapes
    .trim()
}

/**
 * Sanitize HTML content (for display purposes only)
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }
  
  // Configure DOMPurify for safe HTML
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'], // Force target="_blank" rel="noopener" on links
    FORCE_BODY: true,
    SAFE_FOR_TEMPLATES: true,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

/**
 * Validate and sanitize message length
 */
export function validateMessageLength(message: string, maxLength: number = 5000): {
  isValid: boolean
  sanitized: string
  error?: string
} {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Message is required'
    }
  }
  
  const sanitized = sanitizeInput(message)
  
  if (sanitized.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Message cannot be empty'
    }
  }
  
  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      sanitized: sanitized.substring(0, maxLength),
      error: `Message is too long (max ${maxLength} characters)`
    }
  }
  
  return {
    isValid: true,
    sanitized
  }
}

/**
 * Sanitize session ID to prevent injection
 */
export function sanitizeSessionId(sessionId: string): string {
  if (!sessionId || typeof sessionId !== 'string') {
    return ''
  }
  
  // Only allow alphanumeric, hyphens, and underscores
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 128)
}

/**
 * Sanitize API response before sending to client
 */
export function sanitizeApiResponse(response: any): any {
  if (typeof response === 'string') {
    return sanitizeInput(response)
  }
  
  if (typeof response === 'object' && response !== null) {
    const sanitized: any = Array.isArray(response) ? [] : {}
    
    for (const key in response) {
      if (response.hasOwnProperty(key)) {
        // Skip sensitive keys
        if (['password', 'token', 'secret', 'api_key', 'apiKey'].includes(key)) {
          continue
        }
        
        sanitized[key] = sanitizeApiResponse(response[key])
      }
    }
    
    return sanitized
  }
  
  return response
}