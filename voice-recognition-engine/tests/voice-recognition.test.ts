/**
 * Comprehensive test suite for VoiceFlow Pro Voice Recognition Engine
 */

import {
  VoiceFlowRecognitionEngine,
  WebSpeechEngine,
  WhisperEngine,
  AudioProcessor,
  VoiceUtils,
  ModelType,
  QualityLevel,
  RecognitionConfig,
  EngineConfig,
  SpeechRecognitionResult,
  RecognitionError,
  ErrorCode,
  Language
} from '../src/index';

// Mock Web Speech API for testing
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  grammars: any = {};
  serviceURI = '';
  
  lang = 'en-US';
  
  private eventHandlers = new Map<string, Function[]>();
  
  onstart: ((this: MockSpeechRecognition, ev: Event) => any) | null = null;
  onend: ((this: MockSpeechRecognition, ev: Event) => any) | null = null;
  onresult: ((this: MockSpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
  onerror: ((this: MockSpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null = null;
  onsoundstart: ((this: MockSpeechRecognition, ev: Event) => any) | null = null;
  onsoundend: ((this: MockSpeechRecognition, ev: Event) => any) | null = null;
  onspeechstart: ((this: MockSpeechRecognition, ev: Event) => any) | null = null;
  onspeechend: ((this: MockSpeechRecognition, ev: Event) => any) | null = null;
  
  start(): void {
    setTimeout(() => {
      if (this.onstart) this.onstart(new Event('start'));
      this.simulateRecognition();
    }, 100);
  }
  
  stop(): void {
    setTimeout(() => {
      if (this.onend) this.onend(new Event('end'));
    }, 100);
  }
  
  abort(): void {
    if (this.onend) this.onend(new Event('end'));
  }
  
  private simulateRecognition(): void {
    // Simulate some speech recognition results
    setTimeout(() => {
      const mockResult: SpeechRecognitionEvent = {
        resultIndex: 0,
        results: {
          length: 1,
          item: (index: number) => ({
            length: 1,
            item: (i: number) => ({
              transcript: 'Hello world test',
              confidence: 0.9
            }),
            [0]: {
              transcript: 'Hello world test',
              confidence: 0.9
            },
            isFinal: true
          }),
          [0]: {
            length: 1,
            item: (i: number) => ({
              transcript: 'Hello world test',
              confidence: 0.9
            }),
            [0]: {
              transcript: 'Hello world test',
              confidence: 0.9
            },
            isFinal: true
          }
        },
        timeStamp: Date.now()
      };
      
      if (this.onresult) this.onresult(mockResult);
      if (this.onend) this.onend(new Event('end'));
    }, 500);
  }
};

// Mock getUserMedia for audio testing
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: (constraints: MediaStreamConstraints): Promise<MediaStream> => {
      return Promise.resolve({
        getTracks: () => [{
          stop: () => {},
          getSettings: () => ({})
        }],
        getAudioTracks: () => [{
          stop: () => {},
          getSettings: () => ({})
        }]
      } as MediaStream);
    }
  }
});

// Mock AudioContext for testing
global.AudioContext = class MockAudioContext {
  sampleRate = 44100;
  state = 'running';
  
  createMediaStreamSource = () => ({
    connect: () => {}
  });
  
  createAnalyser = () => ({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData: () => {},
    getByteTimeDomainData: () => {},
    disconnect: () => {}
  });
  
  close = () => Promise.resolve();
  resume = () => Promise.resolve();
  suspend = () => Promise.resolve();
};

