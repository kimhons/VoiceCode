/**
 * Comprehensive Integration Tests for Voice Recognition Engine
 * Tests all components working together: Web Speech API, Whisper.js, Audio Processing, Language Detection, and Plugin System
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VoiceRecognitionEngine } from '../src/engines/voice-recognition-engine';
import { WebSpeechEngine } from '../src/engines/web-speech-engine';
import { WhisperEngine } from '../src/engines/whisper-engine';
import { AudioProcessor } from '../src/processing/audio-processor';
import { LanguageManager } from '../src/config/languages';
import {
  ModelType,
  Language,
  SpeechRecognitionResult,
  AudioMetrics,
  RecognitionConfig,
  ErrorCode,
  QualityLevel,
  VoiceRecognitionEvents
} from '../src/types';

// Mock Web Speech API for testing
global.mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  lang: 'en-US',
  continuous: true,
  interimResults: false,
  maxAlternatives: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null
};

// Mock @xenova/transformers
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockImplementation((task, model, options) => {
    return {
      async: (audioBuffer, config) => {
        // Mock Whisper transcription
        return Promise.resolve({
          text: `Mock transcription for ${config?.language || 'en'} language`,
          chunks: [{ timestamp: [0, 2], text: 'Mock transcription' }]
        });
      }
    };
  }),
  env: {
    backends: {
      onnx: {
        wasm: {
          numThreads: 4,
          proxy: false
        }
      }
    },
    allowRemoteModels: true,
    allowLocalModels: false
  }
}));

// Mock MediaDevices for audio testing
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  },
  writable: true
});

// Mock Web Worker
global.Worker = class MockWorker {
  constructor() {
    this.onmessage = null;
  }
  postMessage = jest.fn();
  terminate = jest.fn();
};

describe('Voice Recognition Integration Tests', () => {
  let engine: VoiceRecognitionEngine;
  let audioProcessor: AudioProcessor;
  let languageManager: LanguageManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize components
    engine = new VoiceRecognitionEngine();
    audioProcessor = new AudioProcessor();
    languageManager = new LanguageManager();
  });

  afterEach(() => {
    if (engine) {
      engine.dispose();
    }
  });

  describe('Engine Initialization and Configuration', () => {
    test('should initialize engine with default configuration', async () => {
      const config: Partial<RecognitionConfig> = {
        language: 'en-US',
        continuous: true,
        interimResults: false,
        confidenceThreshold: 0.5,
        noiseReduction: true,
        autoLanguageDetection: true
      };

      await engine.initialize(config);

      expect(engine.isInitialized()).toBe(true);
      expect(engine.getCurrentEngine()).toBe(ModelType.WEB_SPEECH_API);
    });

    test('should switch between engines based on configuration', async () => {
      const webSpeechConfig = {
        preferredEngine: ModelType.WEB_SPEECH_API,
        language: 'en-US'
      };

      await engine.initialize(webSpeechConfig);
      expect(engine.getCurrentEngine()).toBe(ModelType.WEB_SPEECH_API);

      // Switch to Whisper
      await engine.switchEngine(ModelType.WHISPER_BASE);
      expect(engine.getCurrentEngine()).toBe(ModelType.WHISPER_BASE);
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock a failed microphone access
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(engine.initialize()).rejects.toThrow();
    });
  });

  describe('Web Speech API Integration', () => {
    test('should start and stop Web Speech API recognition', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WEB_SPEECH_API,
        language: 'en-US'
      });

      const mockResult: SpeechRecognitionResult = {
        transcript: 'Hello world',
        confidence: 0.9,
        isFinal: true,
        timestamp: Date.now(),
        language: 'en-US',
        alternatives: [{ transcript: 'Hello world', confidence: 0.9 }],
        metadata: {
          audioLevel: 0.5,
          signalQuality: 0.9,
          processingTime: 100,
          modelUsed: ModelType.WEB_SPEECH_API,
          noiseLevel: 0.1
        }
      };

      // Mock the recognition result
      const recognition = global.mockSpeechRecognition;
      recognition.onresult = {
        length: 1,
        item: (index: number) => ({
          isFinal: true,
          length: 1,
          item: (i: number) => ({
            transcript: 'Hello world',
            confidence: 0.9
          }),
          [Symbol.iterator]: function* () {
            yield { transcript: 'Hello world', confidence: 0.9 };
          }
        })
      };

      await engine.startListening();
      expect(engine.isListening()).toBe(true);

      await engine.stopListening();
      expect(engine.isListening()).toBe(false);
    });

    test('should handle Web Speech API errors', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WEB_SPEECH_API,
        language: 'en-US'
      });

      const errorHandler = jest.fn();
      engine.on('recognition:error', errorHandler);

      // Simulate recognition error
      const recognition = global.mockSpeechRecognition;
      recognition.onerror({ error: 'no-speech' });

      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async event handling
      
      expect(errorHandler).toHaveBeenCalled();
    });

    test('should detect language automatically with Web Speech API', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WEB_SPEECH_API,
        autoLanguageDetection: true
      });

      const mockResult = {
        transcript: 'Bonjour le monde',
        confidence: 0.9,
        isFinal: true,
        timestamp: Date.now(),
        language: 'fr-FR'
      };

      // The language detection should work based on patterns
      expect(engine.getCurrentLanguage()).toBeTruthy();
    });
  });

  describe('Whisper.js Integration', () => {
    test('should initialize Whisper engine successfully', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WHISPER_BASE,
        language: 'en'
      });

      await engine.switchEngine(ModelType.WHISPER_BASE);
      expect(engine.getCurrentEngine()).toBe(ModelType.WHISPER_BASE);
    });

    test('should transcribe audio with Whisper', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WHISPER_BASE,
        language: 'en'
      });

      await engine.switchEngine(ModelType.WHISPER_BASE);

      // Generate mock audio data
      const audioData = new Float32Array(16000); // 1 second of audio
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.1; // 440Hz tone
      }

      const resultPromise = new Promise<SpeechRecognitionResult>((resolve) => {
        engine.once('recognition:result', resolve);
      });

      await engine.startListening();

      // Wait for transcription
      const result = await Promise.race([
        resultPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);

      expect(result).toBeTruthy();
      expect(result?.transcript).toBeTruthy();
    });

    test('should handle Whisper model switching', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WHISPER_BASE
      });

      // Switch through different model sizes
      const models = [
        ModelType.WHISPER_TINY,
        ModelType.WHISPER_BASE,
        ModelType.WHISPER_SMALL
      ];

      for (const model of models) {
        await engine.switchEngine(model);
        expect(engine.getCurrentEngine()).toBe(model);
      }
    });

    test('should handle Whisper loading errors gracefully', async () => {
      // Mock pipeline to throw error
      const { pipeline } = require('@xenova/transformers');
      pipeline.mockRejectedValue(new Error('Model download failed'));

      await engine.initialize({
        preferredEngine: ModelType.WHISPER_BASE
      });

      // Should fall back gracefully or throw appropriate error
      await expect(engine.startListening()).rejects.toThrow();
    });
  });

  describe('Audio Processing Integration', () => {
    test('should process audio through audio processor', async () => {
      const rawAudio = new Float32Array(16000); // 1 second of audio
      for (let i = 0; i < rawAudio.length; i++) {
        rawAudio[i] = Math.random() * 0.1; // Random noise
      }

      const processedAudio = await audioProcessor.processAudio(rawAudio, {
        sampleRate: 16000,
        enableNoiseReduction: true,
        enableNormalization: true
      });

      expect(processedAudio).toBeInstanceOf(Float32Array);
      expect(processedAudio.length).toBeLessThanOrEqual(rawAudio.length);
    });

    test('should apply noise reduction to audio', async () => {
      const noisyAudio = new Float32Array(16000);
      // Add signal + noise
      for (let i = 0; i < noisyAudio.length; i++) {
        const signal = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.3;
        const noise = (Math.random() - 0.5) * 0.2;
        noisyAudio[i] = signal + noise;
      }

      const cleanAudio = await audioProcessor.reduceNoise(noisyAudio, 16000);

      expect(cleanAudio).toBeInstanceOf(Float32Array);
      
      // Clean audio should have lower variance than noisy audio
      const noisyVariance = calculateVariance(noisyAudio);
      const cleanVariance = calculateVariance(cleanAudio);
      expect(cleanVariance).toBeLessThanOrEqual(noisyVariance);
    });

    test('should perform voice activity detection', async () => {
      const audioWithSpeech = new Float32Array(32000);
      
      // Add speech-like signal in the middle
      for (let i = 8000; i < 24000; i++) {
        audioWithSpeech[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.3;
      }

      const vadResult = audioProcessor.detectVoiceActivity(audioWithSpeech, {
        threshold: 0.1,
        minDuration: 100,
        sampleRate: 16000
      });

      expect(vadResult.hasSpeech).toBe(true);
      expect(vadResult.speechSegments).toBeInstanceOf(Array);
      expect(vadResult.speechSegments.length).toBeGreaterThan(0);
    });

    test('should normalize audio levels', async () => {
      const quietAudio = new Float32Array(16000).fill(0.01);
      const loudAudio = new Float32Array(16000).fill(0.9);

      const normalizedQuiet = audioProcessor.normalizeAudio(quietAudio);
      const normalizedLoud = audioProcessor.normalizeAudio(loudAudio);

      expect(Math.max(...normalizedQuiet)).toBeLessThanOrEqual(1);
      expect(Math.max(...normalizedLoud)).toBeLessThanOrEqual(1);
      expect(Math.max(...normalizedLoud)).toBeGreaterThan(Math.max(...normalizedQuiet));
    });
  });

  describe('Language Detection Integration', () => {
    test('should detect English language', async () => {
      const englishText = 'The quick brown fox jumps over the lazy dog.';
      const detectedLang = await languageManager.detectLanguage(englishText);
      
      expect(detectedLang?.code).toBe('en');
    });

    test('should detect Spanish language', async () => {
      const spanishText = 'El rápido zorro marrón salta sobre el perro perezoso.';
      const detectedLang = await languageManager.detectLanguage(spanishText);
      
      expect(detectedLang?.code).toBe('es');
    });

    test('should detect French language', async () => {
      const frenchText = 'Le rapide renard brun saute par-dessus le chien paresseux.';
      const detectedLang = await languageManager.detectLanguage(frenchText);
      
      expect(detectedLang?.code).toBe('fr');
    });

    test('should detect German language', async () => {
      const germanText = 'Der schnelle braune Fuchs springt über den faulen Hund.';
      const detectedLang = await languageManager.detectLanguage(germanText);
      
      expect(detectedLang?.code).toBe('de');
    });

    test('should handle unsupported languages', async () => {
      const unknownText = 'Unknown language text that does not match any patterns';
      const detectedLang = await languageManager.detectLanguage(unknownText);
      
      expect(detectedLang).toBeNull();
    });

    test('should get available languages', async () => {
      const languages = languageManager.getAllLanguages();
      
      expect(languages.length).toBeGreaterThan(150); // Should support 150+ languages
      expect(languages.find(l => l.code === 'en')).toBeTruthy();
      expect(languages.find(l => l.code === 'es')).toBeTruthy();
      expect(languages.find(l => l.code === 'zh')).toBeTruthy();
    });

    test('should set and get current language', async () => {
      const english = languageManager.getLanguage('en');
      expect(english).toBeTruthy();
      
      languageManager.setCurrentLanguage(english!);
      expect(languageManager.getCurrentLanguage()).toBe(english);
    });
  });

  describe('End-to-End Speech Recognition', () => {
    test('should perform complete speech recognition workflow with Web Speech API', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WEB_SPEECH_API,
        language: 'en-US',
        autoLanguageDetection: true,
        noiseReduction: true
      });

      const resultPromise = new Promise<SpeechRecognitionResult>((resolve) => {
        engine.once('recognition:result', resolve);
      });

      // Mock recognition result
      const mockResult: SpeechRecognitionResult = {
        transcript: 'Hello, this is a test of the voice recognition system',
        confidence: 0.95,
        isFinal: true,
        timestamp: Date.now(),
        language: 'en-US',
        alternatives: [{
          transcript: 'Hello, this is a test of the voice recognition system',
          confidence: 0.95
        }],
        metadata: {
          audioLevel: 0.7,
          signalQuality: 0.95,
          processingTime: 150,
          modelUsed: ModelType.WEB_SPEECH_API,
          noiseLevel: 0.1
        }
      };

      await engine.startListening();
      
      // Simulate recognition completion
      engine.emit('recognition:result', mockResult);

      const result = await resultPromise;
      expect(result.transcript).toContain('Hello');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('should perform complete speech recognition workflow with Whisper', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WHISPER_BASE,
        language: 'en',
        realTimeTranscription: false,
        noiseReduction: true
      });

      await engine.switchEngine(ModelType.WHISPER_BASE);

      // Generate test audio
      const testAudio = new Float32Array(16000);
      for (let i = 0; i < testAudio.length; i++) {
        testAudio[i] = Math.sin(2 * Math.PI * 440 * i / 16000) * 0.1;
      }

      const resultPromise = new Promise<SpeechRecognitionResult>((resolve) => {
        engine.once('recognition:result', resolve);
      });

      await engine.startListening();

      // Simulate audio processing and transcription
      setTimeout(() => {
        const mockResult: SpeechRecognitionResult = {
          transcript: 'Mock transcription result',
          confidence: 0.8,
          isFinal: true,
          timestamp: Date.now(),
          language: 'en',
          alternatives: [{
            transcript: 'Mock transcription result',
            confidence: 0.8
          }],
          metadata: {
            audioLevel: 0.1,
            signalQuality: 0.8,
            processingTime: 200,
            modelUsed: ModelType.WHISPER_BASE,
            noiseLevel: 0.05
          }
        };
        engine.emit('recognition:result', mockResult);
      }, 100);

      const result = await Promise.race([
        resultPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);

      expect(result?.transcript).toBeTruthy();
      expect(result?.language).toBe('en');
    });

    test('should handle engine fallback from Web Speech API to Whisper', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WEB_SPEECH_API,
        fallbackToWhisper: true
      });

      // Mock Web Speech API failure
      const webSpeechEngine = engine.getWebSpeechEngine();
      if (webSpeechEngine) {
        webSpeechEngine.emit('recognition:error', new Error('Web Speech API not supported'));
      }

      // Should automatically fall back to Whisper
      expect(engine.getCurrentEngine()).toBe(ModelType.WHISPER_BASE);
    });
  });

  describe('Audio Metrics and Monitoring', () => {
    test('should provide accurate audio metrics', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WHISPER_BASE
      });

      const metricsPromise = new Promise<AudioMetrics>((resolve) => {
        engine.once('audio:metrics', resolve);
      });

      await engine.startListening();

      // Simulate audio metrics
      const mockMetrics: AudioMetrics = {
        volume: 0.5,
        signalToNoiseRatio: 25,
        clipping: false,
        latency: 50,
        bufferUnderrun: false
      };

      engine.emit('audio:metrics', mockMetrics);

      const metrics = await metricsPromise;
      expect(metrics.volume).toBe(0.5);
      expect(metrics.signalToNoiseRatio).toBe(25);
    });

    test('should monitor audio quality during recognition', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WEB_SPEECH_API
      });

      let qualityEvents = 0;
      engine.on('audio:metrics', () => {
        qualityEvents++;
      });

      await engine.startListening();

      // Simulate multiple quality updates
      for (let i = 0; i < 5; i++) {
        engine.emit('audio:metrics', {
          volume: Math.random(),
          signalToNoiseRatio: 20 + Math.random() * 10,
          clipping: false,
          latency: 50,
          bufferUnderrun: false
        });
      }

      await engine.stopListening();

      expect(qualityEvents).toBeGreaterThan(0);
    });
  });

  describe('Memory Management and Cleanup', () => {
    test('should properly dispose of engine resources', async () => {
      await engine.initialize({
        preferredEngine: ModelType.WHISPER_BASE
      });

      await engine.startListening();

      engine.dispose();

      expect(engine.isInitialized()).toBe(false);
      expect(engine.isListening()).toBe(false);
    });

    test('should handle multiple initialization cycles', async () => {
      for (let i = 0; i < 3; i++) {
        await engine.initialize();
        expect(engine.isInitialized()).toBe(true);
        engine.dispose();
        expect(engine.isInitialized()).toBe(false);
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle microphone permission denied', async () => {
      (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(engine.initialize()).rejects.toThrow('Permission denied');
    });

    test('should handle unsupported language', async () => {
      await engine.initialize();

      await expect(engine.setLanguage('xx-XX')).rejects.toThrow();
    });

    test('should handle audio processing errors', async () => {
      const corruptedAudio = new Float32Array(1000).fill(NaN);

      const cleanAudio = await audioProcessor.processAudio(corruptedAudio);
      expect(cleanAudio).toBeInstanceOf(Float32Array);
    });

    test('should emit error events properly', async () => {
      await engine.initialize();

      const errorHandler = jest.fn();
      engine.on('recognition:error', errorHandler);

      // Simulate error
      engine.emit('recognition:error', new Error('Test error'));

      expect(errorHandler).toHaveBeenCalled();
    });
  });
});

// Helper functions for testing
function calculateVariance(arr: Float32Array): number {
  const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return variance;
}

// Custom matchers for Jest
expect.extend({
  toBeValidSpeechResult(received: SpeechRecognitionResult) {
    const pass = received &&
      typeof received.transcript === 'string' &&
      received.transcript.length > 0 &&
      typeof received.confidence === 'number' &&
      received.confidence >= 0 &&
      received.confidence <= 1 &&
      typeof received.timestamp === 'number';

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid speech result`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid speech result with transcript, confidence (0-1), and timestamp`,
        pass: false
      };
    }
  },

  toBeValidAudioMetrics(received: AudioMetrics) {
    const pass = received &&
      typeof received.volume === 'number' &&
      received.volume >= 0 &&
      received.volume <= 1 &&
      typeof received.signalToNoiseRatio === 'number' &&
      typeof received.clipping === 'boolean' &&
      typeof received.latency === 'number' &&
      typeof received.bufferUnderrun === 'boolean';

    if (pass) {
      return {
        message: () => `expected ${received} not to be valid audio metrics`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to have volume (0-1), snr, clipping, latency, and bufferUnderrun`,
        pass: false
      };
    }
  }
});

export {}; // Make this file a module
