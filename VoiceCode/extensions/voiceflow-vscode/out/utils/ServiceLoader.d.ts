/**
 * Service Loader Utility
 * Provides lazy loading pattern for extension services
 * Inspired by web app's createLazyComponent pattern
 */
type ServiceFactory<T> = () => Promise<T>;
/**
 * Service cache to ensure singleton pattern
 */
declare class ServiceCache {
    private static instances;
    private static loading;
    /**
     * Get or create a service instance
     * @param key Unique service identifier
     * @param factory Factory function to create the service
     * @returns Service instance (cached or newly created)
     */
    static getOrCreate<T>(key: string, factory: ServiceFactory<T>): Promise<T>;
    /**
     * Check if a service is already loaded
     */
    static isLoaded(key: string): boolean;
    /**
     * Clear all cached services (useful for testing)
     */
    static clearAll(): void;
    /**
     * Remove a specific service from cache
     */
    static remove(key: string): void;
}
/**
 * Lazy load a service with automatic caching
 * @param serviceName Name of the service (for caching key)
 * @param importFn Dynamic import function
 * @returns Service loader function
 */
export declare function createLazyService<T>(serviceName: string, importFn: () => Promise<{
    [key: string]: new (...args: any[]) => T;
}>, constructorArgs?: any[]): () => Promise<T>;
/**
 * Service tier enum
 */
export declare enum ServiceTier {
    FREE = "free",
    PRO = "pro",
    ENTERPRISE = "enterprise"
}
/**
 * Enhanced service loader with telemetry and tier-based loading
 */
export declare class EnhancedServiceLoader {
    private metadata;
    private telemetry?;
    /**
     * Set telemetry service for performance tracking
     */
    setTelemetry(telemetry: any): void;
    /**
     * Load a service with performance tracking
     */
    load<T>(serviceName: string, importFn: () => Promise<{
        [key: string]: new (...args: any[]) => T;
    }>, options?: {
        tier?: ServiceTier;
        essential?: boolean;
        constructorArgs?: any[];
    }): Promise<T>;
    /**
     * Load services by tier
     * @param tier Service tier to load
     */
    loadByTier(tier: ServiceTier): Promise<void>;
    /**
     * Get loading statistics
     */
    getStats(): {
        total: number;
        loaded: number;
        byTier: Record<ServiceTier, number>;
        averageLoadTime: number;
    };
    /**
     * Check if user has access to a service tier
     */
    hasAccess(tier: ServiceTier, userTier: ServiceTier): boolean;
}
/**
 * Global service loader instance
 */
export declare const serviceLoader: EnhancedServiceLoader;
/**
 * Preload essential services in the background
 * @param services Array of service loaders to preload
 */
export declare function preloadServices(services: Array<() => Promise<any>>): Promise<void>;
/**
 * Export ServiceCache for testing
 */
export { ServiceCache };
//# sourceMappingURL=ServiceLoader.d.ts.map