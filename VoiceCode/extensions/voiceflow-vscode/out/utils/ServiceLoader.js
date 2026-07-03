"use strict";
/**
 * Service Loader Utility
 * Provides lazy loading pattern for extension services
 * Inspired by web app's createLazyComponent pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCache = exports.serviceLoader = exports.EnhancedServiceLoader = exports.ServiceTier = void 0;
exports.createLazyService = createLazyService;
exports.preloadServices = preloadServices;
/**
 * Service cache to ensure singleton pattern
 */
class ServiceCache {
    static instances = new Map();
    static loading = new Map();
    /**
     * Get or create a service instance
     * @param key Unique service identifier
     * @param factory Factory function to create the service
     * @returns Service instance (cached or newly created)
     */
    static async getOrCreate(key, factory) {
        // Return cached instance if available
        if (this.instances.has(key)) {
            return this.instances.get(key);
        }
        // If already loading, wait for that promise
        if (this.loading.has(key)) {
            return this.loading.get(key);
        }
        // Start loading
        const loadPromise = factory();
        this.loading.set(key, loadPromise);
        try {
            const instance = await loadPromise;
            this.instances.set(key, instance);
            this.loading.delete(key);
            return instance;
        }
        catch (error) {
            this.loading.delete(key);
            throw error;
        }
    }
    /**
     * Check if a service is already loaded
     */
    static isLoaded(key) {
        return this.instances.has(key);
    }
    /**
     * Clear all cached services (useful for testing)
     */
    static clearAll() {
        this.instances.clear();
        this.loading.clear();
    }
    /**
     * Remove a specific service from cache
     */
    static remove(key) {
        this.instances.delete(key);
        this.loading.delete(key);
    }
}
exports.ServiceCache = ServiceCache;
/**
 * Lazy load a service with automatic caching
 * @param serviceName Name of the service (for caching key)
 * @param importFn Dynamic import function
 * @returns Service loader function
 */
function createLazyService(serviceName, importFn, constructorArgs = []) {
    return async () => {
        return ServiceCache.getOrCreate(serviceName, async () => {
            const module = await importFn();
            // Find the constructor (could be default export or named export)
            const Constructor = module.default || module[serviceName];
            if (!Constructor) {
                throw new Error(`Service ${serviceName} not found in module. Available exports: ${Object.keys(module).join(', ')}`);
            }
            return new Constructor(...constructorArgs);
        });
    };
}
/**
 * Service tier enum
 */
var ServiceTier;
(function (ServiceTier) {
    ServiceTier["FREE"] = "free";
    ServiceTier["BASIC"] = "basic";
    ServiceTier["STANDARD"] = "standard";
    ServiceTier["PRO"] = "pro";
    ServiceTier["ENTERPRISE"] = "enterprise";
})(ServiceTier || (exports.ServiceTier = ServiceTier = {}));
/**
 * Enhanced service loader with telemetry and tier-based loading
 */
class EnhancedServiceLoader {
    metadata = new Map();
    telemetry; // TelemetryService instance (lazy loaded to avoid circular dependency)
    /**
     * Set telemetry service for performance tracking
     */
    setTelemetry(telemetry) {
        this.telemetry = telemetry;
    }
    /**
     * Load a service with performance tracking
     */
    async load(serviceName, importFn, options = {}) {
        const { tier = ServiceTier.FREE, essential = false, constructorArgs = [], } = options;
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
                ...this.metadata.get(serviceName),
                loadTime,
                loadedAt: Date.now(),
            });
            console.log(`[ServiceLoader] Loaded ${serviceName} (${tier}) in ${loadTime}ms${fromCache ? ' [cached]' : ''}`);
            // Record performance metric if telemetry is available
            if (this.telemetry && typeof this.telemetry.recordServiceLoad === 'function') {
                this.telemetry.recordServiceLoad(serviceName, loadTime, fromCache);
            }
            return service;
        }
        catch (error) {
            console.error(`[ServiceLoader] Failed to load ${serviceName}:`, error);
            // Record error if telemetry is available
            if (this.telemetry && typeof this.telemetry.recordError === 'function') {
                this.telemetry.recordError(error, {
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
    async loadByTier(tier) {
        const servicesForTier = Array.from(this.metadata.entries())
            .filter(([_, meta]) => meta.tier === tier && !ServiceCache.isLoaded(meta.name));
        console.log(`[ServiceLoader] Loading ${servicesForTier.length} ${tier} services`);
        // Load in parallel
        await Promise.allSettled(servicesForTier.map(([name]) => this.load(name, async () => {
            throw new Error('Service already registered, this should not happen');
        })));
    }
    /**
     * Get loading statistics
     */
    getStats() {
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
    hasAccess(tier, userTier) {
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
exports.EnhancedServiceLoader = EnhancedServiceLoader;
/**
 * Global service loader instance
 */
exports.serviceLoader = new EnhancedServiceLoader();
/**
 * Preload essential services in the background
 * @param services Array of service loaders to preload
 */
async function preloadServices(services) {
    // Non-blocking preload
    Promise.allSettled(services.map(loader => loader())).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`[ServiceLoader] Preloaded ${successful} services, ${failed} failed`);
    });
}
//# sourceMappingURL=ServiceLoader.js.map