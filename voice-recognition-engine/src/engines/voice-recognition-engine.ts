/**
 * Main Voice Recognition Engine
 * Orchestrates Web Speech API and Whisper.js for comprehensive voice recognition
 */

import EventEmitter from 'eventemitter3';
import {
  VoiceRecognitionEngine,
  RecognitionConfig,
  SpeechRecognitionResult,
  ModelType,
  Language,
  AudioMetrics,
  RecognitionError,
  ErrorCode,
  VoiceRecognitionPlugin,
  VoiceRecognitionEvents,
  RecognitionStats,
  PerformancePreference,
  EngineConfig,
  QualityLevel
} from '../types';
import { WebSpeechEngine } from './web-speech-engine';
import { WhisperEngine } from './whisper-engine';
import { AudioProcessor } from '../processing/audio-processor';
import { languageManager } from '../config/languages';

export class VoiceFlowRecognitionEngine extends EventEmitter<VoiceRecognitionEvents> implements VoiceRecognitionEngine {
  // Engine instances
  private webSpeechEngine: WebSpeechEngine;
  private whisperEngine: WhisperEngine;
  private audioProcessor: AudioProcessor;

  // Configuration
  private config: EngineConfig;
  private recognitionConfig: RecognitionConfig;

  // State management
  private currentEngine: ModelType | null = null;
  private isListening = false;
  private isInitialized = false;
  private _currentLanguage: Language | null = null;
  private resultBuffer: SpeechRecognitionResult[] = [];
  private stats: RecognitionStats;

  // Plugin system
  private plugins: Map<string, VoiceRecognitionPlugin> = new Map();

