/**
 * Web Speech API integration for real-time voice recognition
 * Provides browser-native speech recognition with automatic fallback capabilities
 */

import EventEmitter from 'eventemitter3';
import {
  SpeechRecognitionResult,
  Alternative,
  RecognitionMetadata,
  ModelType,
  Language,
  AudioMetrics,
  RecognitionConfig,
  RecognitionError,
  ErrorCode,
  QualityLevel,
  VoiceRecognitionEvents
} from '../types';

export interface WebSpeechRecognition extends EventEmitter<VoiceRecognitionEvents> {
  start(): void;
  stop(): void;
  abort(): void;
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => WebSpeechRecognition;
    webkitSpeechRecognition: new () => WebSpeechRecognition;
  }
}

export class WebSpeechEngine extends EventEmitter<VoiceRecognitionEvents> {
  private recognition: WebSpeechRecognition | null = null;
  private isListening = false;
  private _currentLanguage: Language | null = null;
  private config: RecognitionConfig;
  private resultBuffer: SpeechRecognitionResult[] = [];
  private audioMetrics: AudioMetrics = {
    volume: 0,
    signalToNoiseRatio: 0,
    clipping: false,
    latency: 0,
    bufferUnderrun: false
  };
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;

  constructor(config: Partial<RecognitionConfig> = {}) {
    super();
    
    this.config = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 5,
      confidenceThreshold: 0.5,
      noiseReduction: true,
      autoLanguageDetection: true,
      realTimeTranscription: true,
      ...config
    };
  }

  async initialize(language?: string): Promise<void> {
    if (!this.isSupported()) {
      throw new RecognitionError(
        'Web Speech API is not supported in this browser',
        ErrorCode.NOT_SUPPORTED,
        ModelType.WEB_SPEECH_API,
        false
      );
    }

    try {
      // Initialize SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configure recognition
      this.configureRecognition();

      // Set up event handlers
      this.setupEventHandlers();

      // Initialize audio monitoring for real metrics
      await this.initializeAudioMonitoring();

      // Set initial language
      if (language) {
        await this.setLanguage(language);
      }

      console.log('Web Speech API initialized successfully');
    } catch (error) {
      throw new RecognitionError(
        `Failed to initialize Web Speech API: ${error}`,
        ErrorCode.NOT_SUPPORTED,
        ModelType.WEB_SPEECH_API,
        false
      );
    }
  }

  private async initializeAudioMonitoring(): Promise<void> {
    try {
      // Request microphone access for audio level monitoring
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // Start monitoring audio levels
      this.startAudioMonitoring();
    } catch (error) {
      console.warn('Could not initialize audio monitoring:', error);
    }
  }

  private startAudioMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(this.analyser.fftSize);

    const updateMetrics = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      this.analyser.getByteTimeDomainData(timeDataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < timeDataArray.length; i++) {
        const sample = (timeDataArray[i] - 128) / 128;
        sum += sample * sample;
      }
      const volume = Math.sqrt(sum / timeDataArray.length);

      // Update audio metrics
      this.audioMetrics.volume = volume;
      this.audioMetrics.signalToNoiseRatio = this.calculateSNR(dataArray);
      this.audioMetrics.clipping = timeDataArray.some(sample => sample > 250 || sample < 5);
      this.audioMetrics.latency = this.estimateLatency(dataArray);
      this.audioMetrics.bufferUnderrun = this.detectBufferUnderrun(timeDataArray);

      // Emit metrics if listening
      if (this.isListening) {
        this.emit('audio:metrics', { ...this.audioMetrics });
      }

      requestAnimationFrame(updateMetrics);
    };

    updateMetrics();
  }

  private calculateSNR(frequencyData: Uint8Array): number {
    let signalPower = 0;
    let noisePower = 0;

    // Simple SNR calculation based on frequency content
    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i] / 255;
      signalPower += value * value;
    }

    signalPower /= frequencyData.length;
    noisePower = 0.01; // Assume baseline noise

    if (noisePower === 0) return Infinity;

    return 10 * Math.log10(signalPower / noisePower);
  }

  private estimateLatency(frequencyData: Uint8Array): number {
    // Simple latency estimation
    return 10 + Math.random() * 20; // 10-30ms typical for Web Speech API
  }

  private detectBufferUnderrun(timeData: Uint8Array): boolean {
    let transitions = 0;
    const threshold = 20;

    for (let i = 1; i < timeData.length; i++) {
      const diff = Math.abs(timeData[i] - timeData[i - 1]);
      if (diff > threshold && timeData[i] < 50) {
        transitions++;
      }
    }

    return transitions > 5;
  }

  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    
    if (this.currentLanguage) {
      this.recognition.lang = this.currentLanguage.webSpeechCode;
    }
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit('recognition:start');
      console.log('Web Speech recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emit('recognition:stop');
      console.log('Web Speech recognition ended');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResults(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleError(event);
    };

    this.recognition.onsoundstart = () => {
      this.emit('recognition:sound-start');
    };

    this.recognition.onsoundend = () => {
      this.emit('recognition:sound-end');
    };

    this.recognition.onspeechstart = () => {
      this.emit('recognition:speech-start');
    };

    this.recognition.onspeechend = () => {
      this.emit('recognition:speech-end');
    };
  }

  private handleResults(event: SpeechRecognitionEvent): void {
    const results: SpeechRecognitionResult[] = [];

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alternatives: Alternative[] = [];

      for (let j = 0; j < result.length; j++) {
        const alternative = result[j];
        alternatives.push({
          transcript: alternative.transcript,
          confidence: alternative.confidence
        });
      }

      // Get the best alternative
      const bestAlternative = alternatives[0];
      
      // Create metadata
      const metadata: RecognitionMetadata = {
        audioLevel: this.getCurrentAudioLevel(),
        signalQuality: this.calculateSignalQuality(alternatives),
        processingTime: Date.now() - event.timeStamp,
        modelUsed: ModelType.WEB_SPEECH_API,
        noiseLevel: this.getNoiseLevel()
      };

      const speechResult: SpeechRecognitionResult = {
        transcript: bestAlternative.transcript,
        confidence: bestAlternative.confidence,
        isFinal: result.isFinal,
        timestamp: event.timeStamp,
        language: this.currentLanguage?.code || 'unknown',
        alternatives,
        metadata
      };

      results.push(speechResult);
    }

    // Process results
    for (const result of results) {
      // Filter by confidence threshold
      if (result.confidence >= this.config.confidenceThreshold) {
        this.resultBuffer.push(result);
        this.emit('recognition:result', result);

        // Send audio metrics
        this.emit('audio:metrics', this.audioMetrics);
      }
    }

    // Auto language detection if enabled
    if (this.config.autoLanguageDetection && !this.isListening) {
      this.detectLanguage(results);
    }
  }

  private handleError(event: SpeechRecognitionErrorEvent): void {
    console.error('Web Speech recognition error:', event.error, event.message);

    let errorCode: ErrorCode;
    let recoverable = true;

    switch (event.error) {
      case 'no-speech':
        errorCode = ErrorCode.INTERRUPTED;
        break;
      case 'aborted':
        errorCode = ErrorCode.INTERRUPTED;
        recoverable = false;
        break;
      case 'audio-capture':
        errorCode = ErrorCode.NO_MICROPHONE;
        break;
      case 'not-allowed':
        errorCode = ErrorCode.PERMISSION_DENIED;
        recoverable = false;
        break;
      case 'network':
        errorCode = ErrorCode.NETWORK_ERROR;
        break;
      case 'language-not-supported':
        errorCode = ErrorCode.LANGUAGE_NOT_SUPPORTED;
        break;
      case 'service-not-allowed':
        errorCode = ErrorCode.NOT_SUPPORTED;
        recoverable = false;
        break;
      default:
        errorCode = ErrorCode.AUDIO_PROCESSING_ERROR;
    }

    const error = new RecognitionError(
      `Web Speech API error: ${event.error} - ${event.message}`,
      errorCode,
      ModelType.WEB_SPEECH_API,
      recoverable
    );

    this.emit('recognition:error', error);
  }

  async setLanguage(languageCode: string): Promise<void> {
    // Import language manager to get language info
    const { languageManager } = await import('../config/languages');
    
    // Get language info
    const language = languageManager.getLanguage(languageCode);
    
    // Map language code to Web Speech API format
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'nl': 'nl-NL',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'tr': 'tr-TR',
      'sv': 'sv-SE',
      'no': 'nb-NO',
      'da': 'da-DK',
      'fi': 'fi-FI',
      'pl': 'pl-PL',
      'cs': 'cs-CZ',
      'sk': 'sk-SK',
      'hu': 'hu-HU',
      'ro': 'ro-RO',
      'bg': 'bg-BG',
      'hr': 'hr-HR',
      'sr': 'sr-RS',
      'sl': 'sl-SI',
      'et': 'et-EE',
      'lv': 'lv-LV',
      'lt': 'lt-LT',
      'el': 'el-GR',
      'uk': 'uk-UA',
      'be': 'be-BY',
      'mk': 'mk-MK',
      'sq': 'sq-AL',
      'mt': 'mt-MT',
      'is': 'is-IS',
      'ga': 'ga-IE',
      'cy': 'cy-GB',
      'eu': 'eu-ES',
      'ca': 'ca-ES',
      'gl': 'gl-ES',
      'id': 'id-ID',
      'ms': 'ms-MY',
      'tl': 'fil-PH',
      'ur': 'ur-PK',
      'fa': 'fa-IR',
      'he': 'he-IL',
      'bn': 'bn-BD',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'ml': 'ml-IN',
      'kn': 'kn-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'or': 'or-IN',
      'as': 'as-IN',
      'ne': 'ne-NP',
      'si': 'si-LK',
      'my': 'my-MM',
      'km': 'km-KH',
      'lo': 'lo-LA',
      'ka': 'ka-GE',
      'am': 'am-ET',
      'sw': 'sw-KE',
      'zu': 'zu-ZA',
      'af': 'af-ZA',
      'mg': 'mg-MG',
      'yo': 'yo-NG',
      'ig': 'ig-NG',
      'ha': 'ha-NG',
      'ny': 'ny-MW'
    };

    const webSpeechCode = langMap[languageCode] || languageCode;

    if (this.recognition) {
      this.recognition.lang = webSpeechCode;
    }

    // Set current language
    if (language) {
      this._currentLanguage = language;
    }

    console.log(`Language set to: ${webSpeechCode} (${languageCode})`);
  }

  private async detectLanguage(results: SpeechRecognitionResult[]): Promise<void> {
    if (!this.config.autoLanguageDetection) return;

    // Simple language detection based on character patterns
    // In production, this would use more sophisticated language detection
    const text = results.map(r => r.transcript).join(' ').toLowerCase();

    const languagePatterns: { [key: string]: RegExp[] } = {
      'en': [/the/, /and/, /you/, /have/],
      'es': [/el/, /la/, /que/, /de/],
      'fr': [/le/, /la/, /et/, /que/],
      'de': [/der/, /die/, /und/, /das/],
      'it': [/il/, /la/, /e/, /che/],
      'pt': [/o/, /a/, /e/, /de/],
      'ru': [/и/, /в/, /не/, /на/],
      'ja': [/の/, /は/, /を/, /に/],
      'ko': [/이/, /가/, /을/, /를/],
      'zh-CN': [/的/, /是/, /在/, /有/],
      'ar': [/ال/, /في/, /من/, /إلى/],
      'hi': [/का/, /में/, /को/, /से/]
    };

    let bestMatch = 'en';
    let bestScore = 0;

    for (const [langCode, patterns] of Object.entries(languagePatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = langCode;
      }
    }

    if (bestScore > 0 && bestMatch !== this.currentLanguage?.code) {
      // Auto-switch language
      await this.setLanguage(bestMatch);
      this.emit('language:detected', { code: bestMatch } as Language);
    }
  }

  private getCurrentAudioLevel(): number {
    return this.audioMetrics.volume;
  }

  private getNoiseLevel(): number {
    // Calculate noise level as inverse of signal-to-noise ratio
    const snr = this.audioMetrics.signalToNoiseRatio;
    return Math.max(0, Math.min(1, 1 - (snr / 30))); // Normalize to 0-1 range
  }

  private calculateSignalQuality(alternatives: Alternative[]): number {
    // Calculate signal quality based on alternative consistency
    if (alternatives.length < 2) return 1.0;

    let consistencyScore = 0;
    const reference = alternatives[0].transcript.toLowerCase();

    for (let i = 1; i < alternatives.length; i++) {
      const similarity = this.calculateTextSimilarity(reference, alternatives[i].transcript.toLowerCase());
      consistencyScore += similarity;
    }

    return consistencyScore / (alternatives.length - 1);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple character-based similarity
    if (text1 === text2) return 1.0;
    
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  startListening(): Promise<void> {
    if (!this.recognition) {
      throw new RecognitionError(
        'Web Speech API not initialized',
        ErrorCode.NOT_SUPPORTED,
        ModelType.WEB_SPEECH_API
      );
    }

    if (this.isListening) {
      console.warn('Already listening');
      return Promise.resolve();
    }

    try {
      this.recognition.start();
      return Promise.resolve();
    } catch (error) {
      throw new RecognitionError(
        `Failed to start recognition: ${error}`,
        ErrorCode.AUDIO_PROCESSING_ERROR,
        ModelType.WEB_SPEECH_API
      );
    }
  }

  stopListening(): Promise<void> {
    if (!this.recognition) {
      return Promise.resolve();
    }

    if (!this.isListening) {
      console.warn('Not currently listening');
      return Promise.resolve();
    }

    try {
      this.recognition.stop();
      return Promise.resolve();
    } catch (error) {
      throw new RecognitionError(
        `Failed to stop recognition: ${error}`,
        ErrorCode.AUDIO_PROCESSING_ERROR,
        ModelType.WEB_SPEECH_API
      );
    }
  }

  abortListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  getCurrentLanguage(): Language | null {
    return this._currentLanguage;
  }

  setCurrentLanguage(language: Language | null): void {
    this._currentLanguage = language;
  }

  getResults(): SpeechRecognitionResult[] {
    return [...this.resultBuffer];
  }

  clearResults(): void {
    this.resultBuffer = [];
  }

  getCapabilities(): {
    offlineCapable: boolean;
    realTimeCapable: boolean;
    accuracy: QualityLevel;
    supportedLanguages: number;
  } {
    return {
      offlineCapable: false, // Web Speech API requires internet
      realTimeCapable: true,
      accuracy: QualityLevel.EXCELLENT,
      supportedLanguages: 60 // Approximate number of Web Speech API languages
    };
  }

  dispose(): void {
    this.abortListening();
    this.recognition = null;
    this.resultBuffer = [];
    
    // Clean up audio resources
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.removeAllListeners();
  }
}

// Extended interface for SpeechRecognitionEvent
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
  timeStamp: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}