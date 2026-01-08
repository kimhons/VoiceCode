/**
 * Whisper Model Manager
 * Optimized model loading with IndexedDB caching and Web Worker support
 * Fixes the 3-5 second model loading delay
 */
interface ProgressCallback {
    (progress: number, message: string): void;
}
export declare class WhisperModelManager {
    private static instance;
    private loadedModel;
    private currentModelId;
    private isLoading;
    private loadingPromise;
    private dbName;
    private dbVersion;
    private db;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): WhisperModelManager;
    /**
     * Initialize IndexedDB for model caching
     */
    private initializeDB;
    /**
     * Check if model is cached in IndexedDB
     */
    private isCached;
    /**
     * Get cached model from IndexedDB
     */
    private getCachedModel;
    /**
     * Cache model in IndexedDB
     */
    private cacheModel;
    /**
     * Load Whisper model with caching and progress reporting
     */
    loadModel(modelId: string, progressCallback?: ProgressCallback): Promise<any>;
    /**
     * Internal model loading logic
     */
    private _loadModelInternal;
    /**
     * Preload model in background (non-blocking)
     */
    preloadModel(modelId: string): Promise<void>;
    /**
     * Clear model cache
     */
    clearCache(): Promise<void>;
    /**
     * Get cache size and info
     */
    getCacheInfo(): Promise<{
        count: number;
        models: string[];
    }>;
    /**
     * Unload current model to free memory
     */
    unloadModel(): void;
    /**
     * Dispose and cleanup
     */
    dispose(): void;
}
export {};
//# sourceMappingURL=WhisperModelManager.d.ts.map