  // Performance monitoring
  private performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    switchCount: number;
  } = {
    averageResponseTime: 0,
    successRate: 1.0,
    switchCount: 0
  };

  constructor(config: Partial<EngineConfig & RecognitionConfig> = {}) {
    super();

    // Default configuration
    this.config = {
      primaryEngine: ModelType.WEB_SPEECH_API,
      fallbackEngine: ModelType.WHISPER_BASE,
      autoEngineSelection: true,
      offlineFirst: false,
      qualityPreference: QualityLevel.EXCELLENT,
      performancePreference: PerformancePreference.BALANCED,
      privacyMode: false,
      cacheEnabled: true,
      ...config
    };

    this.recognitionConfig = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.5,
      noiseReduction: true,
      autoLanguageDetection: true,
      realTimeTranscription: true,
      ...config
    };

    // Initialize engines
    this.webSpeechEngine = new WebSpeechEngine(this.recognitionConfig);
    this.whisperEngine = new WhisperEngine(this.recognitionConfig);
    this.audioProcessor = new AudioProcessor();

    // Initialize stats
    this.stats = {
      totalRecognitions: 0,
      averageAccuracy: 0,
      averageSpeed: 0,
      languageUsage: {},
      engineUsage: {} as Record<ModelType, number>,
      errorRate: 0,
      uptime: 0,
      peakMemoryUsage: 0,
      totalProcessingTime: 0
    };

    // Set up event forwarding
    this.setupEventForwarding();
  }

  async initialize(language?: string): Promise<void> {
    try {
      console.log('Initializing VoiceFlow Recognition Engine...');

      // Initialize audio processor
      await this.audioProcessor.initialize();

      // Initialize both engines
      await Promise.allSettled([
        this.webSpeechEngine.initialize(language),
        this.whisperEngine.initialize(language)
      ]);

      // Auto-select engine based on configuration and capabilities
      await this.selectEngine();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.isInitialized = true;
      this.emit('recognition:start'); // Emit initial state

      console.log('VoiceFlow Recognition Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VoiceFlow Recognition Engine:', error);
      throw new RecognitionError(
        `Engine initialization failed: ${error}`,
        ErrorCode.NOT_SUPPORTED,
        this.currentEngine || ModelType.WEB_SPEECH_API
      );
    }
  }

  private async selectEngine(): Promise<void> {
    if (!this.config.autoEngineSelection) {
      this.currentEngine = this.config.primaryEngine;
      return;
    }

    // Determine best engine based on various factors
    const shouldUseWhisper = await this.shouldUseWhisper();
    
    if (shouldUseWhisper) {
      this.currentEngine = ModelType.WHISPER_BASE;
    } else {
      this.currentEngine = ModelType.WEB_SPEECH_API;
    }

    console.log(`Auto-selected engine: ${this.currentEngine}`);
  }

  private async shouldUseWhisper(): Promise<boolean> {
    // Factors for engine selection:
    // 1. Offline requirement
    if (this.config.offlineFirst) return true;

    // 2. Language support
    if (this.currentLanguage && !this.isLanguageSupportedByWebSpeech(this.currentLanguage.code)) {
      return true;
    }

    // 3. Privacy mode
    if (this.config.privacyMode) return true;

    // 4. Performance preference
    switch (this.config.performancePreference) {
      case PerformancePreference.SPEED:
        return this.webSpeechEngine.isSupported(); // Web Speech API is faster
      case PerformancePreference.ACCURACY:
        return true; // Whisper is generally more accurate
      case PerformancePreference.RESOURCE_SAVING:
        return !this.webSpeechEngine.isSupported();
      case PerformancePreference.BALANCED:
      default:
        return !this.webSpeechEngine.isSupported() || Math.random() > 0.5;
    }
  }

  private isLanguageSupportedByWebSpeech(languageCode: string): boolean {
    return this.webSpeechEngine.getCapabilities().supportedLanguages > 0;
  }

  private setupEventForwarding(): void {
    // Forward results from active engine
    this.webSpeechEngine.on('recognition:result', async (result) => {
      await this.processResult(result, ModelType.WEB_SPEECH_API);
    });

    this.whisperEngine.on('recognition:result', async (result) => {
      await this.processResult(result, ModelType.WHISPER_BASE);
    });

    // Forward audio metrics
    this.webSpeechEngine.on('audio:metrics', (metrics) => {
      this.emit('audio:metrics', metrics);
    });

    this.whisperEngine.on('audio:metrics', (metrics) => {
      this.emit('audio:metrics', metrics);
    });

    // Forward language detection
    this.webSpeechEngine.on('language:detected', (language) => {
      this._currentLanguage = language;
      this.emit('language:detected', language);
    });

    this.whisperEngine.on('language:detected', (language) => {
      this._currentLanguage = language;
      this.emit('language:detected', language);
    });

    // Handle errors and attempt automatic recovery
    this.webSpeechEngine.on('recognition:error', (error) => this.handleEngineError(error));
    this.whisperEngine.on('recognition:error', (error) => this.handleEngineError(error));
  }

  private async processResult(result: SpeechRecognitionResult, engineType: ModelType): Promise<void> {
    // Apply plugins
    const processedResult = await this.applyPlugins(result);

    // Update statistics
    this.updateStats(processedResult, engineType);

    // Emit processed result
    this.emit('recognition:result', processedResult);

    // Auto-switch engines if needed
    if (this.config.autoEngineSelection && this.shouldSwitchEngine(result)) {
      this.switchEngine();
    }
  }

  private async applyPlugins(result: SpeechRecognitionResult): Promise<SpeechRecognitionResult> {
    let processedResult = result;

    // Apply all registered plugins
    for (const plugin of this.plugins.values()) {
      if (plugin.enhanceResult) {
        processedResult = { ...processedResult }; // Create copy
        processedResult = await plugin.enhanceResult(processedResult);
      }
    }

    return processedResult;
  }

  private shouldSwitchEngine(result: SpeechRecognitionResult): boolean {
    // Switch if confidence is consistently low
    if (result.confidence < this.recognitionConfig.confidenceThreshold * 0.7) {
      return true;
    }

    // Switch if processing time is too slow
    if (result.metadata.processingTime > 5000) { // 5 seconds
      return true;
    }

    return false;
  }

  private async switchEngine(): Promise<void> {
    const previousEngine = this.currentEngine;
    
    // Select new engine
    await this.selectEngine();

    if (this.currentEngine !== previousEngine && this.isListening) {
      // Restart listening with new engine
      await this.restartListening();
      this.performanceMetrics.switchCount++;
      this.emit('model:switched', this.currentEngine);
    }
  }

  private async restartListening(): Promise<void> {
    if (!this.isListening) return;

    const wasListening = this.isListening;
    const previousEngine = this.currentEngine;
    this.isListening = false;

    // Stop current engine
    await this.stopEngine(previousEngine!);

    // Start new engine
    await this.startEngine(this.currentEngine!);

    if (wasListening) {
      this.isListening = true;
    }
  }

  private async startEngine(engine: ModelType): Promise<void> {
    switch (engine) {
      case ModelType.WEB_SPEECH_API:
        await this.webSpeechEngine.startListening();
        break;
      case ModelType.WHISPER_BASE:
      case ModelType.WHISPER_TINY:
      case ModelType.WHISPER_SMALL:
      case ModelType.WHISPER_MEDIUM:
      case ModelType.WHISPER_LARGE:
        await this.whisperEngine.startListening();
        break;
    }
  }

  private async stopEngine(engine: ModelType): Promise<void> {
    switch (engine) {
      case ModelType.WEB_SPEECH_API:
        await this.webSpeechEngine.stopListening();
        break;
      case ModelType.WHISPER_BASE:
      case ModelType.WHISPER_TINY:
      case ModelType.WHISPER_SMALL:
      case ModelType.WHISPER_MEDIUM:
      case ModelType.WHISPER_LARGE:
        await this.whisperEngine.stopListening();
        break;
    }
  }

  private handleEngineError(error: RecognitionError): void {
    console.error(`Engine error in ${error.model}:`, error);

    // Try to switch engines if auto-selection is enabled
    if (this.config.autoEngineSelection && error.recoverable) {
      this.switchEngine();
    }

    this.emit('recognition:error', error);
  }

  async startListening(config?: RecognitionConfig): Promise<void> {
    if (!this.isInitialized) {
      throw new RecognitionError(
        'Engine not initialized',
        ErrorCode.NOT_SUPPORTED,
        this.currentEngine || ModelType.WEB_SPEECH_API
      );
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      // Update configuration if provided
      if (config) {
        this.recognitionConfig = { ...this.recognitionConfig, ...config };
      }

      // Start audio processing
      await this.audioProcessor.startRecording();

      // Start the selected engine
      await this.startEngine(this.currentEngine!);

      this.isListening = true;
      this.emit('recognition:start');

      console.log(`Started listening with engine: ${this.currentEngine}`);
    } catch (error) {
      throw new RecognitionError(
        `Failed to start listening: ${error}`,
        ErrorCode.AUDIO_PROCESSING_ERROR,
        this.currentEngine || ModelType.WEB_SPEECH_API
      );
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      console.warn('Not currently listening');
      return;
    }

    try {
      this.isListening = false;

      // Stop audio processing
      this.audioProcessor.stopRecording();

      // Stop the current engine
      await this.stopEngine(this.currentEngine!);

      this.emit('recognition:stop');
      console.log('Stopped listening');
    } catch (error) {
      throw new RecognitionError(
        `Failed to stop listening: ${error}`,
        ErrorCode.AUDIO_PROCESSING_ERROR,
        this.currentEngine || ModelType.WEB_SPEECH_API
      );
    }
  }

  async setLanguage(languageCode: string): Promise<void> {
    const language = languageManager.getLanguage(languageCode);
    if (!language) {
      throw new RecognitionError(
        `Language not supported: ${languageCode}`,
        ErrorCode.LANGUAGE_NOT_SUPPORTED,
        this.currentEngine || ModelType.WEB_SPEECH_API
      );
    }

    try {
      // Set language on both engines
      await Promise.allSettled([
        this.webSpeechEngine.setLanguage(languageCode),
        this.whisperEngine.setLanguage(languageCode)
      ]);

      this.currentLanguage = language;
      this.recognitionConfig.language = languageCode;

      console.log(`Language set to: ${language.name} (${languageCode})`);
    } catch (error) {
      throw new RecognitionError(
        `Failed to set language: ${error}`,
        ErrorCode.LANGUAGE_NOT_SUPPORTED,
        this.currentEngine || ModelType.WEB_SPEECH_API
      );
    }
  }

  async switchEngine(modelType: ModelType): Promise<void> {
    if (this.currentEngine === modelType) {
      console.warn(`Already using engine: ${modelType}`);
      return;
    }

    const wasListening = this.isListening;

    try {
      if (wasListening) {
        this.isListening = false;
        await this.stopEngine(this.currentEngine!);
      }

      this.currentEngine = modelType;

      if (wasListening) {
        await this.startEngine(modelType);
        this.isListening = true;
      }

      this.emit('model:switched', modelType);
      console.log(`Switched to engine: ${modelType}`);
    } catch (error) {
      throw new RecognitionError(
        `Failed to switch engine: ${error}`,
        ErrorCode.MODEL_LOAD_FAILED,
        modelType
      );
    }
  }

  // Plugin system methods
  async registerPlugin(plugin: VoiceRecognitionPlugin): Promise<void> {
    try {
      await plugin.initialize();
      this.plugins.set(plugin.name, plugin);
      console.log(`Plugin registered: ${plugin.name}`);
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      await plugin.cleanup();
      this.plugins.delete(pluginName);
      console.log(`Plugin unregistered: ${pluginName}`);
    }
  }

  getPlugin(pluginName: string): VoiceRecognitionPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  getAllPlugins(): VoiceRecognitionPlugin[] {
    return [...this.plugins.values()];
  }

  // Statistics and monitoring
  private updateStats(result: SpeechRecognitionResult, engine: ModelType): void {
    this.stats.totalRecognitions++;
    this.stats.averageAccuracy = (this.stats.averageAccuracy * (this.stats.totalRecognitions - 1) + result.confidence) / this.stats.totalRecognitions;
    
    // Update language usage
    if (!this.stats.languageUsage[result.language]) {
      this.stats.languageUsage[result.language] = 0;
    }
    this.stats.languageUsage[result.language]++;

    // Update engine usage
    if (!this.stats.engineUsage[engine]) {
      this.stats.engineUsage[engine] = 0;
    }
    this.stats.engineUsage[engine]++;

    // Update processing time
    this.stats.totalProcessingTime += result.metadata.processingTime;
    this.stats.averageSpeed = this.stats.totalProcessingTime / this.stats.totalRecognitions;
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.stats.uptime = Date.now() - (this.stats.uptime || Date.now());
      this.updatePerformanceMetrics();
    }, 5000); // Update every 5 seconds
  }

  private updatePerformanceMetrics(): void {
    const recentResults = this.resultBuffer.slice(-10); // Last 10 results
    
    if (recentResults.length > 0) {
      const averageConfidence = recentResults.reduce((sum, result) => sum + result.confidence, 0) / recentResults.length;
      const averageProcessingTime = recentResults.reduce((sum, result) => sum + result.metadata.processingTime, 0) / recentResults.length;
      
      this.performanceMetrics.averageResponseTime = averageProcessingTime;
      this.performanceMetrics.successRate = averageConfidence;
    }
  }

  getStatistics(): RecognitionStats {
    return { ...this.stats };
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  // Getters
  get isListening(): boolean {
    return this.isListening;
  }

  get isSupported(): boolean {
    return this.webSpeechEngine.isSupported() || true; // Whisper is always supported
  }

  get supportedLanguages(): Language[] {
    return languageManager.getAllLanguages();
  }

  get currentLanguage(): Language | null {
    return this._currentLanguage;
  }

  get currentEngine(): ModelType | null {
    return this.currentEngine;
  }

  getAvailableModels(): ModelType[] {
    return [
      ModelType.WEB_SPEECH_API,
      ModelType.WHISPER_TINY,
      ModelType.WHISPER_BASE,
      ModelType.WHISPER_SMALL,
      ModelType.WHISPER_MEDIUM,
      ModelType.WHISPER_LARGE
    ];
  }

  // Audio level monitoring
  getAudioLevel(): number {
    return this.audioProcessor.getAudioLevel();
  }

  isAudioActive(threshold: number = 0.01): boolean {
    return this.audioProcessor.isAudioActive(threshold);
  }

  // Cleanup
  dispose(): void {
    this.isListening = false;
    
    // Stop all engines
    this.webSpeechEngine.dispose();
    this.whisperEngine.dispose();
    
    // Cleanup plugins
    for (const plugin of this.plugins.values()) {
      plugin.cleanup().catch(console.error);
    }
    this.plugins.clear();
    
    // Cleanup audio processor
    this.audioProcessor.dispose();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.isInitialized = false;
    console.log('VoiceFlow Recognition Engine disposed');
  }
}