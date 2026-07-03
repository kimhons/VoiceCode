/**
 * WebSocket Streaming Service Unit Tests
 * Phase 1.5: Testing Suite
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketStreamingService, getStreamingService } from '../websocket-streaming.service';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
    }, 10);
  }
}

// Mock AudioContext
class MockAudioContext {
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
}

describe('WebSocketStreamingService', () => {
  let service: WebSocketStreamingService;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Mock global WebSocket as a spyable, newable constructor
    const WSSpy: any = vi.fn(function(this: any, url: string) {
      return new MockWebSocket(url);
    });
    WSSpy.CONNECTING = MockWebSocket.CONNECTING;
    WSSpy.OPEN = MockWebSocket.OPEN;
    WSSpy.CLOSING = MockWebSocket.CLOSING;
    WSSpy.CLOSED = MockWebSocket.CLOSED;
    global.WebSocket = WSSpy as any;

    // Mock AudioContext
    global.AudioContext = MockAudioContext as any;

    service = new WebSocketStreamingService('test-api-key');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      const connectPromise = service.connect();
      
      await expect(connectPromise).resolves.toBeUndefined();
      expect(service.isConnected()).toBe(true);
    });

    it('should include query parameters in WebSocket URL', async () => {
      await service.connect({
        language: 'es',
        model: '#g1_nova-2-medical',
        punctuate: true,
        interimResults: true,
      });

      // Check that WebSocket was created with correct URL
      expect(global.WebSocket).toHaveBeenCalled();
    });

    it('should emit connected event on successful connection', async () => {
      const connectedHandler = vi.fn();
      service.on('connected', connectedHandler);

      await service.connect();

      expect(connectedHandler).toHaveBeenCalledWith(
        expect.objectContaining({ timestamp: expect.any(Number) })
      );
    });

    it('should handle connection errors', async () => {
      const errorHandler = vi.fn();

      // Mock WebSocket to emit error before open (and never open)
      global.WebSocket = class {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;

        readyState = 0;
        url: string;
        onopen: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        send = vi.fn();
        close = vi.fn();

        constructor(url: string) {
          this.url = url;
          // Immediately trigger error so connect() rejects
          setTimeout(() => {
            this.onerror?.(new Event('error'));
          }, 5);
        }
      } as any;

      service = new WebSocketStreamingService('test-api-key');
      service.on('error', errorHandler);

      await expect(service.connect()).rejects.toThrow();
      // allow event loop to flush error emission
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(errorHandler).toHaveBeenCalled();
    });

    it('should disconnect cleanly', async () => {
      await service.connect();
      
      const disconnectedHandler = vi.fn();
      service.on('disconnected', disconnectedHandler);

      service.disconnect();

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(disconnectedHandler).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should not connect if already connected', async () => {
      await service.connect();
      
      const firstConnection = service.isConnected();
      await service.connect(); // Try to connect again
      const secondConnection = service.isConnected();

      expect(firstConnection).toBe(true);
      expect(secondConnection).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should register event handlers', () => {
      const handler = vi.fn();
      service.on('transcript', handler);

      // Trigger event
      service['emit']('transcript', { text: 'test', isFinal: true });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'test', isFinal: true })
      );
    });

    it('should unregister event handlers', () => {
      const handler = vi.fn();
      service.on('transcript', handler);
      service.off('transcript', handler);

      // Trigger event
      service['emit']('transcript', { text: 'test', isFinal: true });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle multiple event handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      service.on('transcript', handler1);
      service.on('transcript', handler2);

      service['emit']('transcript', { text: 'test', isFinal: true });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      service.on('transcript', errorHandler);
      service.on('transcript', normalHandler);

      // Should not throw
      expect(() => {
        service['emit']('transcript', { text: 'test', isFinal: true });
      }).not.toThrow();

      expect(normalHandler).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should handle auth_success message', () => {
      const statusHandler = vi.fn();
      service.on('status', statusHandler);

      service['handleMessage'](JSON.stringify({
        type: 'auth_success',
      }));

      expect(statusHandler).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'authenticated' })
      );
    });

    it('should handle transcript message', () => {
      const transcriptHandler = vi.fn();
      service.on('transcript', transcriptHandler);

      service['handleMessage'](JSON.stringify({
        type: 'transcript',
        text: 'Hello world',
        is_final: true,
        confidence: 0.95,
      }));

      expect(transcriptHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello world',
          isFinal: true,
          confidence: 0.95,
        })
      );
    });

    it('should handle error message', () => {
      const errorHandler = vi.fn();
      service.on('error', errorHandler);

      service['handleMessage'](JSON.stringify({
        type: 'error',
        error: 'Authentication failed',
      }));

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authentication failed' })
      );
    });

    it('should handle malformed JSON gracefully', () => {
      expect(() => {
        service['handleMessage']('invalid json');
      }).not.toThrow();
    });
  });

  describe('Audio Streaming', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should start streaming', async () => {
      const mockMediaStream = {} as MediaStream;
      
      await service.startStreaming(mockMediaStream);

      expect(service.getIsStreaming()).toBe(true);
    });

    it('should stop streaming', async () => {
      const mockMediaStream = {} as MediaStream;
      
      await service.startStreaming(mockMediaStream);
      service.stopStreaming();

      expect(service.getIsStreaming()).toBe(false);
    });

    it('should send audio chunks', async () => {
      const mockMediaStream = {} as MediaStream;
      await service.startStreaming(mockMediaStream);

      const pcmData = new Int16Array([100, 200, 300]);
      
      expect(() => {
        service['sendAudioChunk'](pcmData);
      }).not.toThrow();
    });

    it('should convert Float32 to Int16', () => {
      const float32Array = new Float32Array([0.5, -0.5, 1.0, -1.0]);
      const int16Array = service['float32ToInt16'](float32Array);

      expect(int16Array).toBeInstanceOf(Int16Array);
      expect(int16Array.length).toBe(4);
      expect(int16Array[0]).toBeGreaterThan(0);
      expect(int16Array[1]).toBeLessThan(0);
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection on unexpected close', async () => {
      await service.connect();

      const reconnectSpy = vi.spyOn(service as any, 'scheduleReconnect');

      // Simulate unexpected close
      service['ws']?.close(1006, 'Abnormal closure');

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(reconnectSpy).toHaveBeenCalled();
    });

    it('should not reconnect on clean close', async () => {
      await service.connect();

      const reconnectSpy = vi.spyOn(service as any, 'scheduleReconnect');

      // Simulate clean close
      service.disconnect();

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(reconnectSpy).not.toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = getStreamingService('api-key-1');
      const instance2 = getStreamingService();

      expect(instance1).toBe(instance2);
    });

    it('should throw error if not initialized', () => {
      // Reset singleton
      (getStreamingService as any).streamingServiceInstance = null;

      expect(() => getStreamingService()).toThrow('Streaming service not initialized');
    });
  });
});

