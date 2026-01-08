/**
 * Unit Tests for Rate Limiter Service
 * Tests rate limiting logic
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getRateLimiterService } from '../rate-limiter.service';
import type { RateLimitConfig } from '../types';

describe('RateLimiterService', () => {
  let service: ReturnType<typeof getRateLimiterService>;
  const defaultConfig: RateLimitConfig = {
    endpoint: '/api/test',
    maxRequests: 5,
    windowMs: 60000, // 1 minute
  };

  beforeEach(() => {
    vi.useFakeTimers();
    service = getRateLimiterService();
    service.clearAll();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkLimit', () => {
    it('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(service.checkLimit('user1', defaultConfig)).toBe(true);
      }
    });

    it('should block requests over limit', () => {
      for (let i = 0; i < 5; i++) {
        service.checkLimit('user1', defaultConfig);
      }

      expect(service.checkLimit('user1', defaultConfig)).toBe(false);
    });

    it('should track different users separately', () => {
      for (let i = 0; i < 5; i++) {
        service.checkLimit('user1', defaultConfig);
      }

      // user1 is rate limited
      expect(service.checkLimit('user1', defaultConfig)).toBe(false);
      // user2 should not be rate limited
      expect(service.checkLimit('user2', defaultConfig)).toBe(true);
    });

    it('should track different endpoints separately', () => {
      const config1: RateLimitConfig = { endpoint: '/api/endpoint1', maxRequests: 2, windowMs: 60000 };
      const config2: RateLimitConfig = { endpoint: '/api/endpoint2', maxRequests: 2, windowMs: 60000 };

      service.checkLimit('user1', config1);
      service.checkLimit('user1', config1);
      expect(service.checkLimit('user1', config1)).toBe(false);

      // Same user, different endpoint should work
      expect(service.checkLimit('user1', config2)).toBe(true);
    });

    it('should reset after window expires', () => {
      for (let i = 0; i < 5; i++) {
        service.checkLimit('user1', defaultConfig);
      }

      expect(service.checkLimit('user1', defaultConfig)).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(60001);

      expect(service.checkLimit('user1', defaultConfig)).toBe(true);
    });

    it('should start new window after expiry', () => {
      service.checkLimit('user1', defaultConfig);

      // Advance time past the window
      vi.advanceTimersByTime(60001);

      // First request in new window
      service.checkLimit('user1', defaultConfig);

      // Should allow 4 more requests (5 total in new window)
      for (let i = 0; i < 4; i++) {
        expect(service.checkLimit('user1', defaultConfig)).toBe(true);
      }

      expect(service.checkLimit('user1', defaultConfig)).toBe(false);
    });
  });

  describe('getRemaining', () => {
    it('should return max requests initially', () => {
      expect(service.getRemaining('user1', defaultConfig)).toBe(5);
    });

    it('should decrease with each request', () => {
      service.checkLimit('user1', defaultConfig);
      expect(service.getRemaining('user1', defaultConfig)).toBe(4);

      service.checkLimit('user1', defaultConfig);
      expect(service.getRemaining('user1', defaultConfig)).toBe(3);
    });

    it('should return 0 when exhausted', () => {
      for (let i = 0; i < 10; i++) {
        service.checkLimit('user1', defaultConfig);
      }

      expect(service.getRemaining('user1', defaultConfig)).toBe(0);
    });

    it('should reset after window expires', () => {
      for (let i = 0; i < 5; i++) {
        service.checkLimit('user1', defaultConfig);
      }

      expect(service.getRemaining('user1', defaultConfig)).toBe(0);

      vi.advanceTimersByTime(60001);

      expect(service.getRemaining('user1', defaultConfig)).toBe(5);
    });
  });

  describe('getResetTime', () => {
    it('should return 0 initially', () => {
      expect(service.getResetTime('user1', defaultConfig)).toBe(0);
    });

    it('should return time until reset after first request', () => {
      service.checkLimit('user1', defaultConfig);

      const resetTime = service.getResetTime('user1', defaultConfig);
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60000);
    });

    it('should decrease as time passes', () => {
      service.checkLimit('user1', defaultConfig);

      const initialResetTime = service.getResetTime('user1', defaultConfig);

      vi.advanceTimersByTime(10000);

      const laterResetTime = service.getResetTime('user1', defaultConfig);
      expect(laterResetTime).toBeLessThan(initialResetTime);
    });

    it('should return 0 after window expires', () => {
      service.checkLimit('user1', defaultConfig);

      vi.advanceTimersByTime(60001);

      expect(service.getResetTime('user1', defaultConfig)).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset specific identifier/endpoint', () => {
      for (let i = 0; i < 5; i++) {
        service.checkLimit('user1', defaultConfig);
      }

      expect(service.checkLimit('user1', defaultConfig)).toBe(false);

      service.reset('user1', '/api/test');

      expect(service.checkLimit('user1', defaultConfig)).toBe(true);
    });

    it('should not affect other identifiers', () => {
      for (let i = 0; i < 5; i++) {
        service.checkLimit('user1', defaultConfig);
        service.checkLimit('user2', defaultConfig);
      }

      service.reset('user1', '/api/test');

      expect(service.checkLimit('user1', defaultConfig)).toBe(true);
      expect(service.checkLimit('user2', defaultConfig)).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all rate limit entries', () => {
      for (let i = 0; i < 5; i++) {
        service.checkLimit('user1', defaultConfig);
        service.checkLimit('user2', defaultConfig);
      }

      service.clearAll();

      expect(service.checkLimit('user1', defaultConfig)).toBe(true);
      expect(service.checkLimit('user2', defaultConfig)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      service.checkLimit('user1', defaultConfig);

      vi.advanceTimersByTime(60001);

      service.cleanup();

      // After cleanup, should be fresh start
      expect(service.getRemaining('user1', defaultConfig)).toBe(5);
    });

    it('should not remove non-expired entries', () => {
      service.checkLimit('user1', defaultConfig);
      service.checkLimit('user1', defaultConfig);

      vi.advanceTimersByTime(30000);

      service.cleanup();

      expect(service.getRemaining('user1', defaultConfig)).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle very short window', () => {
      const shortConfig: RateLimitConfig = {
        endpoint: '/api/short',
        maxRequests: 3,
        windowMs: 100, // 100ms
      };

      service.checkLimit('user1', shortConfig);
      service.checkLimit('user1', shortConfig);
      service.checkLimit('user1', shortConfig);
      expect(service.checkLimit('user1', shortConfig)).toBe(false);

      vi.advanceTimersByTime(101);

      expect(service.checkLimit('user1', shortConfig)).toBe(true);
    });

    it('should handle single request limit', () => {
      const strictConfig: RateLimitConfig = {
        endpoint: '/api/strict',
        maxRequests: 1,
        windowMs: 60000,
      };

      expect(service.checkLimit('user1', strictConfig)).toBe(true);
      expect(service.checkLimit('user1', strictConfig)).toBe(false);
    });

    it('should handle special characters in identifier', () => {
      const specialId = 'user@example.com:session:abc123';
      expect(service.checkLimit(specialId, defaultConfig)).toBe(true);
      expect(service.getRemaining(specialId, defaultConfig)).toBe(4);
    });
  });
});
