/**
 * Voice Recognition Service
 * Handles voice input and converts it to text using Whisper.js
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'eventemitter3';
import { WhisperModelManager } from './WhisperModelManager';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  language?: string;
  segments?: Array<{ start: number; end: number; text: string }>;
}

export interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  model?: string;
}

const DEFAULT_MODEL = 'whisper-base';

export class VoiceRecognitionService extends EventEmitter {
  private isListening = false;
  private whisperManager: WhisperModelManager;
  private config: vscode.WorkspaceConfiguration;
  private isModelLoaded = false;
  private currentModelId: string = DEFAULT_MODEL;
  private pipeline: any = null;

  constructor() {
    super();
    this.config = vscode.workspace.getConfiguration('voiceflow');
    this.whisperManager = WhisperModelManager.getInstance();

    // Get model from config
    const configModel = this.config.get<string>('whisperModel');
    if (configModel) {
      this.currentModelId = configModel;
    }

    console.log(`[VoiceRecognition] Initialized with model: ${this.currentModelId}`);
  }

  /**
   * Initialize the Whisper model (call before transcribing)
   */
  async initialize(): Promise<void> {
    if (this.isModelLoaded) {
      return;
    }

    try {
      this.emit('model-loading', { modelId: this.currentModelId });

      this.pipeline = await this.whisperManager.loadModel(
        this.currentModelId,
        (progress, message) => {
          this.emit('model-loading-progress', { progress, message });
        }
      );

      this.isModelLoaded = true;
      this.emit('model-loaded', { modelId: this.currentModelId });
      console.log(`[VoiceRecognition] Model ${this.currentModelId} loaded successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('model-load-error', { error: errorMessage });
      console.error(`[VoiceRecognition] Failed to load model: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Change the Whisper model
   */
  async setModel(modelId: string): Promise<void> {
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
  async startListening(options?: VoiceRecognitionOptions): Promise<void> {
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
  async stopListening(): Promise<void> {
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
  async toggleListening(): Promise<void> {
    if (this.isListening) {
      await this.stopListening();
    } else {
      await this.startListening();
    }
  }

  /**
   * Get current listening state
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if model is loaded
   */
  getIsModelLoaded(): boolean {
    return this.isModelLoaded;
  }

  /**
   * Get current model ID
   */
  getCurrentModel(): string {
    return this.currentModelId;
  }

  /**
   * Transcribe audio buffer using Whisper
   */
  async transcribe(audioBuffer: Float32Array): Promise<TranscriptionResult> {
    const start = Date.now();

    // Ensure model is loaded
    if (!this.pipeline || !this.isModelLoaded) {
      await this.initialize();
    }

    try {
      // Run transcription with Whisper
      const result = await this.pipeline(audioBuffer, {
        language: this.config.get<string>('language', 'en'),
        task: 'transcribe',
        return_timestamps: true,
      });

      const duration = Date.now() - start;

      // Extract segments if available
      const segments = result.chunks?.map((chunk: any) => ({
        start: chunk.timestamp[0] || 0,
        end: chunk.timestamp[1] || 0,
        text: chunk.text || '',
      }));

      const transcriptionResult: TranscriptionResult = {
        text: result.text || '',
        confidence: 0.95, // Whisper doesn't provide confidence scores
        duration,
        language: this.config.get<string>('language', 'en'),
        segments,
      };

      this.emit('transcription-complete', transcriptionResult);
      console.log(`[VoiceRecognition] Transcribed in ${duration}ms: "${result.text}"`);

      return transcriptionResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('transcription-error', { error: errorMessage });
      console.error(`[VoiceRecognition] Transcription failed: ${errorMessage}`);

      return {
        text: '',
        confidence: 0,
        duration: Date.now() - start,
        language: this.config.get<string>('language', 'en'),
      };
    }
  }

  /**
   * Preload the Whisper model in background
   */
  async preloadModel(): Promise<void> {
    if (this.isModelLoaded) {
      return;
    }

    try {
      await this.whisperManager.preloadModel(this.currentModelId);
      console.log(`[VoiceRecognition] Model ${this.currentModelId} preloaded in background`);
    } catch (error) {
      console.warn('[VoiceRecognition] Background preload failed, will load on first use');
    }
  }

  /**
   * Get model cache information
   */
  async getCacheInfo(): Promise<{ count: number; models: string[] }> {
    return this.whisperManager.getCacheInfo();
  }

  /**
   * Clear model cache
   */
  async clearCache(): Promise<void> {
    await this.whisperManager.clearCache();
    this.isModelLoaded = false;
    this.pipeline = null;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopListening();
    this.removeAllListeners();
    this.pipeline = null;
    this.isModelLoaded = false;
  }
}
