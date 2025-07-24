import { logger } from './logger'

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
  halfOpenRequests: number
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failures: number = 0
  private successes: number = 0
  private lastFailureTime?: Date
  // halfOpenRequests not currently used
  private readonly options: CircuitBreakerOptions

  constructor(
    private readonly name: string,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod ?? 10000, // 10 seconds
      halfOpenRequests: options.halfOpenRequests ?? 3,
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen()
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++
      
      if (this.successes >= this.options.halfOpenRequests) {
        this.transitionToClosed()
      }
    }
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = new Date()
    
    logger.warn(`Circuit breaker ${this.name} recorded failure`, {
      failures: this.failures,
      threshold: this.options.failureThreshold,
      state: this.state,
    })

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen()
    } else if (this.failures >= this.options.failureThreshold) {
      this.transitionToOpen()
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime()
    return timeSinceLastFailure >= this.options.resetTimeout
  }

  private transitionToOpen(): void {
    this.state = CircuitState.OPEN
    // Reset half open requests
    
    logger.error(`Circuit breaker ${this.name} is now OPEN`, {
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    })
  }

  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN
    this.successes = 0
    // Reset half open requests
    
    logger.info(`Circuit breaker ${this.name} is now HALF_OPEN`)
  }

  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED
    this.failures = 0
    this.successes = 0
    
    logger.info(`Circuit breaker ${this.name} is now CLOSED`)
  }

  getState(): CircuitState {
    return this.state
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

// Factory for creating circuit breakers
export class CircuitBreakerFactory {
  private static breakers = new Map<string, CircuitBreaker>()

  static create(
    name: string,
    options?: Partial<CircuitBreakerOptions>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options))
    }
    
    return this.breakers.get(name)!
  }

  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name)
  }

  static getAllStats() {
    const stats: Record<string, any> = {}
    
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats()
    })
    
    return stats
  }
}