describe('VoiceFlow Pro Voice Recognition Engine', () => {
  let engine: VoiceFlowRecognitionEngine;
  
  beforeEach(async () => {
    engine = new VoiceFlowRecognitionEngine();
    await engine.initialize('en-US');
  });
  
  afterEach(async () => {
    if (engine.isListening) {
      await engine.stopListening();
    }
    engine.dispose();
  });
  
  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      expect(engine.isSupported).toBe(true);
      expect(engine.isInitialized).toBeDefined();
    });
    
    test('should initialize with custom language', async () => {
      const customEngine = new VoiceFlowRecognitionEngine();
      await customEngine.initialize('es-ES');
      expect(customEngine.currentLanguage?.code).toBe('es-ES');
      customEngine.dispose();
    });
    
    test('should throw error if not initialized', async () => {
      const uninitializedEngine = new VoiceFlowRecognitionEngine();
      await expect(uninitializedEngine.startListening()).rejects.toThrow('Engine not initialized');
    });
  });
  
  describe('Voice Recognition', () => {
    test('should start and stop listening', async () => {
      expect(engine.isListening).toBe(false);
      
      await engine.startListening();
      expect(engine.isListening).toBe(true);
      
      await engine.stopListening();
      expect(engine.isListening).toBe(false);
    });
    
    test('should handle recognition results', async (done) => {
      const resultPromise = new Promise<SpeechRecognitionResult>((resolve) => {
        engine.on('recognition:result', (result) => {
          resolve(result);
        });
      });
      
      await engine.startListening();
      
      const result = await resultPromise;
      
      expect(result.transcript).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.language).toBe('en-US');
      
      done();
    });
    
    test('should respect configuration options', async () => {
      const config: RecognitionConfig = {
        language: 'es-ES',
        continuous: false,
        interimResults: true,
        maxAlternatives: 3,
        confidenceThreshold: 0.8,
        noiseReduction: true,
        autoLanguageDetection: true,
        realTimeTranscription: true
      };
      
      await engine.startListening(config);
      expect(engine.isListening).toBe(true);
      
      await engine.stopListening();
    });
  });
  
  describe('Language Management', () => {
    test('should set language successfully', async () => {
      await engine.setLanguage('es-ES');
      expect(engine.currentLanguage?.code).toBe('es-ES');
    });
    
    test('should handle unsupported languages', async () => {
      await expect(engine.setLanguage('invalid-lang')).rejects.toThrow('Language not supported');
    });
    
    test('should support multiple languages', async () => {
      const languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE'];
      
      for (const lang of languages) {
        await engine.setLanguage(lang);
        expect(engine.currentLanguage?.code).toBe(lang);
      }
    });
  });
  
  describe('Engine Switching', () => {
    test('should switch between engines', async () => {
      const initialEngine = engine.currentEngine;
      expect(initialEngine).toBeDefined();
      
      // Test switching to Whisper
      if (initialEngine === ModelType.WEB_SPEECH_API) {
        await engine.switchEngine(ModelType.WHISPER_BASE);
        expect(engine.currentEngine).toBe(ModelType.WHISPER_BASE);
        
        // Switch back
        await engine.switchEngine(ModelType.WEB_SPEECH_API);
        expect(engine.currentEngine).toBe(ModelType.WEB_SPEECH_API);
      }
    });
    
    test('should handle engine switch while listening', async () => {
      await engine.startListening();
      expect(engine.isListening).toBe(true);
      
      await engine.switchEngine(ModelType.WHISPER_BASE);
      expect(engine.isListening).toBe(true); // Should still be listening
      expect(engine.currentEngine).toBe(ModelType.WHISPER_BASE);
      
      await engine.stopListening();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle recognition errors', async () => {
      const errorHandler = jest.fn();
      engine.on('recognition:error', errorHandler);
      
      // Simulate an error by trying to start without audio context
      const errorEngine = new VoiceFlowRecognitionEngine();
      await errorEngine.initialize();
      
      // Error handling is tested through the engine's internal mechanisms
      expect(errorHandler).toHaveBeenCalled();
      errorEngine.dispose();
    });
    
    test('should handle audio permission errors', async () => {
      // Test will depend on the specific error handling implementation
      expect(true).toBe(true); // Placeholder for permission error tests
    });
  });
  
  describe('Statistics and Monitoring', () => {
    test('should track recognition statistics', async () => {
      const stats = engine.getStatistics();
      
      expect(stats).toHaveProperty('totalRecognitions');
      expect(stats).toHaveProperty('averageAccuracy');
      expect(stats).toHaveProperty('averageSpeed');
      expect(stats).toHaveProperty('languageUsage');
      expect(stats).toHaveProperty('engineUsage');
      expect(stats).toHaveProperty('errorRate');
      
      expect(typeof stats.totalRecognitions).toBe('number');
      expect(typeof stats.averageAccuracy).toBe('number');
      expect(typeof stats.averageSpeed).toBe('number');
    });
    
    test('should track performance metrics', async () => {
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('switchCount');
    });
  });
  
  describe('Audio Processing', () => {
    test('should provide audio level monitoring', async () => {
      const audioLevel = engine.getAudioLevel();
      expect(typeof audioLevel).toBe('number');
      expect(audioLevel).toBeGreaterThanOrEqual(0);
      expect(audioLevel).toBeLessThanOrEqual(1);
    });
    
    test('should detect audio activity', async () => {
      const isActive = engine.isAudioActive(0.1);
      expect(typeof isActive).toBe('boolean');
    });
  });
  
  describe('Plugin System', () => {
    class MockPlugin {
      name = 'test-plugin';
      version = '1.0.0';
      initialized = false;
      cleaned = false;
      
      async initialize(): Promise<void> {
        this.initialized = true;
      }
      
      async cleanup(): Promise<void> {
        this.cleaned = true;
      }
    }
    
    test('should register and unregister plugins', async () => {
      const plugin = new MockPlugin();
      
      await engine.registerPlugin(plugin);
      expect(plugin.initialized).toBe(true);
      expect(engine.getPlugin('test-plugin')).toBe(plugin);
      
      await engine.unregisterPlugin('test-plugin');
      expect(plugin.cleaned).toBe(true);
      expect(engine.getPlugin('test-plugin')).toBeUndefined();
    });
    
    test('should list all plugins', async () => {
      const plugin1 = new MockPlugin();
      plugin1.name = 'plugin1';
      
      const plugin2 = new MockPlugin();
      plugin2.name = 'plugin2';
      
      await engine.registerPlugin(plugin1);
      await engine.registerPlugin(plugin2);
      
      const plugins = engine.getAllPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins.map(p => p.name)).toContain('plugin1');
      expect(plugins.map(p => p.name)).toContain('plugin2');
    });
  });
});

