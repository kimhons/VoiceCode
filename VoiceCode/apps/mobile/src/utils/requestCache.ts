// VoiceCode Mobile - Request Cache
// LRU cache with TTL for API responses

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Request Cache with LRU eviction and TTL
 */
export class RequestCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private storageKey: string;

  constructor(maxSize: number = 100, storageKey: string = 'request_cache') {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);
    await this.saveToStorage();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveToStorage();
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
    await AsyncStorage.removeItem(this.storageKey);
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  async cleanExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveToStorage();
    }

    return cleaned;
  }

  /**
   * Save cache to AsyncStorage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const data = Array.from(this.cache.entries());
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        const entries = JSON.parse(data);
        this.cache = new Map(entries);
        await this.cleanExpired();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
  } {
    let oldestTimestamp = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
      oldestEntry: Date.now() - oldestTimestamp,
    };
  }
}

/**
 * Global cache instance
 */
export const globalCache = new RequestCache();

/**
 * Cache decorator for functions
 */
export function cached<T>(
  keyFn: (...args: any[]) => string,
  ttl: number = 5 * 60 * 1000
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyFn(...args);
      
      // Check cache
      const cached = await globalCache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Execute and cache
      const result = await originalMethod.apply(this, args);
      await globalCache.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}
