// VoiceFlow Pro Mobile - Record Button Component

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface RecordButtonProps {
  isRecording: boolean;
  isPaused?: boolean;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  isPaused = false,
  onPress,
  size = 80,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording, isPaused, pulseAnim]);

  const outerSize = size;
  const innerSize = size * 0.6;
  const borderWidth = 4;

  const getButtonColor = () => {
    if (disabled) return theme.colors.disabled;
    if (isRecording) return theme.colors.error;
    return theme.colors.primary;
  };

  const getInnerShape = () => {
    if (isPaused) {
      // Pause icon (two bars)
      return (
        <View style={styles.pauseContainer}>
          <View
            style={[
              styles.pauseBar,
              {
                backgroundColor: '#FFFFFF',
                width: innerSize * 0.25,
                height: innerSize * 0.6,
              },
            ]}
          />
          <View
            style={[
              styles.pauseBar,
              {
                backgroundColor: '#FFFFFF',
                width: innerSize * 0.25,
                height: innerSize * 0.6,
              },
            ]}
          />
        </View>
      );
    }

    if (isRecording) {
      // Stop icon (square)
      return (
        <View
          style={[
            styles.stopSquare,
            {
              width: innerSize * 0.5,
              height: innerSize * 0.5,
              backgroundColor: '#FFFFFF',
              borderRadius: theme.borderRadius.xs,
            },
          ]}
        />
      );
    }

    // Record icon (circle)
    return (
      <View
        style={[
          styles.recordCircle,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: theme.colors.error,
          },
        ]}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={styles.container}
    >
      {/* Pulse ring (only when recording) */}
      {isRecording && !isPaused && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: outerSize + 20,
              height: outerSize + 20,
              borderRadius: (outerSize + 20) / 2,
              borderColor: getButtonColor(),
              borderWidth: 2,
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.5, 0],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Outer circle */}
      <View
        style={[
          styles.outerCircle,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderColor: getButtonColor(),
            borderWidth,
            backgroundColor: 'transparent',
          },
        ]}
      >
        {/* Inner button */}
        <View
          style={[
            styles.innerButton,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: getButtonColor(),
            },
          ]}
        >
          {getInnerShape()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
  },
  outerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordCircle: {},
  stopSquare: {},
  pauseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '60%',
  },
  pauseBar: {
    borderRadius: 2,
  },
});

