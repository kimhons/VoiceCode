/**
 * useRealtimeTranscription Hook Unit Tests
 * Phase 1.5: Testing Suite
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeTranscription } from '../useRealtimeTranscription';

// Mock the streaming service
const mockStreamingService = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  startStreaming: vi.fn().mockResolvedValue(undefined),
  stopStreaming: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  getIsStreaming: vi.fn().mockReturnValue(false),
  getState: vi.fn().mockReturnValue('connected'),
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('@/services/websocket-streaming.service', () => ({
  getStreamingService: vi.fn(() => mockStreamingService),
}));

// Mock navigator.mediaDevices
global.navigator.mediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
  } as MediaStream),
} as any;

describe('useRealtimeTranscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.transcript).toBe('');
      expect(result.current.interimTranscript).toBe('');
      expect(result.current.error).toBe(null);
    });

    it('should register event handlers on mount', () => {
      renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      expect(mockStreamingService.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockStreamingService.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockStreamingService.on).toHaveBeenCalledWith('transcript', expect.any(Function));
      expect(mockStreamingService.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockStreamingService.on).toHaveBeenCalledWith('status', expect.any(Function));
    });

    it('should unregister event handlers on unmount', () => {
      const { unmount } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      unmount();

      expect(mockStreamingService.off).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockStreamingService.off).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockStreamingService.off).toHaveBeenCalledWith('transcript', expect.any(Function));
      expect(mockStreamingService.off).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockStreamingService.off).toHaveBeenCalledWith('status', expect.any(Function));
    });

    it('should auto-connect when autoConnect is true', async () => {
      renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
          autoConnect: true,
        })
      );

      await waitFor(() => {
        expect(mockStreamingService.connect).toHaveBeenCalled();
      });
    });

    it('should not auto-connect when autoConnect is false', () => {
      renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
          autoConnect: false,
        })
      );

      expect(mockStreamingService.connect).not.toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should connect when connect() is called', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      await act(async () => {
        await result.current.connect();
      });

      expect(mockStreamingService.connect).toHaveBeenCalled();
    });

    it('should disconnect when disconnect() is called', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      await act(async () => {
        await result.current.connect();
        result.current.disconnect();
      });

      expect(mockStreamingService.disconnect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const onError = vi.fn();
      mockStreamingService.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
          onError,
        })
      );

      await act(async () => {
        try {
          await result.current.connect();
        } catch (error) {
          // Expected error
        }
      });

      expect(onError).toHaveBeenCalledWith('Connection failed');
      expect(result.current.error).toBe('Connection failed');
    });

    it('should update connection state', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      // Simulate connected event
      const connectedHandler = mockStreamingService.on.mock.calls.find(
        call => call[0] === 'connected'
      )?.[1];

      act(() => {
        connectedHandler?.();
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });
    });
  });

  describe('Streaming', () => {
    it('should start streaming', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      await act(async () => {
        await result.current.startStreaming();
      });

      expect(mockStreamingService.connect).toHaveBeenCalled();
      expect(mockStreamingService.startStreaming).toHaveBeenCalled();
    });

    it('should stop streaming', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      await act(async () => {
        await result.current.startStreaming();
        await result.current.stopStreaming();
      });

      expect(mockStreamingService.stopStreaming).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      const onError = vi.fn();
      mockStreamingService.startStreaming.mockRejectedValueOnce(new Error('Streaming failed'));

      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
          onError,
        })
      );

      await act(async () => {
        try {
          await result.current.startStreaming();
        } catch (error) {
          // Expected error
        }
      });

      expect(onError).toHaveBeenCalledWith('Streaming failed');
    });
  });

  describe('Transcript Handling', () => {
    it('should update final transcript', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      // Get transcript handler
      const transcriptHandler = mockStreamingService.on.mock.calls.find(
        call => call[0] === 'transcript'
      )?.[1];

      act(() => {
        transcriptHandler?.({
          text: 'Hello world',
          isFinal: true,
          confidence: 0.95,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.transcript).toBe('Hello world');
        expect(result.current.interimTranscript).toBe('');
      });
    });

    it('should update interim transcript', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      const transcriptHandler = mockStreamingService.on.mock.calls.find(
        call => call[0] === 'transcript'
      )?.[1];

      act(() => {
        transcriptHandler?.({
          text: 'Hello',
          isFinal: false,
          confidence: 0.8,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.interimTranscript).toBe('Hello');
        expect(result.current.transcript).toBe('');
      });
    });

    it('should append multiple final transcripts', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      const transcriptHandler = mockStreamingService.on.mock.calls.find(
        call => call[0] === 'transcript'
      )?.[1];

      act(() => {
        transcriptHandler?.({
          text: 'Hello',
          isFinal: true,
          confidence: 0.95,
          timestamp: Date.now(),
        });
      });

      act(() => {
        transcriptHandler?.({
          text: 'world',
          isFinal: true,
          confidence: 0.95,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.transcript).toBe('Hello world');
      });
    });

    it('should clear transcripts', async () => {
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
        })
      );

      const transcriptHandler = mockStreamingService.on.mock.calls.find(
        call => call[0] === 'transcript'
      )?.[1];

      act(() => {
        transcriptHandler?.({
          text: 'Hello world',
          isFinal: true,
          confidence: 0.95,
          timestamp: Date.now(),
        });
      });

      act(() => {
        result.current.clearTranscripts();
      });

      await waitFor(() => {
        expect(result.current.transcript).toBe('');
        expect(result.current.transcripts).toHaveLength(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error events', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
          onError,
        })
      );

      const errorHandler = mockStreamingService.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      act(() => {
        errorHandler?.({ error: 'Test error', timestamp: Date.now() });
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
        expect(onError).toHaveBeenCalledWith('Test error');
      });
    });
  });

  describe('Status Updates', () => {
    it('should handle status change callbacks', async () => {
      const onStatusChange = vi.fn();
      renderHook(() =>
        useRealtimeTranscription({
          apiKey: 'test-api-key',
          onStatusChange,
        })
      );

      const statusHandler = mockStreamingService.on.mock.calls.find(
        call => call[0] === 'status'
      )?.[1];

      act(() => {
        statusHandler?.({ status: 'streaming', timestamp: Date.now() });
      });

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('streaming');
      });
    });
  });
});

