/**
 * React Hook for Real-time Transcription - React Native Mobile Version
 * Provides easy-to-use interface for WebSocket streaming transcription
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStreamingService, StreamingTranscript, StreamingOptions } from '../services/WebSocketStreamingService';
import { audioRecorder } from '../services/AudioRecorder';
import { RecordingQuality } from '../types/recording';

export interface UseRealtimeTranscriptionOptions extends StreamingOptions {
  apiKey: string;
  autoConnect?: boolean;
  recordingQuality?: RecordingQuality;
  onError?: (error: string) => void;
  onStatusChange?: (status: string) => void;
}

export interface UseRealtimeTranscriptionReturn {
  // State
  isConnected: boolean;
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  connectionState: string;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
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
    recordingQuality = RecordingQuality.MEDIUM,
    onError,
    onStatusChange,
    ...streamingOptions
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [transcripts, setTranscripts] = useState<StreamingTranscript[]>([]);

  // Refs
  const streamingServiceRef = useRef(getStreamingService(apiKey));

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
    setIsRecording(false);
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
      setIsRecording(true);
    } else if (status === 'stopped') {
      setIsRecording(false);
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
    setIsRecording(false);
    setConnectionState('disconnected');
  }, []);

  /**
   * Start recording with streaming
   */
  const startRecording = useCallback(async () => {
    try {
      if (!isConnected) {
        await connect();
      }

      // Set streaming service in audio recorder
      audioRecorder.setStreamingService(streamingServiceRef.current);

      // Start streaming recording
      await audioRecorder.startStreamingRecording(recordingQuality);
      setIsRecording(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    }
  }, [isConnected, connect, recordingQuality, onError]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    try {
      await audioRecorder.stopStreamingRecording();
      setIsRecording(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    }
  }, [onError]);

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
    isRecording,
    transcript,
    interimTranscript,
    error,
    connectionState,

    // Actions
    connect,
    disconnect,
    startRecording,
    stopRecording,

    // Transcript history
    transcripts,
    clearTranscripts,
  };
}

/**
 * Example usage:
 * 
 * ```tsx
 * function RecordingScreen() {
 *   const {
 *     isConnected,
 *     isRecording,
 *     transcript,
 *     interimTranscript,
 *     error,
 *     startRecording,
 *     stopRecording,
 *   } = useRealtimeTranscription({
 *     apiKey: 'your-api-key',
 *     language: 'en',
 *     punctuate: true,
 *     interimResults: true,
 *     onError: (error) => Alert.alert('Error', error),
 *   });
 * 
 *   return (
 *     <View>
 *       <Button
 *         title={isRecording ? 'Stop Recording' : 'Start Recording'}
 *         onPress={isRecording ? stopRecording : startRecording}
 *       />
 *       <Text>{transcript}</Text>
 *       <Text style={{ opacity: 0.5 }}>{interimTranscript}</Text>
 *       {error && <Text style={{ color: 'red' }}>{error}</Text>}
 *     </View>
 *   );
 * }
 * ```
 */

