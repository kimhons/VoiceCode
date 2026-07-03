// VoiceCode Mobile - Performance Monitoring
// Track and optimize app performance

import { startTrace } from '../config/firebase';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric>;
  private traces: Map<string, any>;

  constructor() {
    this.metrics = new Map();
    this.traces = new Map();
  }

  /**
   * Start measuring performance
   */
  async start(name: string): Promise<void> {
    this.metrics.set(name, {
      name,
      startTime: Date.now(),
    });

    // Start Firebase trace
    try {
      const trace = await startTrace(name);
      this.traces.set(name, trace);
    } catch (error) {
      console.warn('Failed to start Firebase trace:', error);
    }
  }

  /**
   * Stop measuring performance
   */
  async stop(name: string): Promise<number | undefined> {
    const metric = this.metrics.get(name);
    if (!metric) return undefined;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Stop Firebase trace
    const trace = this.traces.get(name);
    if (trace) {
      try {
        await trace.stop();
        this.traces.delete(name);
      } catch (error) {
        console.warn('Failed to stop Firebase trace:', error);
      }
    }

    return duration;
  }

  /**
   * Get metric
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics.clear();
    this.traces.clear();
  }

  /**
   * Log slow operations
   */
  logSlowOperation(name: string, threshold: number = 1000): void {
    const metric = this.metrics.get(name);
    if (metric && metric.duration && metric.duration > threshold) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration}ms`);
    }
  }
}

/**
 * Global performance monitor
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure async function performance
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  await performanceMonitor.start(name);
  try {
    const result = await fn();
    return result;
  } finally {
    const duration = await performanceMonitor.stop(name);
    if (duration && duration > 1000) {
      console.warn(`${name} took ${duration}ms`);
    }
  }
}

/**
 * Performance decorator
 */
export function measure(threshold: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const name = `${target.constructor.name}.${propertyKey}`;
      await performanceMonitor.start(name);
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        const duration = await performanceMonitor.stop(name);
        if (duration && duration > threshold) {
          console.warn(`${name} took ${duration}ms (threshold: ${threshold}ms)`);
        }
      }
    };

    return descriptor;
  };
}
