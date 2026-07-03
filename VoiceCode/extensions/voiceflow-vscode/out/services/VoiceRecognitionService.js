"use strict";
/**
 * Voice Recognition Service
 * Handles voice input and converts it to text using Whisper.js
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
exports.VoiceRecognitionService = void 0;
const vscode = __importStar(require("vscode"));
const eventemitter3_1 = require("eventemitter3");
const WhisperModelManager_1 = require("./WhisperModelManager");
const DEFAULT_MODEL = 'whisper-base';
class VoiceRecognitionService extends eventemitter3_1.EventEmitter {
    isListening = false;
    whisperManager;
    config;
    isModelLoaded = false;
    currentModelId = DEFAULT_MODEL;
    pipeline = null;
    constructor() {
        super();
        this.config = vscode.workspace.getConfiguration('voiceflow');
        this.whisperManager = WhisperModelManager_1.WhisperModelManager.getInstance();
        // Get model from config
        const configModel = this.config.get('whisperModel');
        if (configModel) {
            this.currentModelId = configModel;
        }
        console.log(`[VoiceRecognition] Initialized with model: ${this.currentModelId}`);
    }
    /**
     * Initialize the Whisper model (call before transcribing)
     */
    async initialize() {
        if (this.isModelLoaded) {
            return;
        }
        try {
            this.emit('model-loading', { modelId: this.currentModelId });
            this.pipeline = await this.whisperManager.loadModel(this.currentModelId, (progress, message) => {
                this.emit('model-loading-progress', { progress, message });
            });
            this.isModelLoaded = true;
            this.emit('model-loaded', { modelId: this.currentModelId });
            console.log(`[VoiceRecognition] Model ${this.currentModelId} loaded successfully`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('model-load-error', { error: errorMessage });
            console.error(`[VoiceRecognition] Failed to load model: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Change the Whisper model
     */
    async setModel(modelId) {
        if (modelId === this.currentModelId && this.isModelLoaded) {
            return;
        }
        this.currentModelId = modelId;
        this.isModelLoaded = false;
        this.pipeline = null;
        await this.initialize();
    }
    /**
     * Start listening for voice input
     */
    async startListening(options) {
        if (this.isListening) {
            console.warn('[VoiceRecognition] Already listening');
            return;
        }
        // Ensure model is loaded
        if (!this.isModelLoaded) {
            await this.initialize();
        }
        // Update model if specified in options
        if (options?.model && options.model !== this.currentModelId) {
            await this.setModel(options.model);
        }
        this.isListening = true;
        this.emit('listening-started');
        console.log('[VoiceRecognition] Started listening');
    }
    /**
     * Stop listening
     */
    async stopListening() {
        if (!this.isListening) {
            return;
        }
        this.isListening = false;
        this.emit('listening-stopped');
        console.log('[VoiceRecognition] Stopped listening');
    }
    /**
     * Toggle listening state
     */
    async toggleListening() {
        if (this.isListening) {
            await this.stopListening();
        }
        else {
            await this.startListening();
        }
    }
    /**
     * Get current listening state
     */
    getIsListening() {
        return this.isListening;
    }
    /**
     * Check if model is loaded
     */
    getIsModelLoaded() {
        return this.isModelLoaded;
    }
    /**
     * Get current model ID
     */
    getCurrentModel() {
        return this.currentModelId;
    }
    /**
     * Transcribe audio buffer using Whisper
     */
    async transcribe(audioBuffer) {
        const start = Date.now();
        // Ensure model is loaded
        if (!this.pipeline || !this.isModelLoaded) {
            await this.initialize();
        }
        try {
            // Run transcription with Whisper
            const result = await this.pipeline(audioBuffer, {
                language: this.config.get('language', 'en'),
                task: 'transcribe',
                return_timestamps: true,
            });
            const duration = Date.now() - start;
            // Extract segments if available
            const segments = result.chunks?.map((chunk) => ({
                start: chunk.timestamp[0] || 0,
                end: chunk.timestamp[1] || 0,
                text: chunk.text || '',
            }));
            const transcriptionResult = {
                text: result.text || '',
                confidence: 0.95, // Whisper doesn't provide confidence scores
                duration,
                language: this.config.get('language', 'en'),
                segments,
            };
            this.emit('transcription-complete', transcriptionResult);
            console.log(`[VoiceRecognition] Transcribed in ${duration}ms: "${result.text}"`);
            return transcriptionResult;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('transcription-error', { error: errorMessage });
            console.error(`[VoiceRecognition] Transcription failed: ${errorMessage}`);
            return {
                text: '',
                confidence: 0,
                duration: Date.now() - start,
                language: this.config.get('language', 'en'),
            };
        }
    }
    /**
     * Preload the Whisper model in background
     */
    async preloadModel() {
        if (this.isModelLoaded) {
            return;
        }
        try {
            await this.whisperManager.preloadModel(this.currentModelId);
            console.log(`[VoiceRecognition] Model ${this.currentModelId} preloaded in background`);
        }
        catch (error) {
            console.warn('[VoiceRecognition] Background preload failed, will load on first use');
        }
    }
    /**
     * Get model cache information
     */
    async getCacheInfo() {
        return this.whisperManager.getCacheInfo();
    }
    /**
     * Clear model cache
     */
    async clearCache() {
        await this.whisperManager.clearCache();
        this.isModelLoaded = false;
        this.pipeline = null;
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this.stopListening();
        this.removeAllListeners();
        this.pipeline = null;
        this.isModelLoaded = false;
    }
}
exports.VoiceRecognitionService = VoiceRecognitionService;
//# sourceMappingURL=VoiceRecognitionService.js.map