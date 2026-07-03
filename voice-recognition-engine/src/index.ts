/**
 * VoiceFlow Pro Voice Recognition Engine - Main Entry Point
 * 
 * A comprehensive voice recognition system supporting:
 * - Web Speech API for real-time browser-based recognition
 * - Whisper.js for offline, high-accuracy processing
 * - 150+ languages with automatic detection
 * - Advanced noise reduction and audio processing
 * - Plugin system for extensibility
 * - Real-time transcription with confidence scoring
 */

export * from './types';
export * from './config/languages';
export * from './processing/audio-processor';
export * from './engines/web-speech-engine';
export * from './engines/whisper-engine';
export * from './engines/voice-recognition-engine';

// Main factory function for easy initialization
import {
  VoiceFlowRecognitionEngine,
  RecognitionConfig,
  EngineConfig,
  VoiceRecognitionPlugin,
  Language,
  SpeechRecognitionResult,
  AudioMetrics,
  RecognitionError
} from './engines/voice-recognition-engine';

import { languageManager } from './config/languages';

/**
 * Create and configure a new voice recognition engine instance
 */
export function createVoiceEngine(config?: Partial<EngineConfig & RecognitionConfig>): VoiceFlowRecognitionEngine {
  return new VoiceFlowRecognitionEngine(config);
}

/**
 * Quick setup function for common use cases
 */
export class VoiceFlowPro {
  private engine: VoiceFlowRecognitionEngine;
  private isInitialized = false;

  constructor(config?: Partial<EngineConfig & RecognitionConfig>) {
    this.engine = createVoiceEngine(config);
  }

  async initialize(language?: string): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Engine already initialized');
    }

    await this.engine.initialize(language);
    this.isInitialized = true;
  }

  // Core recognition methods
  async startListening(config?: RecognitionConfig): Promise<void> {
    this.ensureInitialized();
    await this.engine.startListening(config);
  }

  async stopListening(): Promise<void> {
    this.ensureInitialized();
    await this.engine.stopListening();
  }

  async setLanguage(languageCode: string): Promise<void> {
    this.ensureInitialized();
    await this.engine.setLanguage(languageCode);
  }

  async switchEngine(modelType: any): Promise<void> {
    this.ensureInitialized();
    await this.engine.switchEngine(modelType);
  }

  // Event handling
  onResult(callback: (result: SpeechRecognitionResult) => void): () => void {
    this.ensureInitialized();
    this.engine.on('recognition:result', callback);
    return () => this.engine.off('recognition:result', callback);
  }

  onError(callback: (error: RecognitionError) => void): () => void {
    this.ensureInitialized();
    this.engine.on('recognition:error', callback);
    return () => this.engine.off('recognition:error', callback);
  }

  onStart(callback: () => void): () => void {
    this.ensureInitialized();
    this.engine.on('recognition:start', callback);
    return () => this.engine.off('recognition:start', callback);
  }

  onStop(callback: () => void): () => void {
    this.ensureInitialized();
    this.engine.on('recognition:stop', callback);
    return () => this.engine.off('recognition:stop', callback);
  }

  onAudioMetrics(callback: (metrics: AudioMetrics) => void): () => void {
    this.ensureInitialized();
    this.engine.on('audio:metrics', callback);
    return () => this.engine.off('audio:metrics', callback);
  }

  onLanguageDetected(callback: (language: Language) => void): () => void {
    this.ensureInitialized();
    this.engine.on('language:detected', callback);
    return () => this.engine.off('language:detected', callback);
  }

  onEngineSwitched(callback: (model: any) => void): () => void {
    this.ensureInitialized();
    this.engine.on('model:switched', callback);
    return () => this.engine.off('model:switched', callback);
  }

  // Utility methods
  get isListening(): boolean {
    this.ensureInitialized();
    return this.engine.isListening;
  }

  get isSupported(): boolean {
    return this.engine.isSupported;
  }

  get supportedLanguages(): Language[] {
    return this.engine.supportedLanguages;
  }

  get currentLanguage(): Language | null {
    return this.engine.currentLanguage;
  }

  get currentEngine(): any {
    return this.engine.currentEngine;
  }

  getAudioLevel(): number {
    this.ensureInitialized();
    return this.engine.getAudioLevel();
  }

  isAudioActive(threshold?: number): boolean {
    this.ensureInitialized();
    return this.engine.isAudioActive(threshold);
  }

  // Plugin management
  async registerPlugin(plugin: VoiceRecognitionPlugin): Promise<void> {
    this.ensureInitialized();
    await this.engine.registerPlugin(plugin);
  }

  async unregisterPlugin(pluginName: string): Promise<void> {
    this.ensureInitialized();
    await this.engine.unregisterPlugin(pluginName);
  }

  // Statistics
  getStatistics() {
    this.ensureInitialized();
    return this.engine.getStatistics();
  }

  getPerformanceMetrics() {
    this.ensureInitialized();
    return this.engine.getPerformanceMetrics();
  }

  // Cleanup
  dispose(): void {
    if (this.isInitialized) {
      this.engine.dispose();
      this.isInitialized = false;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }
  }
}

