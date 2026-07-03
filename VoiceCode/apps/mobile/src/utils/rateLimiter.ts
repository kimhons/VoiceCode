// VoiceCode Mobile - Rate Limiter
// Client-side rate limiting for API requests

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate Limiter using token bucket algorithm
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.limits = new Map();
    this.configs = new Map();
  }

  /**
   * Configure rate limit for a key
   */
  configure(key: string, maxRequests: number, windowMs: number): void {
    this.configs.set(key, { maxRequests, windowMs });
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<boolean> {
    const config = this.configs.get(key);
    if (!config) {
      // No limit configured, allow
      return true;
    }

    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const config = this.configs.get(key);
    if (!config) return Infinity;

    const entry = this.limits.get(key);
    if (!entry) return config.maxRequests;

    const now = Date.now();
    if (now >= entry.resetTime) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until reset
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Reset limit for key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all limits
   */
  clearAll(): void {
    this.limits.clear();
  }
}

/**
 * Global rate limiter instance
 */
export const globalRateLimiter = new RateLimiter();

// Configure default limits
globalRateLimiter.configure('api', 60, 60 * 1000); // 60 requests per minute
globalRateLimiter.configure('auth', 5, 60 * 1000); // 5 auth attempts per minute
globalRateLimiter.configure('upload', 10, 60 * 1000); // 10 uploads per minute
