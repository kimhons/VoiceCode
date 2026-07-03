"use strict";
/**
 * Rate Limiter Utility
 * Implements token bucket algorithm for rate limiting API requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = exports.RateLimiter = void 0;
class RateLimiter {
    tokens;
    lastRefill;
    maxTokens;
    refillRate;
    activeRequests = 0;
    maxConcurrent;
    queue = [];
    constructor(config) {
        this.maxTokens = config.maxRequests;
        this.tokens = config.maxRequests;
        this.refillRate = config.maxRequests / config.windowMs;
        this.lastRefill = Date.now();
        this.maxConcurrent = config.maxConcurrent || Infinity;
    }
    /**
     * Refill tokens based on elapsed time
     */
    refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = elapsed * this.refillRate;
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
    /**
     * Acquire a token (wait if necessary)
     */
    async acquire() {
        return new Promise((resolve) => {
            const tryAcquire = () => {
                this.refill();
                // Check if we have tokens and are under concurrent limit
                if (this.tokens >= 1 && this.activeRequests < this.maxConcurrent) {
                    this.tokens -= 1;
                    this.activeRequests += 1;
                    resolve();
                }
                else {
                    // Queue the request
                    this.queue.push(tryAcquire);
                    // Retry after a short delay
                    setTimeout(() => {
                        const index = this.queue.indexOf(tryAcquire);
                        if (index > -1) {
                            this.queue.splice(index, 1);
                            tryAcquire();
                        }
                    }, 100);
                }
            };
            tryAcquire();
        });
    }
    /**
     * Release a token (call after request completes)
     */
    release() {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        // Process queued requests
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) {
                next();
            }
        }
    }
    /**
     * Get current status
     */
    getStatus() {
        this.refill();
        return {
            availableTokens: Math.floor(this.tokens),
            activeRequests: this.activeRequests,
            queuedRequests: this.queue.length,
        };
    }
    /**
     * Reset the rate limiter
     */
    reset() {
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
        this.activeRequests = 0;
        this.queue = [];
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Simple LRU Cache for response caching
 */
class LRUCache {
    cache;
    maxSize;
    ttlMs;
    constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }
    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return undefined;
        }
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }
    /**
     * Set value in cache
     */
    set(key, value) {
        // Remove if exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        // Add new entry
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== undefined;
    }
    /**
     * Clear the cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttlMs: this.ttlMs,
        };
    }
}
exports.LRUCache = LRUCache;
//# sourceMappingURL=RateLimiter.js.map