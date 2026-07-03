/**
 * SpeakerLabel Component
 * Displays a color-coded speaker label with tap-to-rename functionality
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface Speaker {
  id: string;
  name: string;
  color: string;
}

interface SpeakerLabelProps {
  speaker: Speaker;
  timestamp?: number;
  onRename?: (speakerId: string, newName: string) => void;
  onColorChange?: (speakerId: string, newColor: string) => void;
  onTimestampTap?: (timestamp: number) => void;
  compact?: boolean;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

// Predefined speaker colors
const SPEAKER_COLORS = [
  '#667eea', // Primary purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const SpeakerLabel: React.FC<SpeakerLabelProps> = ({
  speaker,
  timestamp,
  onRename,
  onColorChange,
  onTimestampTap,
  compact = false,
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editName, setEditName] = useState(speaker.name);

  // Animation values
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  // Format timestamp
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle tap on label
  const handleTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onRename) {
      setIsEditing(true);
    }
  }, [onRename]);

  // Handle long press to show color picker
  const handleLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onColorChange) {
      setShowColorPicker(true);
    }
  }, [onColorChange]);

  // Handle timestamp tap
  const handleTimestampTap = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onTimestampTap && timestamp !== undefined) {
      onTimestampTap(timestamp);
    }
  }, [onTimestampTap, timestamp]);

  // Handle rename submit
  const handleRenameSubmit = useCallback(async () => {
    setIsEditing(false);
    if (editName.trim() && editName.trim() !== speaker.name && onRename) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRename(speaker.id, editName.trim());
    } else {
      setEditName(speaker.name);
    }
  }, [editName, speaker.name, speaker.id, onRename]);

  // Handle color selection
  const handleColorSelect = useCallback(async (color: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowColorPicker(false);
    if (onColorChange && color !== speaker.color) {
      onColorChange(speaker.id, color);
    }
  }, [speaker.id, speaker.color, onColorChange]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1 - pressed.value * 0.1,
  }));

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (compact) {
    return (
      <Pressable
        onPress={handleTap}
        onLongPress={handleLongPress}
        onPressIn={() => {
          scale.value = withSpring(0.95, SPRING_CONFIG);
          pressed.value = withTiming(1, { duration: 100 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_CONFIG);
          pressed.value = withTiming(0, { duration: 150 });
        }}
      >
        <Animated.View
          style={[
            styles.compactContainer,
            { backgroundColor: `${speaker.color}20` },
            animatedStyle,
          ]}
        >
          <View style={[styles.colorDot, { backgroundColor: speaker.color }]} />
          <Text style={[styles.compactName, { color: speaker.color }]}>
            {speaker.name}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(200)}
        style={styles.container}
      >
        {/* Speaker Avatar */}
        <Pressable
          onPress={handleTap}
          onLongPress={handleLongPress}
          onPressIn={() => {
            scale.value = withSpring(0.95, SPRING_CONFIG);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, SPRING_CONFIG);
          }}
        >
          <Animated.View
            style={[
              styles.avatar,
              { backgroundColor: speaker.color },
              animatedStyle,
            ]}
          >
            <Text style={styles.avatarText}>{getInitials(speaker.name)}</Text>
          </Animated.View>
        </Pressable>

        {/* Speaker Name */}
        <View style={styles.infoContainer}>
          {isEditing ? (
            <TextInput
              style={[
                styles.nameInput,
                {
                  color: theme.colors.textPrimary,
                  borderColor: speaker.color,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              onSubmitEditing={handleRenameSubmit}
              onBlur={handleRenameSubmit}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
            />
          ) : (
            <Pressable onPress={handleTap} onLongPress={handleLongPress}>
              <Text style={[styles.speakerName, { color: theme.colors.textPrimary }]}>
                {speaker.name}
              </Text>
            </Pressable>
          )}

          {/* Timestamp */}
          {timestamp !== undefined && (
            <Pressable onPress={handleTimestampTap}>
              <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                {formatTimestamp(timestamp)}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Edit indicator */}
        {onRename && !isEditing && (
          <Ionicons
            name="pencil"
            size={14}
            color={theme.colors.textTertiary}
            style={styles.editIcon}
          />
        )}
      </Animated.View>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowColorPicker(false)}
        >
          <View
            style={[
              styles.colorPickerContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text style={[styles.colorPickerTitle, { color: theme.colors.textPrimary }]}>
              Choose Color
            </Text>
            <View style={styles.colorGrid}>
              {SPEAKER_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => handleColorSelect(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    speaker.color === color && styles.colorOptionSelected,
                  ]}
                >
                  {speaker.color === color && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  speakerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  nameInput: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderRadius: 6,
  },
  timestamp: {
    fontSize: 12,
  },
  editIcon: {
    marginLeft: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactName: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    width: 280,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default SpeakerLabel;
