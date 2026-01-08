/**
 * Rate Limiter Service
 * Client-side rate limiting for API calls
 */

import type { RateLimitConfig } from './types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiterService {
  private store = new Map<string, RateLimitEntry>();

  /**
   * Check if a request is within rate limits
   * @returns true if allowed, false if rate limited
   */
  checkLimit(identifier: string, config: RateLimitConfig): boolean {
    const key = `${config.endpoint}:${identifier}`;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    if (entry.count >= config.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, config: RateLimitConfig): number {
    const key = `${config.endpoint}:${identifier}`;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(identifier: string, config: RateLimitConfig): number {
    const key = `${config.endpoint}:${identifier}`;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      return 0;
    }

    return entry.resetAt - now;
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string, endpoint: string): void {
    const key = `${endpoint}:${identifier}`;
    this.store.delete(key);
  }

  /**
   * Clear all rate limit entries
   */
  clearAll(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

let rateLimiterInstance: RateLimiterService | null = null;

export function getRateLimiterService(): RateLimiterService {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiterService();
  }
  return rateLimiterInstance;
}

export default RateLimiterService;