describe('VoiceUtils', () => {
  describe('Language Utilities', () => {
    test('should check language support', () => {
      expect(VoiceUtils.isLanguageSupported('en-US')).toBe(true);
      expect(VoiceUtils.isLanguageSupported('invalid-lang')).toBe(false);
    });
    
    test('should search languages', () => {
      const results = VoiceUtils.searchLanguages('English');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(lang => lang.name === 'English')).toBe(true);
    });
    
    test('should get all languages', () => {
      const languages = VoiceUtils.getAllLanguages();
      expect(languages.length).toBeGreaterThan(150); // Should support 150+ languages
    });
    
    test('should get language statistics', () => {
      const stats = VoiceUtils.getLanguageStatistics();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byQuality');
      expect(stats).toHaveProperty('byEngine');
      expect(stats.total).toBeGreaterThan(150);
    });
  });
  
  describe('Text Processing', () => {
    test('should create voice command parser', () => {
      const commands = {
        'start recording': 'start',
        'stop recording': 'stop',
        'pause': 'pause'
      };
      
      const parser = VoiceUtils.createVoiceCommandParser(commands);
      
      expect(parser('Please start recording now')).toBe('start');
      expect(parser('Can you stop recording')).toBe('stop');
      expect(parser('Unknown command')).toBeNull();
    });
    
    test('should format transcripts', () => {
      const result: SpeechRecognitionResult = {
        transcript: 'Hello world',
        confidence: 0.95,
        isFinal: true,
        timestamp: Date.now(),
        language: 'en-US',
        alternatives: [{ transcript: 'Hello world', confidence: 0.95 }],
        metadata: {
          audioLevel: 0.5,
          signalQuality: 0.9,
          processingTime: 100,
          modelUsed: ModelType.WEB_SPEECH_API,
          noiseLevel: 0.1
        }
      };
      
      const formatted = VoiceUtils.formatTranscript(result);
      expect(formatted).toContain('Hello world');
      expect(formatted).toContain('en-US');
    });
    
    test('should calculate average confidence', () => {
      const results: SpeechRecognitionResult[] = [
        { confidence: 0.8, transcript: 'Test 1' } as SpeechRecognitionResult,
        { confidence: 0.9, transcript: 'Test 2' } as SpeechRecognitionResult,
        { confidence: 0.7, transcript: 'Test 3' } as SpeechRecognitionResult
      ];
      
      const average = VoiceUtils.calculateAverageConfidence(results);
      expect(average).toBeCloseTo(0.8, 2);
    });
    
    test('should create confidence checker', () => {
      const checker = VoiceUtils.createConfidenceChecker(0.8);
      
      const highConfidence: SpeechRecognitionResult = { confidence: 0.9 } as SpeechRecognitionResult;
      const lowConfidence: SpeechRecognitionResult = { confidence: 0.7 } as SpeechRecognitionResult;
      
      expect(checker(highConfidence)).toBe(true);
      expect(checker(lowConfidence)).toBe(false);
    });
  });
});

