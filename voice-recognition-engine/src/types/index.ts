/**
 * Core types and interfaces for VoiceFlow Pro Voice Recognition Engine
 */

// Voice Recognition Engine Types
export interface VoiceRecognitionEngine {
  initialize(): Promise<void>;
  startListening(config?: RecognitionConfig): Promise<void>;
  stopListening(): Promise<void>;
  isListening: boolean;
  isSupported: boolean;
  supportedLanguages: Language[];
  currentLanguage: Language | null;
}

export interface RecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  noiseReduction: boolean;
  autoLanguageDetection: boolean;
  realTimeTranscription: boolean;
}

// Speech Recognition Result Types
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  language: string;
  alternatives: Alternative[];
  metadata: RecognitionMetadata;
}

export interface Alternative {
  transcript: string;
  confidence: number;
}

export interface RecognitionMetadata {
  audioLevel: number;
  signalQuality: number;
  processingTime: number;
  modelUsed: ModelType;
  noiseLevel: number;
}

// Language Support
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  webSpeechCode: string;
  whisperCode: string;
  supported: boolean;
  autoDetectSupported: boolean;
  quality: LanguageQuality;
}

export interface LanguageQuality {
  webSpeech: QualityLevel;
  whisper: QualityLevel;
  overall: QualityLevel;
}

export enum QualityLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  BASIC = 'basic',
  EXPERIMENTAL = 'experimental'
}

// Model Types
export enum ModelType {
  WEB_SPEECH_API = 'web-speech-api',
  WHISPER_TINY = 'whisper-tiny',
  WHISPER_BASE = 'whisper-base',
  WHISPER_SMALL = 'whisper-small',
  WHISPER_MEDIUM = 'whisper-medium',
  WHISPER_LARGE = 'whisper-large',
  CUSTOM = 'custom'
}

export interface ModelCapabilities {
  supportedLanguages: string[];
  offlineCapable: boolean;
  realTimeCapable: boolean;
  accuracy: QualityLevel;
  speed: QualityLevel;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  memoryMB: number;
  cpuPercentage: number;
  storageMB: number;
  initialLoadTime: number;
}

// Audio Processing
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
  noiseReductionLevel: number;
  echoCancellation: boolean;
  autoGainControl: boolean;
  beamforming: boolean;
}

export interface AudioMetrics {
  volume: number;
  signalToNoiseRatio: number;
  clipping: boolean;
  latency: number;
  bufferUnderrun: boolean;
}

// Event Types
export interface VoiceRecognitionEvents {
  'recognition:start': () => void;
  'recognition:stop': () => void;
  'recognition:result': (result: SpeechRecognitionResult) => void;
  'recognition:error': (error: RecognitionError) => void;
  'recognition:sound-start': () => void;
  'recognition:sound-end': () => void;
  'recognition:speech-start': () => void;
  'recognition:speech-end': () => void;
  'audio:metrics': (metrics: AudioMetrics) => void;
  'language:detected': (language: Language) => void;
  'model:switched': (model: ModelType) => void;
}

// Error Types
export class RecognitionError extends Error {
  public code: string;
  public model?: ModelType;
  public recoverable: boolean;

  constructor(
    message: string,
    code: string,
    model?: ModelType,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'RecognitionError';
    this.code = code;
    this.model = model;
    this.recoverable = recoverable;
  }
}

export enum ErrorCode {
  NO_MICROPHONE = 'no_microphone',
  PERMISSION_DENIED = 'permission_denied',
  NETWORK_ERROR = 'network_error',
  NOT_SUPPORTED = 'not_supported',
  MODEL_LOAD_FAILED = 'model_load_failed',
  AUDIO_PROCESSING_ERROR = 'audio_processing_error',
  LANGUAGE_NOT_SUPPORTED = 'language_not_supported',
  INSUFFICIENT_RESOURCES = 'insufficient_resources',
  TIMEOUT = 'timeout',
  INTERRUPTED = 'interrupted'
}

// Configuration Management
export interface EngineConfig {
  primaryEngine: ModelType;
  fallbackEngine: ModelType;
  autoEngineSelection: boolean;
  offlineFirst: boolean;
  qualityPreference: QualityLevel;
  performancePreference: PerformancePreference;
  privacyMode: boolean;
  cacheEnabled: boolean;
}

export enum PerformancePreference {
  SPEED = 'speed',
  BALANCED = 'balanced',
  ACCURACY = 'accuracy',
  RESOURCE_SAVING = 'resource_saving'
}

// Commands and Voice Commands
export interface VoiceCommand {
  phrase: string;
  action: CommandAction;
  confidenceThreshold: number;
  context?: string;
}

export interface CommandAction {
  type: 'text_replacement' | 'function_call' | 'navigation' | 'editing';
  parameters: Record<string, any>;
  enabled: boolean;
}

// Statistics and Analytics
export interface RecognitionStats {
  totalRecognitions: number;
  averageAccuracy: number;
  averageSpeed: number;
  languageUsage: Record<string, number>;
  engineUsage: Record<ModelType, number>;
  errorRate: number;
  uptime: number;
  peakMemoryUsage: number;
  totalProcessingTime: number;
}

// Utility Types
export type EventHandler<T extends (...args: any[]) => void> = T;
export type RecognitionCallback = (result: SpeechRecognitionResult) => void;
export type ErrorCallback = (error: RecognitionError) => void;
export type AudioCallback = (metrics: AudioMetrics) => void;

// Plugin System
export interface VoiceRecognitionPlugin {
  name: string;
  version: string;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  processAudio?(audioData: Float32Array): Promise<Float32Array>;
  enhanceResult?(result: SpeechRecognitionResult): Promise<SpeechRecognitionResult>;
  detectLanguage?(audioData: Float32Array): Promise<Language | null>;
}

export interface PluginRegistry {
  register(plugin: VoiceRecognitionPlugin): Promise<void>;
  unregister(name: string): Promise<void>;
  getPlugin(name: string): VoiceRecognitionPlugin | undefined;
  listPlugins(): VoiceRecognitionPlugin[];
}