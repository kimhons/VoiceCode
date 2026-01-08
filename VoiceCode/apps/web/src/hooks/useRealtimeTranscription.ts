/**
 * React Hook for Real-time Transcription
 * Provides easy-to-use interface for WebSocket streaming transcription
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStreamingService, StreamingTranscript, StreamingOptions } from '@/services/websocket-streaming.service';

export interface UseRealtimeTranscriptionOptions extends StreamingOptions {
  apiKey: string;
  autoConnect?: boolean;
  onError?: (error: string) => void;
  onStatusChange?: (status: string) => void;
}

export interface UseRealtimeTranscriptionReturn {
  // State
  isConnected: boolean;
  isStreaming: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  connectionState: string;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startStreaming: (mediaStream: MediaStream) => Promise<void>;
  stopStreaming: () => void;
  
  // Transcript history
  transcripts: StreamingTranscript[];
  clearTranscripts: () => void;
}

/**
 * Hook for real-time transcription using WebSocket streaming
 */
export function useRealtimeTranscription(
  options: UseRealtimeTranscriptionOptions
): UseRealtimeTranscriptionReturn {
  const {
    apiKey,
    autoConnect = false,
    onError,
    onStatusChange,
    ...streamingOptions
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [transcripts, setTranscripts] = useState<StreamingTranscript[]>([]);

  // Refs
  const streamingServiceRef = useRef(getStreamingService(apiKey));
  const mediaStreamRef = useRef<MediaStream | null>(null);

  /**
   * Handle transcript updates
   */
  const handleTranscript = useCallback((data: StreamingTranscript) => {
    if (data.isFinal) {
      // Final transcript - add to history and update main transcript
      setTranscripts(prev => [...prev, data]);
      setTranscript(prev => prev + (prev ? ' ' : '') + data.text);
      setInterimTranscript('');
    } else {
      // Interim transcript - update temporary display
      setInterimTranscript(data.text);
    }
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((data: any) => {
    const errorMessage = data.error || 'Unknown error';
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  }, [onError]);

  /**
   * Handle connection status
   */
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setConnectionState('connected');
    setError(null);
    if (onStatusChange) {
      onStatusChange('connected');
    }
  }, [onStatusChange]);

  /**
   * Handle disconnection
   */
  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setIsStreaming(false);
    setConnectionState('disconnected');
    if (onStatusChange) {
      onStatusChange('disconnected');
    }
  }, [onStatusChange]);

  /**
   * Handle status updates
   */
  const handleStatus = useCallback((data: any) => {
    const status = data.status || 'unknown';
    setConnectionState(status);
    
    if (status === 'streaming') {
      setIsStreaming(true);
    } else if (status === 'stopped') {
      setIsStreaming(false);
    }

    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [onStatusChange]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState('connecting');
      
      await streamingServiceRef.current.connect(streamingOptions);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      setConnectionState('error');
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    }
  }, [streamingOptions, onError]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    streamingServiceRef.current.disconnect();
    setIsConnected(false);
    setIsStreaming(false);
    setConnectionState('disconnected');
  }, []);

  /**
   * Start streaming audio
   */
  const startStreaming = useCallback(async (mediaStream: MediaStream) => {
    try {
      if (!isConnected) {
        await connect();
      }

      mediaStreamRef.current = mediaStream;
      await streamingServiceRef.current.startStreaming(mediaStream);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start streaming';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    }
  }, [isConnected, connect, onError]);

  /**
   * Stop streaming audio
   */
  const stopStreaming = useCallback(() => {
    streamingServiceRef.current.stopStreaming();
    setIsStreaming(false);
  }, []);

  /**
   * Clear transcript history
   */
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setTranscript('');
    setInterimTranscript('');
  }, []);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    const service = streamingServiceRef.current;

    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);
    service.on('transcript', handleTranscript);
    service.on('error', handleError);
    service.on('status', handleStatus);

    // Auto-connect if enabled
    if (autoConnect) {
      connect().catch(err => {
        console.error('Auto-connect failed:', err);
      });
    }

    // Cleanup on unmount
    return () => {
      service.off('connected', handleConnected);
      service.off('disconnected', handleDisconnected);
      service.off('transcript', handleTranscript);
      service.off('error', handleError);
      service.off('status', handleStatus);
      
      // Disconnect on unmount
      service.disconnect();
    };
  }, [autoConnect, connect, handleConnected, handleDisconnected, handleTranscript, handleError, handleStatus]);

  /**
   * Update connection state periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const state = streamingServiceRef.current.getState();
      setConnectionState(state);
      setIsConnected(state === 'connected');
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    isConnected,
    isStreaming,
    transcript,
    interimTranscript,
    error,
    connectionState,

    // Actions
    connect,
    disconnect,
    startStreaming,
    stopStreaming,

    // Transcript history
    transcripts,
    clearTranscripts,
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isConnected,
 *     isStreaming,
 *     transcript,
 *     interimTranscript,
 *     error,
 *     connect,
 *     startStreaming,
 *     stopStreaming,
 *   } = useRealtimeTranscription({
 *     apiKey: 'your-api-key',
 *     language: 'en',
 *     punctuate: true,
 *     interimResults: true,
 *     onError: (error) => console.error('Streaming error:', error),
 *   });
 * 
 *   const handleStart = async () => {
 *     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 *     await startStreaming(stream);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleStart} disabled={isStreaming}>
 *         Start Recording
 *       </button>
 *       <button onClick={stopStreaming} disabled={!isStreaming}>
 *         Stop Recording
 *       </button>
 *       <div>
 *         <p>{transcript}</p>
 *         <p style={{ opacity: 0.5 }}>{interimTranscript}</p>
 *       </div>
 *       {error && <p style={{ color: 'red' }}>{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

