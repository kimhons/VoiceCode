/**
 * Service Loader Utility
 * Provides lazy loading pattern for extension services
 * Inspired by web app's createLazyComponent pattern
 */

type ServiceFactory<T> = () => Promise<T>;
type ServiceInstance<T> = T | null;

/**
 * Service cache to ensure singleton pattern
 */
class ServiceCache {
  private static instances = new Map<string, any>();
  private static loading = new Map<string, Promise<any>>();

  /**
   * Get or create a service instance
   * @param key Unique service identifier
   * @param factory Factory function to create the service
   * @returns Service instance (cached or newly created)
   */
  static async getOrCreate<T>(
    key: string,
    factory: ServiceFactory<T>
  ): Promise<T> {
    // Return cached instance if available
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    // If already loading, wait for that promise
    if (this.loading.has(key)) {
      return this.loading.get(key)!;
    }

    // Start loading
    const loadPromise = factory();
    this.loading.set(key, loadPromise);

    try {
      const instance = await loadPromise;
      this.instances.set(key, instance);
      this.loading.delete(key);
      return instance;
    } catch (error) {
      this.loading.delete(key);
      throw error;
    }
  }

  /**
   * Check if a service is already loaded
   */
  static isLoaded(key: string): boolean {
    return this.instances.has(key);
  }

  /**
   * Clear all cached services (useful for testing)
   */
  static clearAll(): void {
    this.instances.clear();
    this.loading.clear();
  }

  /**
   * Remove a specific service from cache
   */
  static remove(key: string): void {
    this.instances.delete(key);
    this.loading.delete(key);
  }
}

/**
 * Lazy load a service with automatic caching
 * @param serviceName Name of the service (for caching key)
 * @param importFn Dynamic import function
 * @returns Service loader function
 */
export function createLazyService<T>(
  serviceName: string,
  importFn: () => Promise<{ [key: string]: new (...args: any[]) => T }>,
  constructorArgs: any[] = []
): () => Promise<T> {
  return async () => {
    return ServiceCache.getOrCreate(serviceName, async () => {
      const module = await importFn();

      // Find the constructor (could be default export or named export)
      const Constructor = module.default || module[serviceName];

      if (!Constructor) {
        throw new Error(
          `Service ${serviceName} not found in module. Available exports: ${Object.keys(module).join(', ')}`
        );
      }

      return new Constructor(...constructorArgs);
    });
  };
}

/**
 * Service tier enum
 */
export enum ServiceTier {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

/**
 * Service metadata for tracking and optimization
 */
interface ServiceMetadata {
  name: string;
  tier: ServiceTier;
  loadTime?: number;
  loadedAt?: number;
  essential: boolean;
}

/**
 * Enhanced service loader with telemetry and tier-based loading
 */
export class EnhancedServiceLoader {
  private metadata = new Map<string, ServiceMetadata>();
  private telemetry?: any; // TelemetryService instance (lazy loaded to avoid circular dependency)

  /**
   * Set telemetry service for performance tracking
   */
  setTelemetry(telemetry: any): void {
    this.telemetry = telemetry;
  }

  /**
   * Load a service with performance tracking
   */
  async load<T>(
    serviceName: string,
    importFn: () => Promise<{ [key: string]: new (...args: any[]) => T }>,
    options: {
      tier?: ServiceTier;
      essential?: boolean;
      constructorArgs?: any[];
    } = {}
  ): Promise<T> {
    const {
      tier = ServiceTier.FREE,
      essential = false,
      constructorArgs = [],
    } = options;

    // Check if already cached
    const fromCache = ServiceCache.isLoaded(serviceName);

    // Store metadata
    this.metadata.set(serviceName, {
      name: serviceName,
      tier,
      essential,
    });

    const startTime = Date.now();

    try {
      const loader = createLazyService(serviceName, importFn, constructorArgs);
      const service = await loader();

      // Update metadata with timing
      const loadTime = Date.now() - startTime;
      this.metadata.set(serviceName, {
        ...this.metadata.get(serviceName)!,
        loadTime,
        loadedAt: Date.now(),
      });

      console.log(
        `[ServiceLoader] Loaded ${serviceName} (${tier}) in ${loadTime}ms${fromCache ? ' [cached]' : ''}`
      );

      // Record performance metric if telemetry is available
      if (this.telemetry && typeof this.telemetry.recordServiceLoad === 'function') {
        this.telemetry.recordServiceLoad(serviceName, loadTime, fromCache);
      }

      return service;
    } catch (error) {
      console.error(`[ServiceLoader] Failed to load ${serviceName}:`, error);

      // Record error if telemetry is available
      if (this.telemetry && typeof this.telemetry.recordError === 'function') {
        this.telemetry.recordError(error as Error, {
          context: 'service_load',
          serviceName,
          tier,
        });
      }

      throw error;
    }
  }

  /**
   * Load services by tier
   * @param tier Service tier to load
   */
  async loadByTier(tier: ServiceTier): Promise<void> {
    const servicesForTier = Array.from(this.metadata.entries())
      .filter(([_, meta]) => meta.tier === tier && !ServiceCache.isLoaded(meta.name));

    console.log(`[ServiceLoader] Loading ${servicesForTier.length} ${tier} services`);

    // Load in parallel
    await Promise.allSettled(
      servicesForTier.map(([name]) =>
        this.load(name, async () => {
          throw new Error('Service already registered, this should not happen');
        })
      )
    );
  }

  /**
   * Get loading statistics
   */
  getStats(): {
    total: number;
    loaded: number;
    byTier: Record<ServiceTier, number>;
    averageLoadTime: number;
  } {
    const allServices = Array.from(this.metadata.values());
    const loadedServices = allServices.filter(s => s.loadTime !== undefined);

    const byTier = {
      [ServiceTier.FREE]: allServices.filter(s => s.tier === ServiceTier.FREE).length,
      [ServiceTier.BASIC]: allServices.filter(s => s.tier === ServiceTier.BASIC).length,
      [ServiceTier.STANDARD]: allServices.filter(s => s.tier === ServiceTier.STANDARD).length,
      [ServiceTier.PRO]: allServices.filter(s => s.tier === ServiceTier.PRO).length,
      [ServiceTier.ENTERPRISE]: allServices.filter(s => s.tier === ServiceTier.ENTERPRISE).length,
    };

    const averageLoadTime = loadedServices.length > 0
      ? loadedServices.reduce((sum, s) => sum + (s.loadTime || 0), 0) / loadedServices.length
      : 0;

    return {
      total: allServices.length,
      loaded: loadedServices.length,
      byTier,
      averageLoadTime,
    };
  }

  /**
   * Check if user has access to a service tier
   */
  hasAccess(tier: ServiceTier, userTier: ServiceTier): boolean {
    const tierHierarchy = {
      [ServiceTier.FREE]: 0,
      [ServiceTier.BASIC]: 1,
      [ServiceTier.STANDARD]: 2,
      [ServiceTier.PRO]: 3,
      [ServiceTier.ENTERPRISE]: 4,
    };

    return tierHierarchy[userTier] >= tierHierarchy[tier];
  }
}

/**
 * Global service loader instance
 */
export const serviceLoader = new EnhancedServiceLoader();

/**
 * Preload essential services in the background
 * @param services Array of service loaders to preload
 */
export async function preloadServices(
  services: Array<() => Promise<any>>
): Promise<void> {
  // Non-blocking preload
  Promise.allSettled(services.map(loader => loader())).then(results => {
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(
      `[ServiceLoader] Preloaded ${successful} services, ${failed} failed`
    );
  });
}

/**
 * Export ServiceCache for testing
 */
export { ServiceCache };
