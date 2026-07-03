/**
 * TranscriptSearchBar Component
 * Search functionality for transcript with navigation between matches
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
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
import { WordData } from './EditableWord';

interface TranscriptSearchBarProps {
  words: WordData[];
  onSearchResults: (matchingIndices: number[], currentMatchIndex: number) => void;
  onNavigateToMatch: (wordIndex: number) => void;
  onClose?: () => void;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

export const TranscriptSearchBar: React.FC<TranscriptSearchBarProps> = ({
  words,
  onSearchResults,
  onNavigateToMatch,
  onClose,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const inputScale = useSharedValue(1);

  // Find all matching word indices
  const matchingIndices = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const indices: number[] = [];

    words.forEach((word, index) => {
      if (word.word.toLowerCase().includes(query)) {
        indices.push(index);
      }
    });

    return indices;
  }, [words, searchQuery]);

  // Total matches count
  const totalMatches = matchingIndices.length;

  // Notify parent of search results
  useEffect(() => {
    onSearchResults(matchingIndices, currentMatchIndex);

    // Navigate to first match when results change
    if (matchingIndices.length > 0 && currentMatchIndex < matchingIndices.length) {
      onNavigateToMatch(matchingIndices[currentMatchIndex]);
    }
  }, [matchingIndices, currentMatchIndex, onSearchResults, onNavigateToMatch]);

  // Reset current match when query changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // Navigate to next match
  const handleNextMatch = useCallback(async () => {
    if (totalMatches === 0) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextIndex = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIndex);
    onNavigateToMatch(matchingIndices[nextIndex]);
  }, [totalMatches, currentMatchIndex, matchingIndices, onNavigateToMatch]);

  // Navigate to previous match
  const handlePrevMatch = useCallback(async () => {
    if (totalMatches === 0) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prevIndex = currentMatchIndex === 0 ? totalMatches - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    onNavigateToMatch(matchingIndices[prevIndex]);
  }, [totalMatches, currentMatchIndex, matchingIndices, onNavigateToMatch]);

  // Clear search
  const handleClear = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setCurrentMatchIndex(0);
    Keyboard.dismiss();
  }, []);

  // Close search bar
  const handleClose = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setCurrentMatchIndex(0);
    Keyboard.dismiss();
    onClose?.();
  }, [onClose]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    inputScale.value = withSpring(1.02, SPRING_CONFIG);
  }, [inputScale]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    inputScale.value = withSpring(1, SPRING_CONFIG);
  }, [inputScale]);

  // Animated styles
  const inputContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      {/* Search Input */}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: isFocused ? theme.colors.primary : 'transparent',
          },
          inputContainerStyle,
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary }]}
          placeholder="Search transcript..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Results & Navigation */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsContainer}>
          {/* Match Count */}
          <Text style={[styles.matchCount, { color: theme.colors.textSecondary }]}>
            {totalMatches === 0
              ? 'No matches'
              : `${currentMatchIndex + 1} of ${totalMatches}`}
          </Text>

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: theme.colors.surfaceVariant },
                totalMatches === 0 && styles.navButtonDisabled,
              ]}
              onPress={handlePrevMatch}
              disabled={totalMatches === 0}
            >
              <Ionicons
                name="chevron-up"
                size={18}
                color={totalMatches > 0 ? theme.colors.textPrimary : theme.colors.textTertiary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: theme.colors.surfaceVariant },
                totalMatches === 0 && styles.navButtonDisabled,
              ]}
              onPress={handleNextMatch}
              disabled={totalMatches === 0}
            >
              <Ionicons
                name="chevron-down"
                size={18}
                color={totalMatches > 0 ? theme.colors.textPrimary : theme.colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          {onClose && (
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleClose}
            >
              <Text style={[styles.closeText, { color: theme.colors.primary }]}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchCount: {
    fontSize: 13,
    minWidth: 70,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TranscriptSearchBar;
