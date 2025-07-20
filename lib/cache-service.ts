import { RedisCache } from './redis'
import { logger } from './logger'
import { REDIS_CONFIG } from './constants'

export class CacheService {
  private cache: RedisCache
  private prefix: string

  constructor(prefix: string = REDIS_CONFIG.CACHE_PREFIX) {
    this.cache = new RedisCache()
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key)
    
    try {
      const cached = await this.cache.get<T>(fullKey)
      
      if (cached) {
        logger.debug(`Cache hit for key: ${fullKey}`)
      } else {
        logger.debug(`Cache miss for key: ${fullKey}`)
      }
      
      return cached
    } catch (error) {
      logger.error('Cache get error', error, { key: fullKey })
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const fullKey = this.getKey(key)
    const ttl = ttlSeconds || REDIS_CONFIG.DEFAULT_TTL
    
    try {
      await this.cache.set(fullKey, value, ttl)
      logger.debug(`Cache set for key: ${fullKey}`, { ttl })
    } catch (error) {
      logger.error('Cache set error', error, { key: fullKey })
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key)
    
    try {
      await this.cache.del(fullKey)
      logger.debug(`Cache deleted for key: ${fullKey}`)
    } catch (error) {
      logger.error('Cache delete error', error, { key: fullKey })
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // This would require Redis SCAN command implementation
    // For now, we'll log the intention
    logger.warn('Pattern invalidation not yet implemented', { pattern })
  }
}

// Specialized cache services
export const cacheServices = {
  user: new CacheService('user:'),
  session: new CacheService('session:'),
  assessment: new CacheService('assessment:'),
  stats: new CacheService('stats:'),
}

// Cache decorators
export function Cacheable(
  keyPrefix: string,
  ttlSeconds: number = REDIS_CONFIG.DEFAULT_TTL
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const cache = new CacheService(keyPrefix)
    
    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and arguments
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`
      
      // Try to get from cache
      const cached = await cache.get(cacheKey)
      if (cached !== null) {
        return cached
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args)
      
      // Cache the result
      await cache.set(cacheKey, result, ttlSeconds)
      
      return result
    }
    
    return descriptor
  }
}

// Cache invalidation helpers
export const cacheInvalidation = {
  async invalidateUser(userId: string): Promise<void> {
    await cacheServices.user.delete(userId)
    await cacheServices.stats.delete(userId)
  },

  async invalidateSession(sessionId: string): Promise<void> {
    await cacheServices.session.delete(sessionId)
    await cacheServices.assessment.delete(sessionId)
  },

  async invalidateUserSessions(userId: string): Promise<void> {
    // This would need to track user's sessions
    logger.info('Invalidating user sessions cache', { userId })
  },
}

// Cached database operations
export const cachedDb = {
  async getUserById(userId: string): Promise<any> {
    const cacheKey = userId
    
    // Try cache first
    const cached = await cacheServices.user.get(cacheKey)
    if (cached) return cached
    
    // Load from database
    const { supabaseDb } = await import('./supabase-db')
    const { data, error } = await supabaseDb
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    // Cache the result
    await cacheServices.user.set(cacheKey, data, 3600) // 1 hour
    
    return data
  },

  async getUserStats(userId: string): Promise<any> {
    const cacheKey = userId
    
    // Try cache first
    const cached = await cacheServices.stats.get(cacheKey)
    if (cached) return cached
    
    // Load from database
    const { supabaseDb } = await import('./supabase-db')
    const { data, error } = await supabaseDb
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    // Cache the result (shorter TTL for stats)
    if (data) {
      await cacheServices.stats.set(cacheKey, data, 300) // 5 minutes
    }
    
    return data
  },

  async getRecentSessions(userId: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `${userId}:recent:${limit}`
    
    // Try cache first
    const cached = await cacheServices.session.get<any[]>(cacheKey)
    if (cached) return cached
    
    // Load from database
    const { supabaseDb } = await import('./supabase-db')
    const { data, error } = await supabaseDb
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    // Cache the result
    await cacheServices.session.set(cacheKey, data || [], 600) // 10 minutes
    
    return data || []
  },
}