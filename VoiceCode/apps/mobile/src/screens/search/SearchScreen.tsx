// VoiceCode Mobile - Enhanced Search Screen
// Voice search, search history, suggestions, and Apple-caliber animations

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAppDispatch, useAppSelector } from '../../store';
import { searchTranscripts, setFilters, clearResults } from '../../store/slices/searchSlice';
import { HomeStackParamList } from '../../navigation/types';
import { elevation, blurIntensity } from '../../theme';

type SearchScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Search'>;
type SearchScreenRouteProp = RouteProp<HomeStackParamList, 'Search'>;

interface SearchScreenProps {
  navigation: SearchScreenNavigationProp;
  route: SearchScreenRouteProp;
}

/**
 * SearchScreen Component
 * Full-text search across transcripts with filters
 */
export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux state
  const { results, searchLoading, searchError, filters } = useAppSelector(
    (state) => state.search
  );
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Local state
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);

  // Animation values
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const historyOpacity = useRef(new Animated.Value(0)).current;

  /**
   * Debounce search query
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Perform search when debounced query changes
   */
  useEffect(() => {
    if (debouncedQuery.trim().length > 0 && userId) {
      dispatch(setFilters({ query: debouncedQuery }));
      dispatch(searchTranscripts({ userId, filters: { ...filters, query: debouncedQuery } }));

      // Add to search history
      if (!searchHistory.includes(debouncedQuery)) {
        const newHistory = [debouncedQuery, ...searchHistory.slice(0, 9)]; // Keep last 10
        setSearchHistory(newHistory);
        // TODO: Persist to AsyncStorage
      }
    } else if (debouncedQuery.trim().length === 0) {
      dispatch(clearResults());
    }
  }, [debouncedQuery, userId, dispatch]);

  /**
   * Load search history on mount
   */
  useEffect(() => {
    // TODO: Load from AsyncStorage
    const mockHistory = [
      'meeting notes',
      'project discussion',
      'interview transcript',
      'brainstorming session',
    ];
    setSearchHistory(mockHistory);
  }, []);

  /**
   * Generate search suggestions based on query
   */
  useEffect(() => {
    if (searchQuery.length > 0) {
      // Filter history for suggestions
      const filtered = searchHistory.filter((item) =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowHistory(true);

      // Animate history appearance
      Animated.timing(historyOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      setShowHistory(false);
      Animated.timing(historyOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [searchQuery, searchHistory, historyOpacity]);

  /**
   * Clear search
   */
  const handleClearSearch = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    dispatch(clearResults());
    setShowHistory(false);
  }, [dispatch]);

  /**
   * Navigate to advanced filters
   */
  const handleAdvancedFilters = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AdvancedFilter');
  }, [navigation]);

  /**
   * Handle voice search
   */
  const handleVoiceSearch = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsVoiceSearching(true);

      // Animate search bar
      Animated.sequence([
        Animated.timing(searchBarScale, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(searchBarScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // TODO: Implement actual voice recognition
      // For now, simulate voice search
      setTimeout(() => {
        setIsVoiceSearching(false);
        setSearchQuery('meeting notes'); // Mock result
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
    } catch (error) {
      console.error('Voice search error:', error);
      setIsVoiceSearching(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [searchBarScale]);

  /**
   * Handle suggestion selection
   */
  const handleSuggestionPress = useCallback(async (suggestion: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery(suggestion);
    setShowHistory(false);
  }, []);

  /**
   * Handle search input focus
   */
  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length === 0 && searchHistory.length > 0) {
      setShowHistory(true);
      Animated.timing(historyOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [searchQuery, searchHistory, historyOpacity]);

  /**
   * Navigate to transcript detail
   */
  const handleResultPress = useCallback(
    (transcriptId: string) => {
      // TODO: Navigate to transcript detail screen
      console.log('Navigate to transcript:', transcriptId);
    },
    []
  );

  /**
   * Format duration
   */
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Render search history/suggestions content
   */
  const renderHistoryContent = () => {
    const items = searchQuery.length > 0 ? suggestions : searchHistory.slice(0, 5);

    return (
      <View style={styles.historyList}>
        <View style={styles.historyHeader}>
          <Text variant="caption" style={styles.historyTitle}>
            {searchQuery.length > 0 ? 'Suggestions' : 'Recent Searches'}
          </Text>
          {searchHistory.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchHistory([]);
                setShowHistory(false);
              }}
            >
              <Text variant="caption" style={[styles.clearHistory, { color: theme.colors.primary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.historyItem}
            onPress={() => handleSuggestionPress(item)}
          >
            <Ionicons
              name={searchQuery.length > 0 ? 'search' : 'time-outline'}
              size={18}
              color={theme.colors.textSecondary}
            />
            <Text variant="body" style={styles.historyText}>
              {item}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Render search result item
   */
  const renderResultItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`result-${item.id}`}
      onPress={() => handleResultPress(item.id)}
    >
      <Card elevation={1} style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text variant="h6" style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.duration && (
            <Text variant="caption" style={styles.duration}>
              {formatDuration(item.duration)}
            </Text>
          )}
        </View>

        {item.matchedText && (
          <Text variant="body" style={styles.matchedText} numberOfLines={2}>
            {item.matchedText}
          </Text>
        )}

        <View style={styles.resultFooter}>
          <Text variant="caption" style={styles.date}>
            {formatDate(item.createdAt)}
          </Text>

          {item.tags && item.tags.length > 0 && (
            <View style={styles.tags}>
              {item.tags.slice(0, 3).map((tag: string, index: number) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: theme.colors.primary + '20' }]}
                >
                  <Text variant="caption" style={[styles.tagText, { color: theme.colors.primary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, { backgroundColor: theme.colors.surface }]}>
        <Animated.View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
              transform: [{ scale: searchBarScale }],
            },
            elevation.sm,
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            testID="search-input"
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search transcripts..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleSearchFocus}
            autoFocus
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity testID="clear-search" onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              testID="voice-search"
              onPress={handleVoiceSearch}
              disabled={isVoiceSearching}
            >
              <Ionicons
                name={isVoiceSearching ? 'mic' : 'mic-outline'}
                size={20}
                color={isVoiceSearching ? theme.colors.error : theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>

        <TouchableOpacity
          testID="advanced-filters"
          onPress={handleAdvancedFilters}
          style={[styles.filterButton, elevation.xs]}
        >
          <Ionicons name="options-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search History / Suggestions */}
      {showHistory && (suggestions.length > 0 || searchHistory.length > 0) && (
        <Animated.View
          style={[
            styles.historyContainer,
            { opacity: historyOpacity },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={blurIntensity.light}
              tint="light"
              style={styles.historyBlur}
            >
              {renderHistoryContent()}
            </BlurView>
          ) : (
            <View style={[styles.historyContent, { backgroundColor: theme.colors.surface }]}>
              {renderHistoryContent()}
            </View>
          )}
        </Animated.View>
      )}

      {/* Search Results */}
      {searchLoading ? (
        <View style={styles.centerContent}>
          <LoadingSpinner size="large" />
          <Text variant="body" style={styles.loadingText}>
            Searching...
          </Text>
        </View>
      ) : searchError ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text variant="h6" style={styles.errorTitle}>
            Search failed
          </Text>
          <Text variant="body" style={styles.errorMessage}>
            {searchError}
          </Text>
        </View>
      ) : searchQuery.trim().length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
          <Text variant="h6" style={styles.emptyTitle}>
            Search your transcripts
          </Text>
          <Text variant="body" style={styles.emptyMessage}>
            Enter keywords to find transcripts
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
          <Text variant="h6" style={styles.emptyTitle}>
            No results found
          </Text>
          <Text variant="body" style={styles.emptyMessage}>
            Try different keywords or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          ListHeaderComponent={
            <Text variant="caption" style={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  historyContainer: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyBlur: {
    borderRadius: 12,
  },
  historyContent: {
    borderRadius: 12,
  },
  historyList: {
    padding: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  historyTitle: {
    fontWeight: '600',
    opacity: 0.7,
  },
  clearHistory: {
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    borderRadius: 8,
  },
  historyText: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  resultsList: {
    padding: 16,
  },
  resultsCount: {
    marginBottom: 12,
    opacity: 0.7,
  },
  resultCard: {
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    flex: 1,
    marginRight: 8,
  },
  duration: {
    opacity: 0.7,
  },
  matchedText: {
    marginBottom: 12,
    opacity: 0.8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    opacity: 0.7,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
  },
});

