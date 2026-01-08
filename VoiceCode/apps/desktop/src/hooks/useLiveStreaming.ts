/**
 * useLiveStreaming Hook
 * Phase 5.9: Live Streaming
 * 
 * React hook for live streaming features
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getLiveStreamingService,
  LiveStream,
  LiveStreamConfig,
  LiveCaption,
  StreamViewer,
} from '../services/liveStreaming.service';

export interface UseLiveStreamingOptions {
  userId?: string;
  autoLoad?: boolean;
}

export interface UseLiveStreamingReturn {
  // Stream Management
  createStream: (title: string, mode: string, language: string, config: LiveStreamConfig) => Promise<LiveStream>;
  startStream: (streamId: string) => Promise<MediaStream>;
  stopStream: (streamId: string) => Promise<void>;
  pauseStream: (streamId: string) => Promise<void>;
  resumeStream: (streamId: string) => Promise<void>;
  getStream: (streamId: string) => Promise<LiveStream | null>;
  getUserStreams: (limit?: number) => Promise<LiveStream[]>;

  // Live Transcription
  startLiveTranscription: (streamId: string, stream: MediaStream) => Promise<void>;
  getLiveCaptions: (streamId: string) => Promise<LiveCaption[]>;

  // Viewers
  addViewer: (streamId: string, username: string) => Promise<StreamViewer>;
  removeViewer: (viewerId: string) => Promise<void>;

  // State
  currentStream: LiveStream | null;
  streams: LiveStream[];
  mediaStream: MediaStream | null;
  captions: LiveCaption[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLiveStreaming(options: UseLiveStreamingOptions = {}): UseLiveStreamingReturn {
  const { userId, autoLoad = false } = options;

  // Service
  const service = useRef(getLiveStreamingService());

  // State
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [captions, setCaptions] = useState<LiveCaption[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load streams
  useEffect(() => {
    if (autoLoad && userId) {
      getUserStreams();
    }
  }, [userId, autoLoad]);

  // Create Stream
  const createStream = useCallback(
    async (title: string, mode: string, language: string, config: LiveStreamConfig): Promise<LiveStream> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const stream = await service.current.createStream(userId, title, mode, language, config);
        setCurrentStream(stream);
        setStreams((prev) => [stream, ...prev]);
        return stream;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create stream';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Start Stream
  const startStream = useCallback(async (streamId: string): Promise<MediaStream> => {
    setError(null);
    setIsLoading(true);
    try {
      const stream = await service.current.startAudioStream(streamId);
      setMediaStream(stream);
      setIsStreaming(true);
      return stream;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start stream';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop Stream
  const stopStream = useCallback(async (streamId: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await service.current.stopAudioStream(streamId);
      setMediaStream(null);
      setIsStreaming(false);
      setCaptions([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop stream';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pause Stream
  const pauseStream = useCallback(async (streamId: string): Promise<void> => {
    setError(null);
    try {
      await service.current.pauseAudioStream(streamId);
      setIsStreaming(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause stream';
      setError(message);
      throw err;
    }
  }, []);

  // Resume Stream
  const resumeStream = useCallback(async (streamId: string): Promise<void> => {
    setError(null);
    try {
      await service.current.resumeAudioStream(streamId);
      setIsStreaming(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume stream';
      setError(message);
      throw err;
    }
  }, []);

  // Get Stream
  const getStream = useCallback(async (streamId: string): Promise<LiveStream | null> => {
    setError(null);
    setIsLoading(true);
    try {
      const stream = await service.current.getStream(streamId);
      if (stream) {
        setCurrentStream(stream);
      }
      return stream;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get stream';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get User Streams
  const getUserStreams = useCallback(
    async (limit: number = 50): Promise<LiveStream[]> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const userStreams = await service.current.getUserStreams(userId, limit);
        setStreams(userStreams);
        return userStreams;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get streams';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Start Live Transcription
  const startLiveTranscription = useCallback(
    async (streamId: string, stream: MediaStream): Promise<void> => {
      setError(null);
      try {
        await service.current.startLiveTranscription(
          streamId,
          stream,
          (caption) => {
            setCaptions((prev) => {
              // Replace interim captions or add final ones
              if (caption.isFinal) {
                return [...prev.filter((c) => c.isFinal), caption];
              } else {
                return [...prev.filter((c) => c.isFinal), caption];
              }
            });
          },
          (err) => {
            setError(err.message);
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start live transcription';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Get Live Captions
  const getLiveCaptions = useCallback(async (streamId: string): Promise<LiveCaption[]> => {
    setError(null);
    setIsLoading(true);
    try {
      const liveCaptions = await service.current.getLiveCaptions(streamId);
      setCaptions(liveCaptions);
      return liveCaptions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get live captions';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add Viewer
  const addViewer = useCallback(
    async (streamId: string, username: string): Promise<StreamViewer> => {
      setError(null);
      try {
        const viewer = await service.current.addViewer(streamId, userId, username);
        return viewer;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add viewer';
        setError(message);
        throw err;
      }
    },
    [userId]
  );

  // Remove Viewer
  const removeViewer = useCallback(async (viewerId: string): Promise<void> => {
    setError(null);
    try {
      await service.current.removeViewer(viewerId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove viewer';
      setError(message);
      throw err;
    }
  }, []);

  // Clear Error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createStream,
    startStream,
    stopStream,
    pauseStream,
    resumeStream,
    getStream,
    getUserStreams,
    startLiveTranscription,
    getLiveCaptions,
    addViewer,
    removeViewer,
    currentStream,
    streams,
    mediaStream,
    captions,
    isStreaming,
    isLoading,
    error,
    clearError,
  };
}

