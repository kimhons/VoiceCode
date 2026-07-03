/**
 * AudioPlayerBar Component
 * Full-featured audio player with waveform scrubbing and speed control
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAudioPlayback, PLAYBACK_SPEEDS } from '../../hooks/useAudioPlayback';
import { PlaybackSpeedSelector } from './PlaybackSpeedSelector';

interface AudioPlayerBarProps {
  audioUrl: string;
  onTimeUpdate?: (timeSeconds: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onSeek?: (timeSeconds: number) => void;
  minimized?: boolean;
  showWaveform?: boolean;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioUrl,
  onTimeUpdate,
  onPlayStateChange,
  onSeek,
  minimized = false,
  showWaveform = true,
}) => {
  const { theme } = useTheme();
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);

  const {
    isPlaying,
    isLoading,
    isLoaded,
    currentTime,
    duration,
    playbackSpeed,
    progress,
    load,
    togglePlayPause,
    seekTo,
    seekByPercent,
    setSpeed,
    skipForward,
    skipBackward,
  } = useAudioPlayback({
    onTimeUpdate,
    onPlaybackEnd: () => {
      onPlayStateChange?.(false);
    },
  });

  // Animation values
  const playButtonScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // Load audio on mount or URL change
  useEffect(() => {
    if (audioUrl) {
      load(audioUrl);
    }
  }, [audioUrl, load]);

  // Update progress animation
  useEffect(() => {
    if (!isScrubbing) {
      progressWidth.value = withTiming(progress * 100, { duration: 100 });
    }
  }, [progress, isScrubbing, progressWidth]);

  // Notify parent of play state changes
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause with haptic
  const handlePlayPause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playButtonScale.value = withSpring(0.9, SPRING_CONFIG);
    setTimeout(() => {
      playButtonScale.value = withSpring(1, SPRING_CONFIG);
    }, 100);
    await togglePlayPause();
  }, [togglePlayPause, playButtonScale]);

  // Handle skip forward
  const handleSkipForward = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipForward(10);
  }, [skipForward]);

  // Handle skip backward
  const handleSkipBackward = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipBackward(10);
  }, [skipBackward]);

  // Handle speed change
  const handleSpeedChange = useCallback(
    async (speed: number) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setSpeed(speed);
      setShowSpeedSelector(false);
    },
    [setSpeed]
  );

  // Handle seek completion
  const handleSeekComplete = useCallback(
    async (percent: number) => {
      setIsScrubbing(false);
      await seekByPercent(percent);
      const targetTime = duration * percent;
      onSeek?.(targetTime);
    },
    [seekByPercent, duration, onSeek]
  );

  // Progress bar pan gesture
  const progressBarWidth = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setIsScrubbing)(true);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      if (progressBarWidth.value > 0) {
        const percent = Math.max(0, Math.min(1, event.x / progressBarWidth.value));
        progressWidth.value = percent * 100;
        runOnJS(setScrubPosition)(percent);
      }
    })
    .onEnd(() => {
      runOnJS(handleSeekComplete)(scrubPosition);
    });

  // Tap gesture for progress bar
  const tapGesture = Gesture.Tap().onEnd((event) => {
    if (progressBarWidth.value > 0) {
      const percent = Math.max(0, Math.min(1, event.x / progressBarWidth.value));
      runOnJS(handleSeekComplete)(percent);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  });

  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  // Animated styles
  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Display time (scrub position or current time)
  const displayTime = isScrubbing ? duration * scrubPosition : currentTime;

  if (minimized) {
    return (
      <View style={[styles.minimizedContainer, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.miniPlayButton}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <View style={styles.miniProgress}>
          <View
            style={[
              styles.miniProgressFill,
              { backgroundColor: theme.colors.primary, width: `${progress * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.miniTime, { color: theme.colors.textSecondary }]}>
          {formatTime(currentTime)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Progress Bar */}
      <GestureDetector gesture={combinedGesture}>
        <View
          style={[styles.progressContainer, { backgroundColor: theme.colors.border }]}
          onLayout={(e) => {
            progressBarWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary },
              progressAnimatedStyle,
            ]}
          />
          {/* Scrubber handle */}
          <Animated.View
            style={[
              styles.scrubberHandle,
              {
                backgroundColor: theme.colors.primary,
                left: `${isScrubbing ? scrubPosition * 100 : progress * 100}%`,
              },
              isScrubbing && styles.scrubberHandleActive,
            ]}
          />
        </View>
      </GestureDetector>

      {/* Time Display */}
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {formatTime(displayTime)}
        </Text>
        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {formatTime(duration)}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        {/* Speed Button */}
        <TouchableOpacity
          style={[styles.speedButton, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSpeedSelector(true);
          }}
        >
          <Text style={[styles.speedText, { color: theme.colors.primary }]}>
            {playbackSpeed}x
          </Text>
        </TouchableOpacity>

        {/* Skip Backward */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipBackward}
          disabled={!isLoaded}
        >
          <Ionicons
            name="play-back"
            size={28}
            color={isLoaded ? theme.colors.textPrimary : theme.colors.textTertiary}
          />
          <Text style={[styles.skipLabel, { color: theme.colors.textSecondary }]}>10</Text>
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <Animated.View style={playButtonAnimatedStyle}>
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handlePlayPause}
            disabled={isLoading || !isLoaded}
          >
            {isLoading ? (
              <Ionicons name="hourglass" size={32} color="white" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="white"
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Skip Forward */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipForward}
          disabled={!isLoaded}
        >
          <Ionicons
            name="play-forward"
            size={28}
            color={isLoaded ? theme.colors.textPrimary : theme.colors.textTertiary}
          />
          <Text style={[styles.skipLabel, { color: theme.colors.textSecondary }]}>10</Text>
        </TouchableOpacity>

        {/* Placeholder for symmetry */}
        <View style={styles.speedButton} />
      </View>

      {/* Speed Selector Modal */}
      <PlaybackSpeedSelector
        visible={showSpeedSelector}
        currentSpeed={playbackSpeed}
        onSelectSpeed={handleSpeedChange}
        onClose={() => setShowSpeedSelector(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrubberHandle: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  scrubberHandleActive: {
    transform: [{ scale: 1.3 }],
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedButton: {
    width: 50,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skipLabel: {
    position: 'absolute',
    bottom: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  miniPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniProgress: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  miniTime: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
    textAlign: 'right',
  },
});

export default AudioPlayerBar;
