// Mock for Redis rate limiter
let mockCheckRateLimitResponse = { allowed: true, remaining: 10, resetTime: Date.now() + 60000 }

class RedisRateLimiter {
  checkRateLimit = jest.fn().mockImplementation(() => {
    return Promise.resolve(mockCheckRateLimitResponse)
  })
}

// Helper to set mock response
RedisRateLimiter.setMockResponse = (response) => {
  mockCheckRateLimitResponse = response
}

module.exports = {
  RedisRateLimiter
}