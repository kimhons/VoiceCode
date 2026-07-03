import React, { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { EditableWord, WordData } from './EditableWord';
import { useWordEditor } from '../../hooks/useWordEditor';

interface InteractiveTranscriptEditorProps {
  words: WordData[];
  onWordsChange?: (words: WordData[]) => void;
  onTimestampTap?: (timestamp: number) => void;
  currentTime?: number;
  readOnly?: boolean;
  showConfidence?: boolean;
  showTimestamps?: boolean;
  // External control props
  currentWordIndex?: number;
  editingIndex?: number | null;
  searchMatchIndices?: number[];
  currentSearchMatchIndex?: number;
  // External event handlers
  onWordTap?: (index: number) => void;
  onWordLongPress?: (index: number) => void;
  onWordEdit?: (index: number, newWord: string) => void;
  onWordDelete?: (index: number) => void;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

export const InteractiveTranscriptEditor: React.FC<InteractiveTranscriptEditorProps> = ({
  words,
  onWordsChange,
  onTimestampTap,
  currentTime = 0,
  readOnly = false,
  showConfidence = true,
  showTimestamps = false,
  // External control props
  currentWordIndex: externalCurrentWordIndex,
  editingIndex: externalEditingIndex,
  searchMatchIndices = [],
  currentSearchMatchIndex = -1,
  // External event handlers
  onWordTap: externalOnWordTap,
  onWordLongPress: externalOnWordLongPress,
  onWordEdit: externalOnWordEdit,
  onWordDelete: externalOnWordDelete,
}) => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const wordRefs = useRef<Map<number, { y: number; height: number }>>(new Map());

  // Only use internal word editor if external control is not provided
  const internalWordEditor = useWordEditor(words, onWordsChange || (() => {}));

  // Use external or internal values
  const editingIndex = externalEditingIndex !== undefined ? externalEditingIndex : internalWordEditor.editingIndex;
  const hasUnsavedChanges = internalWordEditor.hasUnsavedChanges;
  const canUndo = internalWordEditor.canUndo;
  const canRedo = internalWordEditor.canRedo;
  const startEdit = internalWordEditor.startEdit;
  const commitEdit = internalWordEditor.commitEdit;
  const cancelEdit = internalWordEditor.cancelEdit;
  const deleteWord = internalWordEditor.deleteWord;
  const undo = internalWordEditor.undo;
  const redo = internalWordEditor.redo;

  // Find current word based on playback time (use external if provided)
  const getCurrentWordIndex = useCallback(() => {
    if (externalCurrentWordIndex !== undefined) return externalCurrentWordIndex;
    if (!currentTime) return -1;
    return words.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
  }, [words, currentTime, externalCurrentWordIndex]);

  const currentWordIndex = getCurrentWordIndex();

  // Auto-scroll to current word during playback
  useEffect(() => {
    if (currentWordIndex >= 0 && scrollViewRef.current) {
      const wordPosition = wordRefs.current.get(currentWordIndex);
      if (wordPosition) {
        scrollViewRef.current.scrollTo({
          y: Math.max(0, wordPosition.y - 100),
          animated: true,
        });
      }
    }
  }, [currentWordIndex]);

  // Handle word tap
  const handleWordTap = useCallback((index: number) => {
    if (externalOnWordTap) {
      externalOnWordTap(index);
    } else if (readOnly) {
      // In read-only mode, tapping jumps to timestamp
      onTimestampTap?.(words[index].start);
    }
    // In edit mode, tap just highlights (long press to edit)
  }, [readOnly, words, onTimestampTap, externalOnWordTap]);

  // Handle long press to start editing
  const handleWordLongPress = useCallback((index: number) => {
    if (externalOnWordLongPress) {
      externalOnWordLongPress(index);
    } else if (!readOnly) {
      startEdit(index);
    }
  }, [readOnly, startEdit, externalOnWordLongPress]);

  // Handle word edit
  const handleWordEdit = useCallback((index: number, newWord: string) => {
    if (externalOnWordEdit) {
      externalOnWordEdit(index, newWord);
    } else {
      commitEdit(index, newWord);
    }
  }, [commitEdit, externalOnWordEdit]);

  // Handle timestamp tap
  const handleTimestampTap = useCallback((timestamp: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTimestampTap?.(timestamp);
  }, [onTimestampTap]);

  // Handle word delete
  const handleWordDelete = useCallback((index: number) => {
    if (externalOnWordDelete) {
      externalOnWordDelete(index);
    } else {
      deleteWord(index);
    }
  }, [deleteWord, externalOnWordDelete]);

  // Handle undo
  const handleUndo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    undo();
  }, [undo]);

  // Handle redo
  const handleRedo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    redo();
  }, [redo]);

  // Word count and stats
  const wordCount = words.length;
  const avgConfidence = words.length > 0
    ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
    : 0;

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = words.length > 0 ? words[words.length - 1].end : 0;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Toolbar */}
      {!readOnly && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.toolbar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}
        >
          <View style={styles.toolbarLeft}>
            <Pressable
              onPress={handleUndo}
              disabled={!canUndo}
              style={[styles.toolbarButton, !canUndo && styles.toolbarButtonDisabled]}
            >
              <Ionicons
                name="arrow-undo"
                size={20}
                color={canUndo ? theme.colors.primary : theme.colors.textTertiary}
              />
            </Pressable>
            <Pressable
              onPress={handleRedo}
              disabled={!canRedo}
              style={[styles.toolbarButton, !canRedo && styles.toolbarButtonDisabled]}
            >
              <Ionicons
                name="arrow-redo"
                size={20}
                color={canRedo ? theme.colors.primary : theme.colors.textTertiary}
              />
            </Pressable>
          </View>

          <View style={styles.toolbarCenter}>
            {hasUnsavedChanges && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Text style={[styles.unsavedIndicator, { color: theme.colors.warning }]}>
                  Unsaved changes
                </Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.toolbarRight}>
            <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>
              {wordCount} words
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Stats bar */}
      {showConfidence && (
        <View style={[styles.statsBar, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Duration
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {formatDuration(totalDuration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Confidence
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {(avgConfidence * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Words
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
              {wordCount}
            </Text>
          </View>
        </View>
      )}

      {/* Transcript content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        {!readOnly && words.length > 0 && (
          <Animated.View
            entering={FadeIn.delay(200)}
            style={[styles.instructions, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              Long-press a word to edit. Swipe left to delete. Tap timestamp to jump.
            </Text>
          </Animated.View>
        )}

        {/* Words */}
        <View style={styles.wordsContainer}>
          {words.map((word, index) => (
            <Animated.View
              key={`${index}-${word.word}`}
              layout={Layout.springify().damping(15).stiffness(150)}
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                wordRefs.current.set(index, { y, height });
              }}
            >
              <EditableWord
                data={word}
                index={index}
                isEditing={editingIndex === index}
                isCurrentWord={currentWordIndex === index}
                isSearchMatch={searchMatchIndices.includes(index)}
                isCurrentSearchMatch={currentSearchMatchIndex === index}
                onTap={handleWordTap}
                onLongPress={handleWordLongPress}
                onEdit={handleWordEdit}
                onTimestampTap={handleTimestampTap}
                onDelete={handleWordDelete}
              />
            </Animated.View>
          ))}
        </View>

        {/* Empty state */}
        {words.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No transcript available
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Current time indicator */}
      {showTimestamps && currentTime > 0 && (
        <View style={[styles.timeIndicator, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.timeIndicatorText}>
            {formatDuration(currentTime)}
          </Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    padding: 8,
    marginRight: 4,
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  unsavedIndicator: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsText: {
    fontSize: 12,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  timeIndicator: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InteractiveTranscriptEditor;
