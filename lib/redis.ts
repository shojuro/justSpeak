import Redis from 'ioredis'
import { logger } from './logger'

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
}

// Create Redis client with error handling
class RedisClient {
  private client: Redis | null = null
  private isConnected = false

  constructor() {
    if (process.env.REDIS_ENABLED === 'true') {
      this.initialize()
    }
  }

  private initialize() {
    try {
      this.client = new Redis(redisConfig)

      this.client.on('connect', () => {
        logger.info('Redis client connected')
        this.isConnected = true
      })

      this.client.on('error', (error) => {
        logger.error('Redis client error', error)
        this.isConnected = false
      })

      this.client.on('close', () => {
        logger.warn('Redis client connection closed')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...')
      })
    } catch (error) {
      logger.error('Failed to initialize Redis client', error)
    }
  }

  getClient(): Redis | null {
    return this.client
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
    }
  }
}

// Create singleton instance
export const redisClient = new RedisClient()

// Rate limiting with Redis
export class RedisRateLimiter {
  private redis: Redis | null
  private fallbackStore: Map<string, { count: number; resetTime: number }>

  constructor() {
    this.redis = redisClient.getClient()
    this.fallbackStore = new Map()
  }

  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const window = Math.floor(now / windowMs)
    const resetTime = (window + 1) * windowMs

    // Use Redis if available
    if (this.redis && redisClient.isAvailable()) {
      try {
        const redisKey = `ratelimit:${key}:${window}`
        const multi = this.redis.multi()
        
        multi.incr(redisKey)
        multi.expire(redisKey, Math.ceil(windowMs / 1000))
        
        const results = await multi.exec()
        const count = results?.[0]?.[1] as number

        return {
          allowed: count <= maxRequests,
          remaining: Math.max(0, maxRequests - count),
          resetTime,
        }
      } catch (error) {
        logger.error('Redis rate limit error, falling back to memory', error)
      }
    }

    // Fallback to in-memory store
    const storeKey = `${key}:${window}`
    const current = this.fallbackStore.get(storeKey) || { count: 0, resetTime }

    if (now > current.resetTime) {
      this.fallbackStore.delete(storeKey)
      current.count = 0
      current.resetTime = resetTime
    }

    current.count++
    this.fallbackStore.set(storeKey, current)

    // Clean up old entries
    Array.from(this.fallbackStore.entries()).forEach(([k, v]) => {
      if (now > v.resetTime + windowMs) {
        this.fallbackStore.delete(k)
      }
    })

    return {
      allowed: current.count <= maxRequests,
      remaining: Math.max(0, maxRequests - current.count),
      resetTime,
    }
  }
}

// Caching with Redis
export class RedisCache {
  private redis: Redis | null
  private fallbackCache: Map<string, { value: any; expiry: number }>

  constructor() {
    this.redis = redisClient.getClient()
    this.fallbackCache = new Map()
  }

  async get<T>(key: string): Promise<T | null> {
    // Use Redis if available
    if (this.redis && redisClient.isAvailable()) {
      try {
        const value = await this.redis.get(key)
        return value ? JSON.parse(value) : null
      } catch (error) {
        logger.error('Redis cache get error', error)
      }
    }

    // Fallback to memory cache
    const cached = this.fallbackCache.get(key)
    if (cached && cached.expiry > Date.now()) {
      return cached.value
    }
    
    this.fallbackCache.delete(key)
    return null
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value)

    // Use Redis if available
    if (this.redis && redisClient.isAvailable()) {
      try {
        await this.redis.setex(key, ttlSeconds, serialized)
        return
      } catch (error) {
        logger.error('Redis cache set error', error)
      }
    }

    // Fallback to memory cache
    this.fallbackCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    })

    // Clean up expired entries
    const now = Date.now()
    Array.from(this.fallbackCache.entries()).forEach(([k, v]) => {
      if (v.expiry < now) {
        this.fallbackCache.delete(k)
      }
    })
  }

  async del(key: string): Promise<void> {
    // Use Redis if available
    if (this.redis && redisClient.isAvailable()) {
      try {
        await this.redis.del(key)
      } catch (error) {
        logger.error('Redis cache delete error', error)
      }
    }

    // Also delete from memory cache
    this.fallbackCache.delete(key)
  }

  async flush(): Promise<void> {
    // Clear Redis if available
    if (this.redis && redisClient.isAvailable()) {
      try {
        await this.redis.flushdb()
      } catch (error) {
        logger.error('Redis cache flush error', error)
      }
    }

    // Clear memory cache
    this.fallbackCache.clear()
  }
}