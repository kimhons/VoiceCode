/**
 * useAudioPlayback Hook
 * React hook wrapper for AudioPlayer service with state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { audioPlayer, PlaybackStatus, PlaybackState } from '../services/AudioPlayer';

export interface UseAudioPlaybackOptions {
  autoPlay?: boolean;
  initialSpeed?: number;
  onTimeUpdate?: (timeSeconds: number) => void;
  onPlaybackEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseAudioPlaybackReturn {
  // State
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  currentTime: number; // seconds
  duration: number; // seconds
  playbackSpeed: number;
  progress: number; // 0-1

  // Actions
  load: (uri: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  seekByPercent: (percent: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  unload: () => Promise<void>;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];
const DEFAULT_SKIP_SECONDS = 10;

export function useAudioPlayback(
  options: UseAudioPlaybackOptions = {}
): UseAudioPlaybackReturn {
  const {
    autoPlay = false,
    initialSpeed = 1.0,
    onTimeUpdate,
    onPlaybackEnd,
    onError,
  } = options;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);

  // Refs
  const currentUriRef = useRef<string | null>(null);
  const playbackEndCalledRef = useRef(false);

  // Calculate progress (0-1)
  const progress = duration > 0 ? currentTime / duration : 0;

  // Handle playback status updates from AudioPlayer
  const handlePlaybackStatus = useCallback(
    (state: PlaybackState) => {
      setCurrentTime(state.position / 1000); // Convert ms to seconds
      setDuration(state.duration / 1000);
      setPlaybackSpeed(state.rate);
      setIsLoaded(state.isLoaded);

      switch (state.status) {
        case PlaybackStatus.PLAYING:
          setIsPlaying(true);
          setIsPaused(false);
          setIsLoading(false);
          playbackEndCalledRef.current = false;
          break;
        case PlaybackStatus.PAUSED:
          setIsPlaying(false);
          setIsPaused(true);
          setIsLoading(false);
          break;
        case PlaybackStatus.STOPPED:
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          if (!playbackEndCalledRef.current && onPlaybackEnd) {
            playbackEndCalledRef.current = true;
            onPlaybackEnd();
          }
          break;
        case PlaybackStatus.LOADING:
          setIsLoading(true);
          break;
        case PlaybackStatus.ERROR:
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          if (onError) {
            onError('Playback error occurred');
          }
          break;
        case PlaybackStatus.IDLE:
          setIsPlaying(false);
          setIsPaused(false);
          setIsLoading(false);
          setIsLoaded(false);
          break;
      }

      // Call time update callback
      if (onTimeUpdate && state.status === PlaybackStatus.PLAYING) {
        onTimeUpdate(state.position / 1000);
      }
    },
    [onTimeUpdate, onPlaybackEnd, onError]
  );

  // Set up status callback on mount
  useEffect(() => {
    audioPlayer.setStatusCallback(handlePlaybackStatus);

    return () => {
      audioPlayer.setStatusCallback(null);
    };
  }, [handlePlaybackStatus]);

  // Load audio
  const load = useCallback(
    async (uri: string) => {
      try {
        setIsLoading(true);
        currentUriRef.current = uri;
        await audioPlayer.loadAudio(uri);

        // Set initial speed
        if (initialSpeed !== 1.0) {
          await audioPlayer.setRate(initialSpeed);
        }

        // Auto-play if enabled
        if (autoPlay) {
          await audioPlayer.play();
        }
      } catch (error) {
        console.error('Failed to load audio:', error);
        if (onError) {
          onError('Failed to load audio');
        }
        throw error;
      }
    },
    [autoPlay, initialSpeed, onError]
  );

  // Play
  const play = useCallback(async () => {
    try {
      await audioPlayer.play();
    } catch (error) {
      console.error('Failed to play:', error);
      if (onError) {
        onError('Failed to play audio');
      }
    }
  }, [onError]);

  // Pause
  const pause = useCallback(async () => {
    try {
      await audioPlayer.pause();
    } catch (error) {
      console.error('Failed to pause:', error);
      if (onError) {
        onError('Failed to pause audio');
      }
    }
  }, [onError]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  // Stop
  const stop = useCallback(async () => {
    try {
      await audioPlayer.stop();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }, []);

  // Seek to specific time (seconds)
  const seekTo = useCallback(
    async (seconds: number) => {
      try {
        const clampedSeconds = Math.max(0, Math.min(seconds, duration));
        await audioPlayer.seekTo(clampedSeconds * 1000);
        setCurrentTime(clampedSeconds);
      } catch (error) {
        console.error('Failed to seek:', error);
      }
    },
    [duration]
  );

  // Seek by percentage (0-1)
  const seekByPercent = useCallback(
    async (percent: number) => {
      const clampedPercent = Math.max(0, Math.min(1, percent));
      const targetTime = duration * clampedPercent;
      await seekTo(targetTime);
    },
    [duration, seekTo]
  );

  // Set playback speed
  const setSpeed = useCallback(async (speed: number) => {
    try {
      // Find closest valid speed
      const validSpeed = PLAYBACK_SPEEDS.reduce((prev, curr) =>
        Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev
      );
      await audioPlayer.setRate(validSpeed);
      setPlaybackSpeed(validSpeed);
    } catch (error) {
      console.error('Failed to set speed:', error);
    }
  }, []);

  // Skip forward
  const skipForward = useCallback(
    async (seconds: number = DEFAULT_SKIP_SECONDS) => {
      const newTime = Math.min(currentTime + seconds, duration);
      await seekTo(newTime);
    },
    [currentTime, duration, seekTo]
  );

  // Skip backward
  const skipBackward = useCallback(
    async (seconds: number = DEFAULT_SKIP_SECONDS) => {
      const newTime = Math.max(currentTime - seconds, 0);
      await seekTo(newTime);
    },
    [currentTime, seekTo]
  );

  // Unload audio
  const unload = useCallback(async () => {
    try {
      await audioPlayer.unloadAudio();
      currentUriRef.current = null;
      setCurrentTime(0);
      setDuration(0);
      setIsLoaded(false);
      setIsPlaying(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to unload:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't unload on unmount - let the singleton persist
      // This allows playback to continue across screen transitions
    };
  }, []);

  return {
    // State
    isPlaying,
    isPaused,
    isLoading,
    isLoaded,
    currentTime,
    duration,
    playbackSpeed,
    progress,

    // Actions
    load,
    play,
    pause,
    togglePlayPause,
    stop,
    seekTo,
    seekByPercent,
    setSpeed,
    skipForward,
    skipBackward,
    unload,
  };
}

export { PLAYBACK_SPEEDS };
export default useAudioPlayback;