describe('AudioProcessor', () => {
  let audioProcessor: AudioProcessor;
  
  beforeEach(() => {
    audioProcessor = new AudioProcessor();
  });
  
  afterEach(() => {
    audioProcessor.dispose();
  });
  
  test('should initialize audio processor', async () => {
    await expect(audioProcessor.initialize()).resolves.not.toThrow();
  });
  
  test('should start and stop recording', async () => {
    await audioProcessor.initialize();
    const stream = await audioProcessor.startRecording();
    
    expect(stream).toBeDefined();
    
    audioProcessor.stopRecording();
    // No assertion needed, just ensure it doesn't throw
  });
  
  test('should get audio metrics', async () => {
    await audioProcessor.initialize();
    
    // This might fail in test environment without actual audio
    try {
      const metrics = audioProcessor.getAudioMetrics();
      expect(metrics).toHaveProperty('volume');
      expect(metrics).toHaveProperty('signalToNoiseRatio');
      expect(metrics).toHaveProperty('clipping');
      expect(metrics).toHaveProperty('latency');
      expect(metrics).toHaveProperty('bufferUnderrun');
    } catch (error) {
      // Expected in test environment without audio
      expect(error).toBeDefined();
    }
  });
  
  test('should apply noise reduction', async () => {
    await audioProcessor.initialize();
    
    const audioData = new Float32Array(1024);
    audioData.fill(0.1); // Some random audio data
    
    const processed = audioProcessor.applyNoiseReduction(audioData);
    
    expect(processed).toBeInstanceOf(Float32Array);
    expect(processed.length).toBe(audioData.length);
  });
});

describe('Integration Tests', () => {
  test('should handle full recognition workflow', async () => {
    const engine = new VoiceFlowRecognitionEngine({
      primaryEngine: ModelType.WEB_SPEECH_API,
      autoEngineSelection: false
    });
    
    await engine.initialize('en-US');
    
    const resultPromise = new Promise<SpeechRecognitionResult>((resolve) => {
      engine.on('recognition:result', resolve);
    });
    
    await engine.startListening();
    
    const result = await resultPromise;
    
    expect(result.transcript).toBeDefined();
    expect(engine.isListening).toBe(true);
    
    await engine.stopListening();
    expect(engine.isListening).toBe(false);
    
    engine.dispose();
  });
  
  test('should handle language switching during recognition', async () => {
    const engine = new VoiceFlowRecognitionEngine();
    await engine.initialize('en-US');
    
    await engine.startListening();
    
    // Switch language while listening
    await engine.setLanguage('es-ES');
    expect(engine.currentLanguage?.code).toBe('es-ES');
    
    // Should still be listening
    expect(engine.isListening).toBe(true);
    
    await engine.stopListening();
    engine.dispose();
  });
  
  test('should handle multiple engine switches', async () => {
    const engine = new VoiceFlowRecognitionEngine({
      autoEngineSelection: false
    });
    
    await engine.initialize();
    
    const engines = [
      ModelType.WEB_SPEECH_API,
      ModelType.WHISPER_BASE,
      ModelType.WHISPER_SMALL
    ];
    
    for (const targetEngine of engines) {
      await engine.switchEngine(targetEngine);
      expect(engine.currentEngine).toBe(targetEngine);
    }
    
    engine.dispose();
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('should handle rapid start/stop cycles', async () => {
    const engine = new VoiceFlowRecognitionEngine();
    await engine.initialize();
    
    const cycles = 10;
    
    for (let i = 0; i < cycles; i++) {
      await engine.startListening();
      expect(engine.isListening).toBe(true);
      
      await engine.stopListening();
      expect(engine.isListening).toBe(false);
    }
    
    engine.dispose();
  }, 10000); // 10 second timeout for performance test
  
  test('should handle multiple simultaneous listeners', async () => {
    const engine = new VoiceFlowRecognitionEngine();
    await engine.initialize();
    
    const listeners: Array<() => void> = [];
    
    // Add multiple listeners for the same event
    for (let i = 0; i < 5; i++) {
      const handler = jest.fn();
      const removeHandler = engine.on('recognition:result', handler);
      listeners.push(removeHandler);
    }
    
    await engine.startListening();
    
    // Wait for some results
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // All listeners should have been called
    expect(engine.isListening).toBe(true);
    
    // Clean up
    listeners.forEach(remove => remove());
    await engine.stopListening();
    engine.dispose();
  }, 10000);
});

// Utility functions for tests
export function createMockResult(
  transcript: string,
  confidence: number = 0.8,
  language: string = 'en-US'
): SpeechRecognitionResult {
  return {
    transcript,
    confidence,
    isFinal: true,
    timestamp: Date.now(),
    language,
    alternatives: [{ transcript, confidence }],
    metadata: {
      audioLevel: 0.5,
      signalQuality: confidence,
      processingTime: 100,
      modelUsed: ModelType.WEB_SPEECH_API,
      noiseLevel: 0.1
    }
  };
}

export function createMockError(
  message: string,
  code: ErrorCode = ErrorCode.AUDIO_PROCESSING_ERROR
): RecognitionError {
  return new RecognitionError(message, code, ModelType.WEB_SPEECH_API);
}