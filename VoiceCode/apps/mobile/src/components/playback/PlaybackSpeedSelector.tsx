/**
 * PlaybackSpeedSelector Component
 * Bottom sheet modal for selecting playback speed
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { PLAYBACK_SPEEDS } from '../../hooks/useAudioPlayback';

interface PlaybackSpeedSelectorProps {
  visible: boolean;
  currentSpeed: number;
  onSelectSpeed: (speed: number) => void;
  onClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PlaybackSpeedSelector: React.FC<PlaybackSpeedSelectorProps> = ({
  visible,
  currentSpeed,
  onSelectSpeed,
  onClose,
}) => {
  const { theme } = useTheme();

  const handleSelectSpeed = async (speed: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectSpeed(speed);
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const getSpeedLabel = (speed: number): string => {
    if (speed === 1.0) return 'Normal';
    if (speed < 1.0) return 'Slow';
    if (speed <= 1.5) return 'Fast';
    return 'Very Fast';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
          onPress={handleClose}
        />

        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(150)}
          exiting={SlideOutDown.springify().damping(15).stiffness(150)}
          style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Playback Speed
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Speed Options */}
          <View style={styles.speedGrid}>
            {PLAYBACK_SPEEDS.map((speed) => {
              const isSelected = speed === currentSpeed;
              return (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.speedOption,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => handleSelectSpeed(speed)}
                >
                  <Text
                    style={[
                      styles.speedValue,
                      {
                        color: isSelected ? 'white' : theme.colors.textPrimary,
                      },
                    ]}
                  >
                    {speed}x
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="white"
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Current Speed Description */}
          <View
            style={[
              styles.descriptionBox,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Ionicons
              name="speedometer-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
              {getSpeedLabel(currentSpeed)} - {currentSpeed}x speed
            </Text>
          </View>

          {/* Handle indicator */}
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  handle: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 80,
  },
  speedValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 6,
  },
  descriptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  descriptionText: {
    fontSize: 14,
  },
});

export default PlaybackSpeedSelector;
