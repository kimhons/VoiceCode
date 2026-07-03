/**
 * Performance Utilities
 * Provides performance optimization helpers for the mobile app
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debounce Hook
 * Delays function execution until after wait milliseconds have elapsed
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle Hook
 * Limits function execution to once per wait milliseconds
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current)
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Debounce Function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle Function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoization Cache
 */
export class MemoCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private readonly maxAge: number;
  private readonly maxSize: number;

  constructor(maxAge: number = 5 * 60 * 1000, maxSize: number = 100) {
    this.maxAge = maxAge;
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

/**
 * Persistent Cache with AsyncStorage
 */
export class PersistentCache {
  private readonly prefix: string;
  private readonly maxAge: number;

  constructor(prefix: string = 'cache_', maxAge: number = 24 * 60 * 60 * 1000) {
    this.prefix = prefix;
    this.maxAge = maxAge;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(this.getKey(key));
      if (!data) return null;

      const { value, timestamp } = JSON.parse(data);
      if (Date.now() - timestamp > this.maxAge) {
        await this.delete(key);
        return null;
      }

      return value as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const data = JSON.stringify({ value, timestamp: Date.now() });
      await AsyncStorage.setItem(this.getKey(key), data);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

/**
 * Lazy Loading Hook
 */
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  dependencies: unknown[] = []
): { data: T | null; loading: boolean; error: Error | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

/**
 * Pagination Hook
 */
export function usePagination<T>(
  fetcher: (page: number, limit: number) => Promise<T[]>,
  limit: number = 20
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetcher(page, limit);
      setItems(prev => [...prev, ...newItems]);
      setHasMore(newItems.length === limit);
      setPage(prev => prev + 1);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, limit, loading, hasMore]);

  const refresh = useCallback(async () => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);

    try {
      const newItems = await fetcher(1, limit);
      setItems(newItems);
      setHasMore(newItems.length === limit);
      setPage(2);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, limit]);

  return { items, loading, hasMore, error, loadMore, refresh };
}

/**
 * Image Preloading
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const { Image } = await import('react-native');
  await Promise.all(urls.map(url => Image.prefetch(url)));
}

/**
 * Performance Measurement
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  return result;
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  return result;
}

/**
 * Memory-efficient list virtualization helper
 */
export function getVisibleRange(
  scrollOffset: number,
  viewportHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
  const end = Math.min(
    totalItems - 1,
    Math.ceil((scrollOffset + viewportHeight) / itemHeight) + overscan
  );
  return { start, end };
}

/**
 * Batch processing for large datasets
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
}
