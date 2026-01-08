"use strict";
/**
 * Whisper Model Manager
 * Optimized model loading with IndexedDB caching and Web Worker support
 * Fixes the 3-5 second model loading delay
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhisperModelManager = void 0;
// Model size information (approximate)
const MODEL_SIZES = {
    'whisper-tiny': { size: 40, description: 'Fastest, 40MB' },
    'whisper-base': { size: 75, description: 'Balanced, 75MB' },
    'whisper-small': { size: 150, description: 'Better accuracy, 150MB' },
    'whisper-medium': { size: 300, description: 'Best accuracy, 300MB' },
};
class WhisperModelManager {
    static instance = null;
    loadedModel = null;
    currentModelId = null;
    isLoading = false;
    loadingPromise = null;
    dbName = 'voiceflow-whisper-cache';
    dbVersion = 1;
    db = null;
    constructor() { }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!WhisperModelManager.instance) {
            WhisperModelManager.instance = new WhisperModelManager();
        }
        return WhisperModelManager.instance;
    }
    /**
     * Initialize IndexedDB for model caching
     */
    async initializeDB() {
        if (this.db) {
            return;
        }
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create object store for model cache
                if (!db.objectStoreNames.contains('models')) {
                    const objectStore = db.createObjectStore('models', { keyPath: 'modelId' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('Created models object store');
                }
            };
        });
    }
    /**
     * Check if model is cached in IndexedDB
     */
    async isCached(modelId) {
        try {
            await this.initializeDB();
            if (!this.db)
                return false;
            return new Promise((resolve) => {
                const transaction = this.db.transaction(['models'], 'readonly');
                const objectStore = transaction.objectStore('models');
                const request = objectStore.get(modelId);
                request.onsuccess = () => {
                    resolve(!!request.result);
                };
                request.onerror = () => {
                    console.error('Error checking cache:', request.error);
                    resolve(false);
                };
            });
        }
        catch (error) {
            console.error('Error in isCached:', error);
            return false;
        }
    }
    /**
     * Get cached model from IndexedDB
     */
    async getCachedModel(modelId) {
        try {
            await this.initializeDB();
            if (!this.db)
                return null;
            return new Promise((resolve) => {
                const transaction = this.db.transaction(['models'], 'readonly');
                const objectStore = transaction.objectStore('models');
                const request = objectStore.get(modelId);
                request.onsuccess = () => {
                    const entry = request.result;
                    if (entry) {
                        console.log(`Model ${modelId} loaded from cache (cached ${new Date(entry.timestamp).toLocaleString()})`);
                        resolve(entry.data);
                    }
                    else {
                        resolve(null);
                    }
                };
                request.onerror = () => {
                    console.error('Error getting cached model:', request.error);
                    resolve(null);
                };
            });
        }
        catch (error) {
            console.error('Error in getCachedModel:', error);
            return null;
        }
    }
    /**
     * Cache model in IndexedDB
     */
    async cacheModel(modelId, modelData) {
        try {
            await this.initializeDB();
            if (!this.db)
                return;
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['models'], 'readwrite');
                const objectStore = transaction.objectStore('models');
                const entry = {
                    modelId,
                    timestamp: Date.now(),
                    version: '1.0.0',
                    data: modelData,
                };
                const request = objectStore.put(entry);
                request.onsuccess = () => {
                    console.log(`Model ${modelId} cached successfully`);
                    resolve();
                };
                request.onerror = () => {
                    console.error('Error caching model:', request.error);
                    reject(request.error);
                };
            });
        }
        catch (error) {
            console.error('Error in cacheModel:', error);
        }
    }
    /**
     * Load Whisper model with caching and progress reporting
     */
    async loadModel(modelId, progressCallback) {
        // If model is already loaded and it's the same model, return it
        if (this.loadedModel && this.currentModelId === modelId) {
            console.log(`Model ${modelId} already loaded, reusing`);
            return this.loadedModel;
        }
        // If currently loading the same model, wait for it
        if (this.isLoading && this.currentModelId === modelId && this.loadingPromise) {
            console.log(`Model ${modelId} is currently loading, waiting...`);
            return this.loadingPromise;
        }
        // Start loading
        this.isLoading = true;
        this.currentModelId = modelId;
        this.loadingPromise = this._loadModelInternal(modelId, progressCallback);
        try {
            this.loadedModel = await this.loadingPromise;
            return this.loadedModel;
        }
        finally {
            this.isLoading = false;
            this.loadingPromise = null;
        }
    }
    /**
     * Internal model loading logic
     */
    async _loadModelInternal(modelId, progressCallback) {
        const modelInfo = MODEL_SIZES[modelId];
        const modelSize = modelInfo?.size || 75;
        // Step 1: Check cache
        progressCallback?.(0, 'Checking cache...');
        const isCached = await this.isCached(modelId);
        if (isCached) {
            progressCallback?.(10, 'Loading from cache...');
            const cachedModel = await this.getCachedModel(modelId);
            if (cachedModel) {
                progressCallback?.(100, 'Model loaded from cache!');
                return cachedModel;
            }
        }
        // Step 2: Download and load model
        progressCallback?.(20, `Downloading model (${modelSize}MB)...`);
        try {
            // Import transformers library
            const { pipeline, env } = await Promise.resolve().then(() => __importStar(require('@xenova/transformers')));
            // Configure environment for optimal performance
            env.backends.onnx.wasm.numThreads = 4;
            env.allowRemoteModels = true;
            env.allowLocalModels = true;
            // Enable caching in transformers
            env.cacheDir = '.cache/transformers';
            // Map model ID to HuggingFace model
            const modelMap = {
                'whisper-tiny': 'Xenova/whisper-tiny',
                'whisper-base': 'Xenova/whisper-base',
                'whisper-small': 'Xenova/whisper-small',
                'whisper-medium': 'Xenova/whisper-medium',
            };
            const huggingFaceModelId = modelMap[modelId] || 'Xenova/whisper-base';
            // Load model with progress tracking
            let lastProgress = 20;
            const model = await pipeline('automatic-speech-recognition', huggingFaceModelId, {
                quantized: true,
                progress_callback: (progressData) => {
                    if (progressData.progress !== undefined) {
                        // Map 0-100% to 20-90% of our progress
                        const progress = 20 + (progressData.progress * 70);
                        if (progress > lastProgress) {
                            lastProgress = progress;
                            progressCallback?.(Math.round(progress), `Loading: ${Math.round(progressData.progress * 100)}%`);
                        }
                    }
                },
            });
            // Step 3: Cache the model
            progressCallback?.(90, 'Caching model...');
            await this.cacheModel(modelId, model);
            progressCallback?.(100, 'Model loaded successfully!');
            return model;
        }
        catch (error) {
            console.error('Failed to load Whisper model:', error);
            throw new Error(`Failed to load Whisper model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Preload model in background (non-blocking)
     */
    async preloadModel(modelId) {
        try {
            console.log(`Preloading model ${modelId} in background...`);
            await this.loadModel(modelId);
            console.log(`Model ${modelId} preloaded successfully`);
        }
        catch (error) {
            console.error(`Failed to preload model ${modelId}:`, error);
        }
    }
    /**
     * Clear model cache
     */
    async clearCache() {
        try {
            await this.initializeDB();
            if (!this.db)
                return;
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['models'], 'readwrite');
                const objectStore = transaction.objectStore('models');
                const request = objectStore.clear();
                request.onsuccess = () => {
                    console.log('Model cache cleared');
                    resolve();
                };
                request.onerror = () => {
                    console.error('Error clearing cache:', request.error);
                    reject(request.error);
                };
            });
        }
        catch (error) {
            console.error('Error in clearCache:', error);
        }
    }
    /**
     * Get cache size and info
     */
    async getCacheInfo() {
        try {
            await this.initializeDB();
            if (!this.db)
                return { count: 0, models: [] };
            return new Promise((resolve) => {
                const transaction = this.db.transaction(['models'], 'readonly');
                const objectStore = transaction.objectStore('models');
                const request = objectStore.getAllKeys();
                request.onsuccess = () => {
                    const models = request.result;
                    resolve({ count: models.length, models });
                };
                request.onerror = () => {
                    console.error('Error getting cache info:', request.error);
                    resolve({ count: 0, models: [] });
                };
            });
        }
        catch (error) {
            console.error('Error in getCacheInfo:', error);
            return { count: 0, models: [] };
        }
    }
    /**
     * Unload current model to free memory
     */
    unloadModel() {
        if (this.loadedModel) {
            console.log(`Unloading model ${this.currentModelId}`);
            this.loadedModel = null;
            this.currentModelId = null;
        }
    }
    /**
     * Dispose and cleanup
     */
    dispose() {
        this.unloadModel();
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
exports.WhisperModelManager = WhisperModelManager;
//# sourceMappingURL=WhisperModelManager.js.map