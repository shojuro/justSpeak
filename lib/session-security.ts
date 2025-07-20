import crypto from 'crypto'
import { logger } from './logger'

// Session token configuration
const SESSION_TOKEN_LENGTH = 32 // 256 bits
const SESSION_SALT_LENGTH = 16 // 128 bits
const SESSION_ITERATIONS = 100000
const SESSION_ALGORITHM = 'sha256'

/**
 * Generate a cryptographically secure session token
 */
export function generateSecureSessionToken(): string {
  return crypto.randomBytes(SESSION_TOKEN_LENGTH).toString('hex')
}

/**
 * Generate a session ID with embedded security features
 */
export function generateSecureSessionId(): {
  sessionId: string
  token: string
  fingerprint: string
} {
  // Generate components
  const timestamp = Date.now()
  const random = crypto.randomBytes(16).toString('hex')
  const token = generateSecureSessionToken()
  
  // Create session ID (not secret, can be exposed)
  const sessionId = `${timestamp}-${random}`
  
  // Create fingerprint (hash of session ID + token)
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${sessionId}:${token}`)
    .digest('hex')
    .substring(0, 16) // Use first 16 chars for brevity
  
  return { sessionId, token, fingerprint }
}

/**
 * Validate session ownership
 */
export function validateSessionOwnership(
  sessionId: string,
  providedToken: string,
  storedToken: string
): boolean {
  if (!sessionId || !providedToken || !storedToken) {
    return false
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedToken),
      Buffer.from(storedToken)
    )
  } catch (error) {
    // Buffers must be same length for timingSafeEqual
    return false
  }
}

/**
 * Hash session token for storage
 */
export function hashSessionToken(token: string, salt?: string): {
  hash: string
  salt: string
} {
  const tokenSalt = salt || crypto.randomBytes(SESSION_SALT_LENGTH).toString('hex')
  
  const hash = crypto
    .pbkdf2Sync(token, tokenSalt, SESSION_ITERATIONS, 64, SESSION_ALGORITHM)
    .toString('hex')
  
  return { hash, salt: tokenSalt }
}

/**
 * Verify session token against hash
 */
export function verifySessionToken(
  token: string,
  hash: string,
  salt: string
): boolean {
  if (!token || !hash || !salt) {
    return false
  }
  
  try {
    const tokenHash = crypto
      .pbkdf2Sync(token, salt, SESSION_ITERATIONS, 64, SESSION_ALGORITHM)
      .toString('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(tokenHash)
    )
  } catch (error) {
    logger.error('Session token verification error', error as Error)
    return false
  }
}

/**
 * Generate session metadata
 */
export function generateSessionMetadata(
  userAgent?: string,
  ipAddress?: string
): {
  createdAt: number
  expiresAt: number
  metadata: {
    userAgent?: string
    ipFingerprint?: string
  }
} {
  const now = Date.now()
  const expiresIn = 24 * 60 * 60 * 1000 // 24 hours
  
  // Create IP fingerprint (hashed for privacy)
  const ipFingerprint = ipAddress
    ? crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16)
    : undefined
  
  return {
    createdAt: now,
    expiresAt: now + expiresIn,
    metadata: {
      userAgent: userAgent?.substring(0, 200), // Limit length
      ipFingerprint
    }
  }
}

/**
 * Validate session expiration
 */
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(
  sessionToken: string,
  csrfToken: string,
  expectedCSRF: string
): boolean {
  if (!sessionToken || !csrfToken || !expectedCSRF) {
    return false
  }
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(csrfToken),
      Buffer.from(expectedCSRF)
    )
  } catch {
    return false
  }
}