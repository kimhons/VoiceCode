import React, { useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface WordData {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface EditableWordProps {
  data: WordData;
  index: number;
  isEditing: boolean;
  isCurrentWord: boolean;
  isSearchMatch?: boolean;
  isCurrentSearchMatch?: boolean;
  onTap: (index: number) => void;
  onLongPress: (index: number) => void;
  onEdit: (index: number, newWord: string) => void;
  onTimestampTap: (timestamp: number) => void;
  onDelete: (index: number) => void;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

const DELETE_THRESHOLD = -80;

export const EditableWord: React.FC<EditableWordProps> = ({
  data,
  index,
  isEditing,
  isCurrentWord,
  isSearchMatch = false,
  isCurrentSearchMatch = false,
  onTap,
  onLongPress,
  onEdit,
  onTimestampTap,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [editText, setEditText] = useState(data.word);
  const inputRef = useRef<TextInput>(null);

  // Shared values for animations
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);
  const searchHighlight = useSharedValue(isCurrentSearchMatch ? 1 : 0);

  // Animate search highlight when current match changes
  React.useEffect(() => {
    searchHighlight.value = withSpring(isCurrentSearchMatch ? 1 : 0, SPRING_CONFIG);
  }, [isCurrentSearchMatch, searchHighlight]);

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return theme.colors.success;
    if (confidence >= 0.7) return theme.colors.warning;
    return theme.colors.error;
  };

  const confidenceColor = getConfidenceColor(data.confidence);

  // Haptic feedback helpers
  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerMediumHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const triggerHeavyHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Handle tap
  const handleTap = useCallback(() => {
    triggerLightHaptic();
    onTap(index);
  }, [index, onTap, triggerLightHaptic]);

  // Handle long press
  const handleLongPress = useCallback(() => {
    triggerMediumHaptic();
    onLongPress(index);
  }, [index, onLongPress, triggerMediumHaptic]);

  // Handle delete
  const handleDelete = useCallback(() => {
    triggerHeavyHaptic();
    onDelete(index);
  }, [index, onDelete, triggerHeavyHaptic]);

  // Handle timestamp tap
  const handleTimestampTap = useCallback(() => {
    triggerLightHaptic();
    onTimestampTap(data.start);
  }, [data.start, onTimestampTap, triggerLightHaptic]);

  // Handle edit submit
  const handleEditSubmit = useCallback(() => {
    if (editText.trim() !== data.word) {
      triggerSuccessHaptic();
      onEdit(index, editText.trim());
    } else {
      triggerLightHaptic();
    }
  }, [editText, data.word, index, onEdit, triggerSuccessHaptic, triggerLightHaptic]);

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(1.05, SPRING_CONFIG);
      pressed.value = withTiming(1, { duration: 100 });
    })
    .onEnd(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
      pressed.value = withTiming(0, { duration: 150 });
      runOnJS(handleTap)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
      pressed.value = withTiming(0, { duration: 150 });
    });

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      scale.value = withSpring(1.1, SPRING_CONFIG);
      runOnJS(handleLongPress)();
    })
    .onEnd(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
    });

  // Pan gesture for swipe-to-delete
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, DELETE_THRESHOLD - 20);
        deleteOpacity.value = Math.min(Math.abs(event.translationX) / Math.abs(DELETE_THRESHOLD), 1);
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-200, { duration: 200 });
        deleteOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleDelete)();
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        deleteOpacity.value = withTiming(0, { duration: 150 });
      }
    });

  // Combine gestures
  const combinedGesture = Gesture.Race(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  // Search highlight colors
  const searchMatchBg = `${theme.colors.warning}40`; // Yellow/amber background for matches
  const currentSearchMatchBg = `${theme.colors.primary}50`; // Primary color for current match

  // Animated styles
  const animatedWordStyle = useAnimatedStyle(() => {
    // Determine base background color based on search state
    let baseBg = 'transparent';
    if (isSearchMatch && !isCurrentSearchMatch) {
      baseBg = searchMatchBg;
    }

    // Interpolate between base and pressed state
    const pressedBg = interpolateColor(
      pressed.value,
      [0, 1],
      [baseBg, `${confidenceColor}20`]
    );

    // Interpolate current search match highlight
    const searchBg = interpolateColor(
      searchHighlight.value,
      [0, 1],
      [pressedBg, currentSearchMatchBg]
    );

    return {
      transform: [
        { scale: scale.value * (1 + searchHighlight.value * 0.03) }, // Slight scale boost for current match
        { translateX: translateX.value },
      ],
      backgroundColor: searchBg,
    };
  });

  const animatedDeleteStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
    transform: [{ scale: deleteOpacity.value }],
  }));

  // Format timestamp
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Editing mode
  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.editInput,
            {
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
            },
          ]}
          value={editText}
          onChangeText={setEditText}
          onSubmitEditing={handleEditSubmit}
          onBlur={handleEditSubmit}
          autoFocus
          selectTextOnFocus
          returnKeyType="done"
        />
        <Pressable
          onPress={handleTimestampTap}
          style={[styles.timestampBadge, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Text style={[styles.timestampText, { color: theme.colors.textSecondary }]}>
            {formatTimestamp(data.start)}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wordWrapper}>
      {/* Delete indicator */}
      <Animated.View
        style={[
          styles.deleteIndicator,
          { backgroundColor: theme.colors.error },
          animatedDeleteStyle,
        ]}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={combinedGesture}>
        <AnimatedPressable
          style={[
            styles.wordContainer,
            isCurrentWord && {
              backgroundColor: `${theme.colors.primary}30`,
              borderRadius: 4,
            },
            isSearchMatch && styles.searchMatch,
            isCurrentSearchMatch && [
              styles.currentSearchMatch,
              { borderColor: theme.colors.primary },
            ],
            animatedWordStyle,
          ]}
        >
          <Text
            style={[
              styles.wordText,
              { color: theme.colors.textPrimary },
              data.confidence < 0.7 && styles.lowConfidence,
              isSearchMatch && styles.searchMatchText,
              isCurrentSearchMatch && styles.currentSearchMatchText,
            ]}
          >
            {data.word}
          </Text>
          {/* Confidence underline */}
          <View
            style={[
              styles.confidenceBar,
              {
                backgroundColor: confidenceColor,
                width: `${data.confidence * 100}%`,
              },
            ]}
          />
        </AnimatedPressable>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wordWrapper: {
    position: 'relative',
    marginRight: 6,
    marginVertical: 4,
  },
  wordContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    position: 'relative',
  },
  wordText: {
    fontSize: 16,
    lineHeight: 24,
  },
  lowConfidence: {
    fontStyle: 'italic',
  },
  searchMatch: {
    borderRadius: 4,
  },
  searchMatchText: {
    fontWeight: '500',
  },
  currentSearchMatch: {
    borderWidth: 2,
    borderRadius: 6,
  },
  currentSearchMatchText: {
    fontWeight: '700',
  },
  confidenceBar: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    height: 2,
    borderRadius: 1,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    marginVertical: 4,
  },
  editInput: {
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 2,
    minWidth: 60,
  },
  timestampBadge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timestampText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deleteIndicator: {
    position: 'absolute',
    right: -60,
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EditableWord;
