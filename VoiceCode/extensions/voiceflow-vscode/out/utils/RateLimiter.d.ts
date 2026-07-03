/**
 * Rate Limiter Utility
 * Implements token bucket algorithm for rate limiting API requests
 */
export interface RateLimiterConfig {
    maxRequests: number;
    windowMs: number;
    maxConcurrent?: number;
}
export declare class RateLimiter {
    private tokens;
    private lastRefill;
    private readonly maxTokens;
    private readonly refillRate;
    private activeRequests;
    private readonly maxConcurrent;
    private queue;
    constructor(config: RateLimiterConfig);
    /**
     * Refill tokens based on elapsed time
     */
    private refill;
    /**
     * Acquire a token (wait if necessary)
     */
    acquire(): Promise<void>;
    /**
     * Release a token (call after request completes)
     */
    release(): void;
    /**
     * Get current status
     */
    getStatus(): {
        availableTokens: number;
        activeRequests: number;
        queuedRequests: number;
    };
    /**
     * Reset the rate limiter
     */
    reset(): void;
}
/**
 * Simple LRU Cache for response caching
 */
export declare class LRUCache<K, V> {
    private cache;
    private readonly maxSize;
    private readonly ttlMs;
    constructor(maxSize?: number, ttlMs?: number);
    /**
     * Get value from cache
     */
    get(key: K): V | undefined;
    /**
     * Set value in cache
     */
    set(key: K, value: V): void;
    /**
     * Check if key exists and is not expired
     */
    has(key: K): boolean;
    /**
     * Clear the cache
     */
    clear(): void;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        ttlMs: number;
    };
}
//# sourceMappingURL=RateLimiter.d.ts.map