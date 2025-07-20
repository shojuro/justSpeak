import { logger } from './logger'
import { sleep } from './utils'

export interface RetryOptions {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  factor: number
  jitter: boolean
  retryCondition?: (error: any) => boolean
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  factor: 2,
  jitter: true,
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true
    }
    
    if (error.response?.status >= 500) {
      return true
    }
    
    // Don't retry on client errors (4xx)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false
    }
    
    return true
  },
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: any
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      logger.debug(`Retry attempt ${attempt}/${opts.maxAttempts}`)
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      if (!opts.retryCondition || !opts.retryCondition(error)) {
        logger.warn('Retry condition not met, failing immediately', { error })
        throw error
      }
      
      // Check if we've exhausted attempts
      if (attempt === opts.maxAttempts) {
        logger.error(`All retry attempts failed after ${attempt} attempts`, { error })
        throw error
      }
      
      // Calculate delay with exponential backoff
      let delay = Math.min(
        opts.initialDelay * Math.pow(opts.factor, attempt - 1),
        opts.maxDelay
      )
      
      // Add jitter if enabled
      if (opts.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5)
      }
      
      logger.warn(`Retry attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`, {
        error: error instanceof Error ? error.message : error,
        nextDelay: delay,
      })
      
      await sleep(delay)
    }
  }
  
  throw lastError
}

// Decorator for class methods
export function Retryable(options: Partial<RetryOptions> = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      return retry(() => originalMethod.apply(this, args), options)
    }
    
    return descriptor
  }
}

// Specific retry strategies
export const retryStrategies = {
  // For API calls
  api: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    jitter: true,
  },
  
  // For database operations
  database: {
    maxAttempts: 5,
    initialDelay: 100,
    maxDelay: 5000,
    factor: 2,
    jitter: false,
    retryCondition: (error: any) => {
      // Retry on connection errors or deadlocks
      const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', '40P01']
      return retryableCodes.some(code => error.code === code)
    },
  },
  
  // For external services (like OpenAI)
  externalService: {
    maxAttempts: 4,
    initialDelay: 2000,
    maxDelay: 30000,
    factor: 2.5,
    jitter: true,
    retryCondition: (error: any) => {
      // Don't retry on rate limits
      if (error.response?.status === 429) {
        return false
      }
      
      // Retry on server errors or network issues
      return error.response?.status >= 500 || !error.response
    },
  },
}

// Retry with circuit breaker integration
export async function retryWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  circuitBreaker: { execute: (op: () => Promise<T>) => Promise<T> },
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  return retry(
    () => circuitBreaker.execute(operation),
    retryOptions
  )
}