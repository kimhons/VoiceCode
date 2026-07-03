/**
 * useVideoTranscription Hook
 * Phase 5.10: Video Transcription
 * 
 * React hook for video transcription features
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getVideoTranscriptionService,
  VideoTranscription,
  SubtitleTrack,
  VideoUploadProgress,
} from '../services/videoTranscription.service';

export interface UseVideoTranscriptionOptions {
  userId?: string;
  autoLoad?: boolean;
}

export interface UseVideoTranscriptionReturn {
  // Video Upload
  uploadVideo: (file: File, title: string) => Promise<VideoTranscription>;

  // Video Management
  getVideoTranscription: (videoId: string) => Promise<VideoTranscription | null>;
  getUserVideoTranscriptions: (limit?: number) => Promise<VideoTranscription[]>;
  deleteVideoTranscription: (videoId: string) => Promise<void>;

  // Subtitles
  getSubtitleTracks: (videoId: string) => Promise<SubtitleTrack[]>;
  downloadSubtitles: (subtitleId: string) => Promise<Blob>;

  // State
  videos: VideoTranscription[];
  currentVideo: VideoTranscription | null;
  subtitles: SubtitleTrack[];
  uploadProgress: VideoUploadProgress | null;
  isUploading: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useVideoTranscription(options: UseVideoTranscriptionOptions = {}): UseVideoTranscriptionReturn {
  const { userId, autoLoad = false } = options;

  // Service
  const service = useRef(getVideoTranscriptionService());

  // State
  const [videos, setVideos] = useState<VideoTranscription[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoTranscription | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load videos
  useEffect(() => {
    if (autoLoad && userId) {
      getUserVideoTranscriptions();
    }
  }, [userId, autoLoad]);

  // Upload Video
  const uploadVideo = useCallback(
    async (file: File, title: string): Promise<VideoTranscription> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsUploading(true);
      setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

      try {
        const video = await service.current.uploadVideo(userId, file, title, (progress) => {
          setUploadProgress(progress);
        });

        setVideos((prev) => [video, ...prev]);
        setCurrentVideo(video);
        return video;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload video';
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [userId]
  );

  // Get Video Transcription
  const getVideoTranscription = useCallback(async (videoId: string): Promise<VideoTranscription | null> => {
    setError(null);
    setIsLoading(true);
    try {
      const video = await service.current.getVideoTranscription(videoId);
      if (video) {
        setCurrentVideo(video);
      }
      return video;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get video transcription';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get User Video Transcriptions
  const getUserVideoTranscriptions = useCallback(
    async (limit: number = 50): Promise<VideoTranscription[]> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const userVideos = await service.current.getUserVideoTranscriptions(userId, limit);
        setVideos(userVideos);
        return userVideos;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get video transcriptions';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Delete Video Transcription
  const deleteVideoTranscription = useCallback(async (videoId: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await service.current.deleteVideoTranscription(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      if (currentVideo?.id === videoId) {
        setCurrentVideo(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete video transcription';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentVideo]);

  // Get Subtitle Tracks
  const getSubtitleTracks = useCallback(async (videoId: string): Promise<SubtitleTrack[]> => {
    setError(null);
    setIsLoading(true);
    try {
      const tracks = await service.current.getSubtitleTracks(videoId);
      setSubtitles(tracks);
      return tracks;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get subtitle tracks';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Download Subtitles
  const downloadSubtitles = useCallback(async (subtitleId: string): Promise<Blob> => {
    setError(null);
    try {
      const blob = await service.current.downloadSubtitles(subtitleId);
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download subtitles';
      setError(message);
      throw err;
    }
  }, []);

  // Clear Error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadVideo,
    getVideoTranscription,
    getUserVideoTranscriptions,
    deleteVideoTranscription,
    getSubtitleTracks,
    downloadSubtitles,
    videos,
    currentVideo,
    subtitles,
    uploadProgress,
    isUploading,
    isLoading,
    error,
    clearError,
  };
}

