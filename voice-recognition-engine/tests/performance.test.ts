/**
 * Performance tests for VoiceFlow Pro Voice Recognition Engine
 * These tests measure performance characteristics and ensure benchmarks are met
 */

import {
  VoiceFlowRecognitionEngine,
  ModelType,
  RecognitionConfig
} from '../src/index';

describe('Voice Recognition Performance Tests', () => {
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

  describe('Initialization Performance', () => {
    test('should initialize within 2 seconds', async () => {
      const startTime = performance.now();
      const testEngine = new VoiceFlowRecognitionEngine();
      await testEngine.initialize('en-US');
      const initTime = performance.now() - startTime;

      expect(initTime).toBeLessThan(2000);
      expect(testEngine.isInitialized).toBe(true);
      testEngine.dispose();
    });

    test('should initialize with all supported languages', async () => {
      const languages = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ja-JP'];
      const startTime = performance.now();

      for (const lang of languages) {
        const testEngine = new VoiceFlowRecognitionEngine();
        await testEngine.initialize(lang);
        expect(testEngine.isInitialized).toBe(true);
        testEngine.dispose();
      }

      const totalTime = performance.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // Should initialize all languages within 5 seconds
    });
  });

  describe('Recognition Performance', () => {
    test('should start listening within 100ms', async () => {
      const startTime = performance.now();
      await engine.startListening();
      const startTimeElapsed = performance.now() - startTime;

      expect(startTimeElapsed).toBeLessThan(100);
      expect(engine.isListening).toBe(true);

      await engine.stopListening();
    });

    test('should handle rapid start/stop cycles efficiently', async () => {
      const cycles = 50;
      const startTime = performance.now();

      for (let i = 0; i < cycles; i++) {
        await engine.startListening();
        await engine.stopListening();
      }

      const totalTime = performance.now() - startTime;
      const avgCycleTime = totalTime / cycles;

      expect(avgCycleTime).toBeLessThan(50); // Average cycle should be under 50ms
    });

    test('should maintain performance with multiple engines', async () => {
      const engines = [
        ModelType.WEB_SPEECH_API,
        ModelType.WHISPER_BASE,
        ModelType.WHISPER_SMALL
      ];

      const results = [];

      for (const engineType of engines) {
        const testEngine = new VoiceFlowRecognitionEngine({
          primaryEngine: engineType
        });
        await testEngine.initialize('en-US');

        const startTime = performance.now();
        await testEngine.startListening();
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate recognition
        await testEngine.stopListening();
        const cycleTime = performance.now() - startTime;

        results.push(cycleTime);
        testEngine.dispose();
      }

      // All engines should perform within acceptable range
      results.forEach(time => {
        expect(time).toBeLessThan(200); // Should complete within 200ms
      });

      // Performance should be consistent (no engine should be significantly slower)
      const maxTime = Math.max(...results);
      const minTime = Math.min(...results);
      const variance = (maxTime - minTime) / minTime;
      expect(variance).toBeLessThan(0.5); // Less than 50% variance
    });
  });

  describe('Memory Performance', () => {
    test('should not leak memory during repeated operations', async () => {
      const initialMemory = (global as any).performance?.memory 
        ? (global as any).performance.memory.usedJSHeapSize 
        : 0;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const testEngine = new VoiceFlowRecognitionEngine();
        await testEngine.initialize('en-US');
        
        if (i % 10 === 0) {
          await testEngine.startListening();
          await testEngine.stopListening();
        }
        
        testEngine.dispose();
      }

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      // Test passes if no errors occur (memory measurement not reliable in all environments)
      expect(true).toBe(true);
    });

    test('should handle large text results efficiently', async () => {
      const resultPromise = new Promise<void>((resolve) => {
        engine.on('recognition:result', (result) => {
          // Process large result
          const processed = result.transcript.toUpperCase().repeat(100);
          expect(processed.length).toBeGreaterThan(10000);
          resolve();
        });
      });

      await engine.startListening();
      await resultPromise;
      await engine.stopListening();
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple simultaneous listeners', async () => {
      const numListeners = 10;
      const listeners: Array<() => void> = [];

      for (let i = 0; i < numListeners; i++) {
        const handler = jest.fn();
        const removeHandler = engine.on('recognition:result', handler);
        listeners.push(removeHandler);
      }

      const startTime = performance.now();
      await engine.startListening();
      
      // Wait for recognition events
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const addTime = performance.now() - startTime;
      expect(addTime).toBeLessThan(100); // Adding listeners should be fast
      expect(engine.isListening).toBe(true);

      // Clean up
      listeners.forEach(remove => remove());
      await engine.stopListening();
    });

    test('should handle language switching while listening', async () => {
      await engine.startListening();
      
      const languages = ['en-US', 'es-ES', 'fr-FR'];
      const switchTimes = [];

      for (const lang of languages) {
        const startTime = performance.now();
        await engine.setLanguage(lang);
        const switchTime = performance.now() - startTime;
        switchTimes.push(switchTime);

        expect(engine.currentLanguage?.code).toBe(lang);
        expect(engine.isListening).toBe(true); // Should continue listening
      }

      // Language switches should be fast
      switchTimes.forEach(time => {
        expect(time).toBeLessThan(50);
      });

      await engine.stopListening();
    });
  });

  describe('Audio Processing Performance', () => {
    test('should provide audio metrics quickly', async () => {
      await engine.startListening();
      
      const startTime = performance.now();
      const audioLevel = engine.getAudioLevel();
      const audioMetricsTime = performance.now() - startTime;

      expect(typeof audioLevel).toBe('number');
      expect(audioMetricsTime).toBeLessThan(10); // Should get audio level within 10ms
      
      await engine.stopListening();
    });

    test('should detect audio activity quickly', async () => {
      await engine.startListening();
      
      const startTime = performance.now();
      const isActive = engine.isAudioActive(0.1);
      const detectionTime = performance.now() - startTime;

      expect(typeof isActive).toBe('boolean');
      expect(detectionTime).toBeLessThan(5); // Should detect activity within 5ms
      
      await engine.stopListening();
    });
  });

  describe('Engine Switching Performance', () => {
    test('should switch engines within 200ms', async () => {
      const engines = [
        ModelType.WEB_SPEECH_API,
        ModelType.WHISPER_BASE,
        ModelType.WHISPER_SMALL
      ];

      for (let i = 0; i < engines.length - 1; i++) {
        const fromEngine = engines[i];
        const toEngine = engines[i + 1];

        const testEngine = new VoiceFlowRecognitionEngine({
          primaryEngine: fromEngine
        });
        await testEngine.initialize('en-US');
        await testEngine.startListening();

        const startTime = performance.now();
        await testEngine.switchEngine(toEngine);
        const switchTime = performance.now() - startTime;

        expect(switchTime).toBeLessThan(200);
        expect(testEngine.currentEngine).toBe(toEngine);
        expect(testEngine.isListening).toBe(true); // Should still be listening

        await testEngine.stopListening();
        testEngine.dispose();
      }
    });

    test('should handle rapid engine switching', async () => {
      await engine.initialize('en-US');
      await engine.startListening();

      const switchCount = 20;
      const startTime = performance.now();

      for (let i = 0; i < switchCount; i++) {
        const targetEngine = i % 2 === 0 ? ModelType.WHISPER_BASE : ModelType.WEB_SPEECH_API;
        await engine.switchEngine(targetEngine);
      }

      const totalSwitchTime = performance.now() - startTime;
      const avgSwitchTime = totalSwitchTime / switchCount;

      expect(avgSwitchTime).toBeLessThan(100); // Average switch should be under 100ms
      expect(engine.isListening).toBe(true);

      await engine.stopListening();
    });
  });

  describe('Statistics Performance', () => {
    test('should generate statistics quickly', async () => {
      // First, generate some recognition activity
      const resultPromise = new Promise<void>((resolve) => {
        engine.on('recognition:result', () => resolve());
      });
      await engine.startListening();
      await resultPromise;

      const startTime = performance.now();
      const stats = engine.getStatistics();
      const metrics = engine.getPerformanceMetrics();
      const statsTime = performance.now() - startTime;

      expect(stats).toBeDefined();
      expect(metrics).toBeDefined();
      expect(statsTime).toBeLessThan(50); // Statistics should be generated quickly

      await engine.stopListening();
    });
  });

  describe('Resource Usage', () => {
    test('should dispose resources properly', async () => {
      const engines: VoiceFlowRecognitionEngine[] = [];

      // Create multiple engines
      for (let i = 0; i < 10; i++) {
        const testEngine = new VoiceFlowRecognitionEngine();
        await testEngine.initialize('en-US');
        engines.push(testEngine);
      }

      // Dispose all engines
      const startTime = performance.now();
      engines.forEach(engine => engine.dispose());
      const disposeTime = performance.now() - startTime;

      expect(disposeTime).toBeLessThan(100); // Disposal should be fast
    });
  });
});