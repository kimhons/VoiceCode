// VoiceCode Pro Mobile - Audio Waveform Component

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface AudioWaveformProps {
  audioData?: number[];
  isActive?: boolean;
  barCount?: number;
  height?: number;
  barWidth?: number;
  barSpacing?: number;
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioData = [],
  isActive = false,
  barCount = 40,
  height = 60,
  barWidth = 3,
  barSpacing = 2,
  color,
}) => {
  const { theme } = useTheme();
  const animatedValues = useRef<Animated.Value[]>([]).current;

  // Initialize animated values
  if (animatedValues.length === 0) {
    for (let i = 0; i < barCount; i++) {
      animatedValues.push(new Animated.Value(0.1));
    }
  }

  // Animate bars when active
  useEffect(() => {
    if (isActive) {
      const animations = animatedValues.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 300 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 300 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      });

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      // Reset to minimum height when not active
      animatedValues.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isActive, animatedValues]);

  // Update bars based on audio data
  useEffect(() => {
    if (audioData.length > 0 && isActive) {
      const dataPerBar = Math.floor(audioData.length / barCount);
      
      animatedValues.forEach((anim, index) => {
        const startIndex = index * dataPerBar;
        const endIndex = startIndex + dataPerBar;
        const barData = audioData.slice(startIndex, endIndex);
        const average = barData.reduce((sum, val) => sum + val, 0) / barData.length;
        
        Animated.timing(anim, {
          toValue: Math.max(0.1, Math.min(1, average)),
          duration: 50,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [audioData, isActive, animatedValues, barCount]);

  const barColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, { height }]}>
      {animatedValues.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: barWidth,
              marginHorizontal: barSpacing / 2,
              backgroundColor: barColor,
              borderRadius: barWidth / 2,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.1, height],
              }),
            },
          ]}
        />
      ))}
    </View>
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

