/**
 * Voice Recognition Service
 * Handles voice input and converts it to text using Whisper.js
 */
import { EventEmitter } from 'eventemitter3';
export interface TranscriptionResult {
    text: string;
    confidence: number;
    duration: number;
    language?: string;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
    }>;
}
export interface VoiceRecognitionOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
    model?: string;
}
export declare class VoiceRecognitionService extends EventEmitter {
    private isListening;
    private whisperManager;
    private config;
    private isModelLoaded;
    private currentModelId;
    private pipeline;
    constructor();
    /**
     * Initialize the Whisper model (call before transcribing)
     */
    initialize(): Promise<void>;
    /**
     * Change the Whisper model
     */
    setModel(modelId: string): Promise<void>;
    /**
     * Start listening for voice input
     */
    startListening(options?: VoiceRecognitionOptions): Promise<void>;
    /**
     * Stop listening
     */
    stopListening(): Promise<void>;
    /**
     * Toggle listening state
     */
    toggleListening(): Promise<void>;
    /**
     * Get current listening state
     */
    getIsListening(): boolean;
    /**
     * Check if model is loaded
     */
    getIsModelLoaded(): boolean;
    /**
     * Get current model ID
     */
    getCurrentModel(): string;
    /**
     * Transcribe audio buffer using Whisper
     */
    transcribe(audioBuffer: Float32Array): Promise<TranscriptionResult>;
    /**
     * Preload the Whisper model in background
     */
    preloadModel(): Promise<void>;
    /**
     * Get model cache information
     */
    getCacheInfo(): Promise<{
        count: number;
        models: string[];
    }>;
    /**
     * Clear model cache
     */
    clearCache(): Promise<void>;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
//# sourceMappingURL=VoiceRecognitionService.d.ts.map