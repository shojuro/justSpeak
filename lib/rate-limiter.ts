export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      this.requests.set(identifier, validRequests);
      return { allowed: false, remaining: 0 };
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return { allowed: true, remaining: this.maxRequests - validRequests.length };
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export const defaultRateLimiter = new RateLimiter(60000, 10);

// Helper function for backwards compatibility
export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  return defaultRateLimiter.checkLimit(identifier);
}