/**
 * Default instance for quick start
 */
let defaultInstance: VoiceFlowPro | null = null;

export async function quickStart(config?: Partial<EngineConfig & RecognitionConfig>): Promise<VoiceFlowPro> {
  if (!defaultInstance) {
    defaultInstance = new VoiceFlowPro(config);
    await defaultInstance.initialize();
  }
  return defaultInstance;
}

export function getDefaultInstance(): VoiceFlowPro | null {
  return defaultInstance;
}

/**
 * Utility functions for common tasks
 */
export class VoiceUtils {
  /**
   * Check if a language is supported by the voice recognition engine
   */
  static isLanguageSupported(languageCode: string): boolean {
    return languageManager.getLanguage(languageCode) !== undefined;
  }

  /**
   * Get language by code
   */
  static getLanguage(languageCode: string): Language | undefined {
    return languageManager.getLanguage(languageCode);
  }

  /**
   * Search for languages by name
   */
  static searchLanguages(query: string): Language[] {
    return languageManager.searchLanguages(query);
  }

  /**
   * Get all supported languages
   */
  static getAllLanguages(): Language[] {
    return languageManager.getAllLanguages();
  }

  /**
   * Get language statistics
   */
  static getLanguageStatistics() {
    return languageManager.getLanguageStatistics();
  }

  /**
   * Create a simple voice command parser
   */
  static createVoiceCommandParser(commands: { [key: string]: string }): (text: string) => string | null {
    const commandEntries = Object.entries(commands);
    
    return (text: string): string | null => {
      const lowerText = text.toLowerCase().trim();
      
      for (const [command, action] of commandEntries) {
        if (lowerText.includes(command.toLowerCase())) {
          return action;
        }
      }
      
      return null;
    };
  }

  /**
   * Format transcription results for display
   */
  static formatTranscript(result: SpeechRecognitionResult): string {
    let transcript = result.transcript;
    
    // Add confidence indicator
    if (result.confidence < 0.7) {
      transcript += ' [low confidence]';
    } else if (result.confidence > 0.9) {
      transcript += ' [high confidence]';
    }
    
    // Add language info
    if (result.language !== 'unknown') {
      transcript += ` (${result.language})`;
    }
    
    return transcript;
  }

  /**
   * Calculate overall confidence score from multiple results
   */
  static calculateAverageConfidence(results: SpeechRecognitionResult[]): number {
    if (results.length === 0) return 0;
    
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0);
    return totalConfidence / results.length;
  }

  /**
   * Create a confidence threshold checker
   */
  static createConfidenceChecker(minConfidence: number): (result: SpeechRecognitionResult) => boolean {
    return (result: SpeechRecognitionResult) => result.confidence >= minConfidence;
  }
}

// Export version information
export const VERSION = '1.0.0';
export const ENGINE_NAME = 'VoiceFlow Pro Voice Recognition Engine';
export const SUPPORTED_FEATURES = [
  'Web Speech API',
  'Whisper.js Offline Processing',
  '150+ Languages',
  'Real-time Transcription',
  'Noise Reduction',
  'Auto Language Detection',
  'Plugin System',
  'Cross-browser Compatibility'
] as const;