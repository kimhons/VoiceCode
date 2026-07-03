// VoiceCode Mobile - Audio Waveform Visualization
// Real-time 60fps waveform with react-native-reanimated

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

export interface AudioWaveformProps {
  /** Audio level from 0 to 1 */
  audioLevel?: number;
  /** Audio data array (legacy support) */
  audioData?: number[];
  /** Whether recording is active */
  isActive?: boolean;
  /** Number of bars to display */
  barCount?: number;
  /** Height of the waveform container */
  height?: number;
  /** Width of each bar */
  barWidth?: number;
  /** Spacing between bars */
  barSpacing?: number;
  /** Color of the bars */
  color?: string;
  /** Use gradient colors based on volume */
  useGradient?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioLevel = 0,
  audioData = [],
  isActive = false,
  barCount = 40,
  height = 60,
  barWidth = 3,
  barSpacing = 2,
  color,
  useGradient = true,
}) => {
  const { theme } = useTheme();

  const getBarColor = (index: number): string => {
    if (color) return color;
    if (!useGradient) return theme.colors.primary;

    // Create gradient from blue (quiet) to red (loud)
    const intensity = audioLevel;

    if (intensity < 0.3) {
      return theme.colors.primary; // Blue
    } else if (intensity < 0.6) {
      return theme.colors.warning; // Orange
    } else {
      return theme.colors.error; // Red
    }
  };

  const barColor = color || getBarColor(0);

  return (
    <View style={[styles.container, { height }]}>
      {Array.from({ length: barCount }).map((_, index) => (
        <AnimatedBar
          key={index}
          index={index}
          barCount={barCount}
          audioLevel={audioLevel}
          audioData={audioData}
          isActive={isActive}
          barWidth={barWidth}
          barSpacing={barSpacing}
          maxHeight={height}
          color={useGradient ? getBarColor(index) : barColor}
        />
      ))}
    </View>
  );
};

interface AnimatedBarProps {
  index: number;
  barCount: number;
  audioLevel: number;
  audioData: number[];
  isActive: boolean;
  barWidth: number;
  barSpacing: number;
  maxHeight: number;
  color: string;
}

const AnimatedBar: React.FC<AnimatedBarProps> = ({
  index,
  barCount,
  audioLevel,
  audioData,
  isActive,
  barWidth,
  barSpacing,
  maxHeight,
  color,
}) => {
  const barHeight = useSharedValue(0.1);

  // Update this bar's height based on audio level or audio data
  useEffect(() => {
    if (isActive) {
      if (audioData.length > 0) {
        // Use actual audio data if provided
        const dataPerBar = Math.floor(audioData.length / barCount);
        const startIndex = index * dataPerBar;
        const endIndex = startIndex + dataPerBar;
        const barData = audioData.slice(startIndex, endIndex);
        const average = barData.reduce((sum, val) => sum + val, 0) / barData.length;

        barHeight.value = withSpring(Math.max(0.1, Math.min(1, average)), {
          damping: 15,
          stiffness: 150,
          mass: 0.5,
        });
      } else {
        // Use audio level with wave effect
        const offset = Math.sin((index / barCount) * Math.PI * 2);
        const randomVariation = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
        const targetHeight = audioLevel * randomVariation * (1 + offset * 0.3);

        barHeight.value = withSpring(Math.max(0.1, targetHeight), {
          damping: 10 + index * 0.2, // Vary damping for wave effect
          stiffness: 100,
          mass: 0.3,
        });
      }
    } else {
      // Reset to minimum height when not active
      barHeight.value = withTiming(0.1, { duration: 300 });
    }
  }, [audioLevel, audioData, isActive, barCount, index, barHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      barHeight.value,
      [0, 1],
      [maxHeight * 0.1, maxHeight], // Minimum 10% height
      Extrapolate.CLAMP
    );

    return {
      height,
      opacity: interpolate(
        barHeight.value,
        [0, 0.1, 1],
        [0.3, 0.6, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          width: barWidth,
          marginHorizontal: barSpacing / 2,
          backgroundColor: color,
          borderRadius: barWidth / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    alignSelf: 'center',
  },
});
