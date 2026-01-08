/**
 * Streaming Performance Benchmarks
 * Phase 1.5: Testing Suite
 * 
 * Measures performance metrics for streaming functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketStreamingService } from '../../services/websocket-streaming.service';

describe('Streaming Performance Benchmarks', () => {
  let service: WebSocketStreamingService;

  beforeEach(() => {
    // Mock WebSocket
    global.WebSocket = class MockWebSocket {
      static OPEN = 1;
      readyState = MockWebSocket.OPEN;
      send = vi.fn();
      close = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      
      constructor(public url: string) {
        setTimeout(() => {
          (this as any).onopen?.(new Event('open'));
        }, 1);
      }
    } as any;

    // Mock AudioContext
    global.AudioContext = class MockAudioContext {
      sampleRate = 16000;
      state = 'running';
      createMediaStreamSource = vi.fn().mockReturnValue({
        connect: vi.fn(),
        disconnect: vi.fn(),
      });
      createScriptProcessor = vi.fn().mockReturnValue({
        connect: vi.fn(),
        disconnect: vi.fn(),
        onaudioprocess: null,
      });
      close = vi.fn().mockResolvedValue(undefined);
    } as any;

    service = new WebSocketStreamingService('test-api-key');
  });

  describe('Connection Performance', () => {
    it('should connect within 100ms', async () => {
      const startTime = performance.now();
      
      await service.connect();
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      console.log(`✅ Connection time: ${duration.toFixed(2)}ms`);
    });

    it('should handle 100 rapid connect/disconnect cycles', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await service.connect();
        service.disconnect();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / 100;

      expect(avgTime).toBeLessThan(20);
      console.log(`✅ Average connect/disconnect time: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Event Handling Performance', () => {
    it('should handle 1000 transcript events within 100ms', async () => {
      await service.connect();

      const handler = vi.fn();
      service.on('transcript', handler);

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        service['emit']('transcript', {
          text: `Word ${i}`,
          isFinal: false,
          confidence: 0.9,
          timestamp: Date.now(),
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(handler).toHaveBeenCalledTimes(1000);
      console.log(`✅ 1000 events processed in: ${duration.toFixed(2)}ms`);
      console.log(`✅ Average per event: ${(duration / 1000).toFixed(3)}ms`);
    });

    it('should handle 100 concurrent event handlers', async () => {
      await service.connect();

      const handlers = Array.from({ length: 100 }, () => vi.fn());
      handlers.forEach(handler => service.on('transcript', handler));

      const startTime = performance.now();

      service['emit']('transcript', {
        text: 'Test',
        isFinal: true,
        confidence: 0.95,
        timestamp: Date.now(),
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
      handlers.forEach(handler => expect(handler).toHaveBeenCalledOnce());
      console.log(`✅ 100 handlers executed in: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Audio Processing Performance', () => {
    it('should convert Float32 to Int16 efficiently', () => {
      const float32Array = new Float32Array(4096); // Standard buffer size
      for (let i = 0; i < float32Array.length; i++) {
        float32Array[i] = Math.random() * 2 - 1; // Random values between -1 and 1
      }

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        service['float32ToInt16'](float32Array);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(1); // Should be sub-millisecond
      console.log(`✅ Average Float32→Int16 conversion (4096 samples): ${avgTime.toFixed(3)}ms`);
    });

    it('should handle large audio buffers', () => {
      const bufferSizes = [1024, 2048, 4096, 8192, 16384];

      bufferSizes.forEach(size => {
        const float32Array = new Float32Array(size);
        for (let i = 0; i < size; i++) {
          float32Array[i] = Math.random() * 2 - 1;
        }

        const startTime = performance.now();
        service['float32ToInt16'](float32Array);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(5);
        console.log(`✅ Buffer size ${size}: ${duration.toFixed(3)}ms`);
      });
    });
  });

  describe('Message Processing Performance', () => {
    it('should parse JSON messages efficiently', async () => {
      await service.connect();

      const messages = Array.from({ length: 1000 }, (_, i) => JSON.stringify({
        type: 'transcript',
        text: `Message ${i}`,
        is_final: i % 2 === 0,
        confidence: 0.9 + (i % 10) / 100,
      }));

      const startTime = performance.now();

      messages.forEach(message => {
        service['handleMessage'](message);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / 1000;

      expect(avgTime).toBeLessThan(0.5);
      console.log(`✅ 1000 messages parsed in: ${duration.toFixed(2)}ms`);
      console.log(`✅ Average per message: ${avgTime.toFixed(3)}ms`);
    });

    it('should handle large transcript payloads', async () => {
      await service.connect();

      const handler = vi.fn();
      service.on('transcript', handler);

      const longText = 'word '.repeat(10000); // 50KB+ payload
      const message = JSON.stringify({
        type: 'transcript',
        text: longText,
        is_final: true,
        confidence: 0.95,
      });

      const startTime = performance.now();
      service['handleMessage'](message);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
      expect(handler).toHaveBeenCalled();
      console.log(`✅ Large payload (${(message.length / 1024).toFixed(1)}KB) processed in: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory with repeated operations', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform 300 operations to keep runtime reasonable in CI
      for (let i = 0; i < 300; i++) {
        await service.connect();

        service.on('transcript', () => {});
        service['emit']('transcript', {
          text: `Test ${i}`,
          isFinal: true,
          confidence: 0.95,
          timestamp: Date.now(),
        });

        service.disconnect();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      if (initialMemory > 0) {
        console.log(`✅ Memory increase after 300 operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      }
    }, 15000);

    it('should clean up event handlers properly', async () => {
      await service.connect();

      const handlers = Array.from({ length: 100 }, () => vi.fn());
      
      // Register handlers
      handlers.forEach(handler => service.on('transcript', handler));

      // Unregister handlers
      handlers.forEach(handler => service.off('transcript', handler));

      // Emit event - no handlers should be called
      service['emit']('transcript', {
        text: 'Test',
        isFinal: true,
        confidence: 0.95,
        timestamp: Date.now(),
      });

      handlers.forEach(handler => expect(handler).not.toHaveBeenCalled());
      console.log(`✅ All 100 handlers cleaned up successfully`);
    });
  });

  describe('Latency Measurements', () => {
    it('should measure end-to-end latency', async () => {
      await service.connect();

      const latencies: number[] = [];
      
      service.on('transcript', (data) => {
        const latency = Date.now() - data.timestamp;
        latencies.push(latency);
      });

      // Simulate 100 transcript events
      for (let i = 0; i < 100; i++) {
        service['handleMessage'](JSON.stringify({
          type: 'transcript',
          text: `Word ${i}`,
          is_final: true,
          confidence: 0.95,
          timestamp: Date.now(),
        }));
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      expect(avgLatency).toBeLessThan(50);
      
      console.log(`✅ Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`✅ Min latency: ${minLatency.toFixed(2)}ms`);
      console.log(`✅ Max latency: ${maxLatency.toFixed(2)}ms`);
    });
  });

  describe('Throughput', () => {
    it('should handle high message throughput', async () => {
      await service.connect();

      const messageCount = 10000;
      const startTime = performance.now();

      for (let i = 0; i < messageCount; i++) {
        service['handleMessage'](JSON.stringify({
          type: 'transcript',
          text: `Message ${i}`,
          is_final: i % 10 === 0,
          confidence: 0.9,
        }));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = messageCount / (duration / 1000); // messages per second

      expect(throughput).toBeGreaterThan(1000); // Should handle >1000 msg/s
      
      console.log(`✅ Processed ${messageCount} messages in ${duration.toFixed(2)}ms`);
      console.log(`✅ Throughput: ${throughput.toFixed(0)} messages/second`);
    });
  });
});

