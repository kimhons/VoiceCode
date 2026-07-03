// VoiceCode Mobile - Enhanced Advanced Filter Screen
// Multi-criteria filtering, saved presets, filter analytics, quick filters, and Apple-caliber design

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  TextInput,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { DatePickerWrapper } from '../../components/common/DatePickerWrapper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { setFilters, clearFilters, getTags, getFolders } from '../../store/slices/searchSlice';
import { HomeStackParamList } from '../../navigation/types';
import { elevation, blurIntensity } from '../../theme';

type AdvancedFilterScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'AdvancedFilter'>;
type AdvancedFilterScreenRouteProp = RouteProp<HomeStackParamList, 'AdvancedFilter'>;

interface AdvancedFilterScreenProps {
  navigation: AdvancedFilterScreenNavigationProp;
  route: AdvancedFilterScreenRouteProp;
}

type SortOption = 'relevance' | 'date' | 'duration' | 'title';
type SortOrder = 'asc' | 'desc';

interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  filters: {
    dateFrom?: string;
    dateTo?: string;
    minDuration?: number;
    maxDuration?: number;
    tags?: string[];
    folders?: string[];
    sortBy?: SortOption;
    sortOrder?: SortOrder;
  };
}

/**
 * AdvancedFilterScreen Component
 * Enhanced advanced filtering UI with presets, analytics, and quick filters
 */
export const AdvancedFilterScreen: React.FC<AdvancedFilterScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux state
  const { filters, tags, folders } = useAppSelector((state) => state.search);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Local state for filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );
  const [minDuration, setMinDuration] = useState<number | undefined>(filters.minDuration);
  const [maxDuration, setMaxDuration] = useState<number | undefined>(filters.maxDuration);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [selectedFolders, setSelectedFolders] = useState<string[]>(filters.folders || []);
  const [sortBy, setSortBy] = useState<SortOption>(filters.sortBy || 'date');
  const [sortOrder, setSortOrder] = useState<SortOrder>(filters.sortOrder || 'desc');

  // Date picker visibility
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  // Enhanced state
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  // Animation values
  const presetSlide = useRef(new Animated.Value(-100)).current;
  const analyticsSlide = useRef(new Animated.Value(300)).current;

  /**
   * Quick filter presets
   */
  const quickFilters: FilterPreset[] = [
    {
      id: 'today',
      name: 'Today',
      icon: 'today-outline',
      filters: {
        dateFrom: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        dateTo: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
        sortBy: 'date',
        sortOrder: 'desc',
      },
    },
    {
      id: 'this-week',
      name: 'This Week',
      icon: 'calendar-outline',
      filters: {
        dateFrom: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
        dateTo: new Date().toISOString(),
        sortBy: 'date',
        sortOrder: 'desc',
      },
    },
    {
      id: 'this-month',
      name: 'This Month',
      icon: 'calendar-outline',
      filters: {
        dateFrom: new Date(new Date().setDate(1)).toISOString(),
        dateTo: new Date().toISOString(),
        sortBy: 'date',
        sortOrder: 'desc',
      },
    },
    {
      id: 'long-recordings',
      name: 'Long (>30min)',
      icon: 'time-outline',
      filters: {
        minDuration: 1800, // 30 minutes in seconds
        sortBy: 'duration',
        sortOrder: 'desc',
      },
    },
    {
      id: 'short-recordings',
      name: 'Short (<5min)',
      icon: 'time-outline',
      filters: {
        maxDuration: 300, // 5 minutes in seconds
        sortBy: 'duration',
        sortOrder: 'asc',
      },
    },
  ];

  /**
   * Load tags and folders on mount
   */
  useEffect(() => {
    if (userId) {
      dispatch(getTags(userId));
      dispatch(getFolders(userId));
    }

    // Load saved presets from AsyncStorage (TODO: implement persistence)
    // For now, use mock data
    setSavedPresets([]);
  }, [userId, dispatch]);

  /**
   * Toggle tag selection
   */
  const toggleTag = useCallback(async (tagId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  /**
   * Toggle folder selection
   */
  const toggleFolder = useCallback(async (folderId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  }, []);

  /**
   * Apply quick filter
   */
  const handleApplyQuickFilter = useCallback(async (preset: FilterPreset) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveQuickFilter(preset.id);

    // Apply preset filters
    if (preset.filters.dateFrom) setDateFrom(new Date(preset.filters.dateFrom));
    if (preset.filters.dateTo) setDateTo(new Date(preset.filters.dateTo));
    if (preset.filters.minDuration !== undefined) setMinDuration(preset.filters.minDuration);
    if (preset.filters.maxDuration !== undefined) setMaxDuration(preset.filters.maxDuration);
    if (preset.filters.tags) setSelectedTags(preset.filters.tags);
    if (preset.filters.folders) setSelectedFolders(preset.filters.folders);
    if (preset.filters.sortBy) setSortBy(preset.filters.sortBy);
    if (preset.filters.sortOrder) setSortOrder(preset.filters.sortOrder);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  /**
   * Save current filters as preset
   */
  const handleSavePreset = useCallback(async () => {
    if (!presetName.trim()) {
      Alert.alert('Error', 'Please enter a preset name');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      icon: 'bookmark-outline',
      filters: {
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        minDuration,
        maxDuration,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        folders: selectedFolders.length > 0 ? selectedFolders : undefined,
        sortBy,
        sortOrder,
      },
    };

    setSavedPresets(prev => [...prev, newPreset]);
    setShowPresetModal(false);
    setPresetName('');

    // TODO: Persist to AsyncStorage
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [presetName, dateFrom, dateTo, minDuration, maxDuration, selectedTags, selectedFolders, sortBy, sortOrder]);

  /**
   * Delete saved preset
   */
  const handleDeletePreset = useCallback(async (presetId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Preset',
      'Are you sure you want to delete this preset?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSavedPresets(prev => prev.filter(p => p.id !== presetId));
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // TODO: Persist to AsyncStorage
          },
        },
      ]
    );
  }, []);

  /**
   * Show analytics
   */
  const handleShowAnalytics = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAnalytics(true);

    Animated.spring(analyticsSlide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [analyticsSlide]);

  /**
   * Hide analytics
   */
  const handleHideAnalytics = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(analyticsSlide, {
      toValue: 300,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start(() => {
      setShowAnalytics(false);
    });
  }, [analyticsSlide]);

  /**
   * Apply filters
   */
  const handleApplyFilters = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    dispatch(
      setFilters({
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
        minDuration,
        maxDuration,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        folders: selectedFolders.length > 0 ? selectedFolders : undefined,
        sortBy,
        sortOrder,
      })
    );

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }, [
    dateFrom,
    dateTo,
    minDuration,
    maxDuration,
    selectedTags,
    selectedFolders,
    sortBy,
    sortOrder,
    dispatch,
    navigation,
  ]);

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinDuration(undefined);
    setMaxDuration(undefined);
    setSelectedTags([]);
    setSelectedFolders([]);
    setSortBy('date');
    setSortOrder('desc');
    dispatch(clearFilters());
  }, [dispatch]);

  /**
   * Format date for display
   */
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString();
  };

  /**
   * Format duration for display
   */
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return 'Not set';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Analytics Button */}
        <View style={styles.header}>
          <Text variant="h5">Advanced Filters</Text>
          <TouchableOpacity onPress={handleShowAnalytics} style={styles.analyticsButton}>
            <Ionicons name="stats-chart-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <View style={styles.quickFiltersSection}>
          <Text variant="h6" style={styles.sectionTitle}>
            Quick Filters
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersScroll}>
            {quickFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => handleApplyQuickFilter(filter)}
                style={[
                  styles.quickFilterChip,
                  activeQuickFilter === filter.id && styles.quickFilterChipActive,
                  { borderColor: theme.colors.primary },
                ]}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={18}
                  color={activeQuickFilter === filter.id ? '#fff' : theme.colors.primary}
                />
                <Text
                  variant="caption"
                  style={[
                    styles.quickFilterText,
                    activeQuickFilter === filter.id && styles.quickFilterTextActive,
                  ]}
                >
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Saved Presets */}
        {savedPresets.length > 0 && (
          <View style={styles.presetsSection}>
            <View style={styles.presetHeader}>
              <Text variant="h6" style={styles.sectionTitle}>
                Saved Presets
              </Text>
              <TouchableOpacity onPress={() => setShowPresetModal(true)}>
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.presetsList}>
              {savedPresets.map((preset) => (
                <Card key={preset.id} elevation={1} style={styles.presetCard}>
                  <TouchableOpacity
                    onPress={() => handleApplyQuickFilter(preset)}
                    style={styles.presetContent}
                  >
                    <Ionicons name={preset.icon as any} size={20} color={theme.colors.primary} />
                    <Text variant="body" style={styles.presetName}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePreset(preset.id)}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Save Current Filters Button */}
        <TouchableOpacity
          onPress={() => setShowPresetModal(true)}
          style={[styles.savePresetButton, { backgroundColor: theme.colors.surface }]}
        >
          <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} />
          <Text variant="body" style={{ color: theme.colors.primary }}>
            Save Current Filters as Preset
          </Text>
        </TouchableOpacity>

        {/* Date Range Section */}
        <Card elevation={1} style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Date Range
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text variant="label" style={styles.label}>
                From
              </Text>
              <TouchableOpacity
                testID="date-from-button"
                onPress={() => setShowDateFromPicker(true)}
                style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                <Text variant="body" style={styles.dateText}>
                  {formatDate(dateFrom)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text variant="label" style={styles.label}>
                To
              </Text>
              <TouchableOpacity
                testID="date-to-button"
                onPress={() => setShowDateToPicker(true)}
                style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                <Text variant="body" style={styles.dateText}>
                  {formatDate(dateTo)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {dateFrom && (
            <Button
              testID="clear-date-from"
              onPress={() => setDateFrom(undefined)}
              variant="secondary"
              style={styles.clearButton}
            >
              Clear From Date
            </Button>
          )}
          {dateTo && (
            <Button
              testID="clear-date-to"
              onPress={() => setDateTo(undefined)}
              variant="secondary"
              style={styles.clearButton}
            >
              Clear To Date
            </Button>
          )}
        </Card>

        {/* Duration Range Section */}
        <Card elevation={1} style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Duration
          </Text>

          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <Text variant="label" style={styles.label}>
                Min (seconds)
              </Text>
              <View style={[styles.durationButtons, { borderColor: theme.colors.border }]}>
                <TouchableOpacity
                  testID="min-duration-60"
                  onPress={() => setMinDuration(60)}
                  style={[
                    styles.durationButton,
                    minDuration === 60 && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[styles.durationButtonText, minDuration === 60 && styles.durationButtonTextActive]}
                  >
                    1 min
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="min-duration-300"
                  onPress={() => setMinDuration(300)}
                  style={[
                    styles.durationButton,
                    minDuration === 300 && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[styles.durationButtonText, minDuration === 300 && styles.durationButtonTextActive]}
                  >
                    5 min
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="min-duration-600"
                  onPress={() => setMinDuration(600)}
                  style={[
                    styles.durationButton,
                    minDuration === 600 && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[styles.durationButtonText, minDuration === 600 && styles.durationButtonTextActive]}
                  >
                    10 min
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.durationField}>
              <Text variant="label" style={styles.label}>
                Max (seconds)
              </Text>
              <View style={[styles.durationButtons, { borderColor: theme.colors.border }]}>
                <TouchableOpacity
                  testID="max-duration-300"
                  onPress={() => setMaxDuration(300)}
                  style={[
                    styles.durationButton,
                    maxDuration === 300 && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[styles.durationButtonText, maxDuration === 300 && styles.durationButtonTextActive]}
                  >
                    5 min
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="max-duration-600"
                  onPress={() => setMaxDuration(600)}
                  style={[
                    styles.durationButton,
                    maxDuration === 600 && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[styles.durationButtonText, maxDuration === 600 && styles.durationButtonTextActive]}
                  >
                    10 min
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="max-duration-1800"
                  onPress={() => setMaxDuration(1800)}
                  style={[
                    styles.durationButton,
                    maxDuration === 1800 && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[styles.durationButtonText, maxDuration === 1800 && styles.durationButtonTextActive]}
                  >
                    30 min
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {(minDuration || maxDuration) && (
            <Button
              testID="clear-duration"
              onPress={() => {
                setMinDuration(undefined);
                setMaxDuration(undefined);
              }}
              variant="secondary"
              style={styles.clearButton}
            >
              Clear Duration
            </Button>
          )}
        </Card>

        {/* Tags Section */}
        {tags.length > 0 && (
          <Card elevation={1} style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>
              Tags
            </Text>
            <View style={styles.chipContainer}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  testID={`tag-${tag.id}`}
                  onPress={() => toggleTag(tag.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : theme.colors.surface,
                      borderColor: tag.color,
                    },
                  ]}
                >
                  <Text
                    variant="body"
                    style={[
                      styles.chipText,
                      { color: selectedTags.includes(tag.id) ? '#fff' : theme.colors.textPrimary },
                    ]}
                  >
                    {tag.name}
                  </Text>
                  {selectedTags.includes(tag.id) && (
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {selectedTags.length > 0 && (
              <Button
                testID="clear-tags"
                onPress={() => setSelectedTags([])}
                variant="secondary"
                style={styles.clearButton}
              >
                Clear Tags ({selectedTags.length})
              </Button>
            )}
          </Card>
        )}

        {/* Folders Section */}
        {folders.length > 0 && (
          <Card elevation={1} style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>
              Folders
            </Text>
            <View style={styles.chipContainer}>
              {folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  testID={`folder-${folder.id}`}
                  onPress={() => toggleFolder(folder.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedFolders.includes(folder.id) ? folder.color : theme.colors.surface,
                      borderColor: folder.color,
                    },
                  ]}
                >
                  <Ionicons
                    name="folder"
                    size={16}
                    color={selectedFolders.includes(folder.id) ? '#fff' : folder.color}
                  />
                  <Text
                    variant="body"
                    style={[
                      styles.chipText,
                      { color: selectedFolders.includes(folder.id) ? '#fff' : theme.colors.textPrimary },
                    ]}
                  >
                    {folder.name}
                  </Text>
                  {selectedFolders.includes(folder.id) && (
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {selectedFolders.length > 0 && (
              <Button
                testID="clear-folders"
                onPress={() => setSelectedFolders([])}
                variant="secondary"
                style={styles.clearButton}
              >
                Clear Folders ({selectedFolders.length})
              </Button>
            )}
          </Card>
        )}

        {/* Sort Section */}
        <Card elevation={1} style={styles.section}>
          <Text variant="h6" style={styles.sectionTitle}>
            Sort By
          </Text>

          <View style={styles.sortOptions}>
            {(['relevance', 'date', 'duration', 'title'] as SortOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                testID={`sort-${option}`}
                onPress={() => setSortBy(option)}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor: sortBy === option ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  variant="body"
                  style={[
                    styles.sortOptionText,
                    { color: sortBy === option ? '#fff' : theme.colors.textPrimary },
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text variant="label" style={[styles.label, styles.sortOrderLabel]}>
            Order
          </Text>
          <View style={styles.sortOrderButtons}>
            <TouchableOpacity
              testID="sort-order-asc"
              onPress={() => setSortOrder('asc')}
              style={[
                styles.sortOrderButton,
                {
                  backgroundColor: sortOrder === 'asc' ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={sortOrder === 'asc' ? '#fff' : theme.colors.textPrimary}
              />
              <Text
                variant="body"
                style={[
                  styles.sortOrderText,
                  { color: sortOrder === 'asc' ? '#fff' : theme.colors.textPrimary },
                ]}
              >
                Ascending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="sort-order-desc"
              onPress={() => setSortOrder('desc')}
              style={[
                styles.sortOrderButton,
                {
                  backgroundColor: sortOrder === 'desc' ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="arrow-down"
                size={20}
                color={sortOrder === 'desc' ? '#fff' : theme.colors.textPrimary}
              />
              <Text
                variant="body"
                style={[
                  styles.sortOrderText,
                  { color: sortOrder === 'desc' ? '#fff' : theme.colors.textPrimary },
                ]}
              >
                Descending
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <Button
          testID="clear-all-filters"
          onPress={handleClearFilters}
          variant="secondary"
          style={styles.actionButton}
        >
          Clear All
        </Button>
        <Button
          testID="apply-filters"
          onPress={handleApplyFilters}
          style={styles.actionButton}
        >
          Apply Filters
        </Button>
      </View>

      {/* Date Pickers */}
      {showDateFromPicker && (
        <DatePickerWrapper
          testID="date-from-picker"
          value={dateFrom || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDateFromPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDateFrom(selectedDate);
            }
          }}
        />
      )}
      {showDateToPicker && (
        <DatePickerWrapper
          testID="date-to-picker"
          value={dateTo || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDateToPicker(Platform.OS === 'ios');
            if (selectedDate) {
              setDateTo(selectedDate);
            }
          }}
        />
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <Animated.View
          style={[
            styles.analyticsPanel,
            { transform: [{ translateY: analyticsSlide }] },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.analyticsBlur}>
              <View style={styles.analyticsContent}>
                <View style={styles.analyticsHeader}>
                  <Text variant="h6">Filter Analytics</Text>
                  <TouchableOpacity onPress={handleHideAnalytics}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.analyticsStats}>
                  <View style={styles.statCard}>
                    <Ionicons name="funnel-outline" size={32} color={theme.colors.primary} />
                    <Text variant="h4" style={styles.statValue}>
                      {(selectedTags.length + selectedFolders.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0))}
                    </Text>
                    <Text variant="caption" style={styles.statLabel}>Active Filters</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="bookmark-outline" size={32} color={theme.colors.primary} />
                    <Text variant="h4" style={styles.statValue}>{savedPresets.length}</Text>
                    <Text variant="caption" style={styles.statLabel}>Saved Presets</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="flash-outline" size={32} color={theme.colors.primary} />
                    <Text variant="h4" style={styles.statValue}>{quickFilters.length}</Text>
                    <Text variant="caption" style={styles.statLabel}>Quick Filters</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.analyticsContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.analyticsHeader}>
                <Text variant="h6">Filter Analytics</Text>
                <TouchableOpacity onPress={handleHideAnalytics}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.analyticsStats}>
                <View style={styles.statCard}>
                  <Ionicons name="funnel-outline" size={32} color={theme.colors.primary} />
                  <Text variant="h4" style={styles.statValue}>
                    {(selectedTags.length + selectedFolders.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0))}
                  </Text>
                  <Text variant="caption" style={styles.statLabel}>Active Filters</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="bookmark-outline" size={32} color={theme.colors.primary} />
                  <Text variant="h4" style={styles.statValue}>{savedPresets.length}</Text>
                  <Text variant="caption" style={styles.statLabel}>Saved Presets</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="flash-outline" size={32} color={theme.colors.primary} />
                  <Text variant="h4" style={styles.statValue}>{quickFilters.length}</Text>
                  <Text variant="caption" style={styles.statLabel}>Quick Filters</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* Save Preset Modal */}
      {showPresetModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <Text variant="h6" style={styles.modalTitle}>Save Filter Preset</Text>
            <TextInput
              style={[
                styles.presetInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              value={presetName}
              onChangeText={setPresetName}
              placeholder="Enter preset name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                onPress={() => {
                  setShowPresetModal(false);
                  setPresetName('');
                }}
                variant="secondary"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button onPress={handleSavePreset} style={styles.modalButton}>
                Save
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    flex: 1,
  },
  clearButton: {
    marginTop: 12,
  },
  durationRow: {
    gap: 16,
  },
  durationField: {
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  durationButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonText: {
    fontSize: 14,
  },
  durationButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 14,
  },
  sortOrderLabel: {
    marginTop: 8,
  },
  sortOrderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sortOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortOrderText: {
    fontSize: 14,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButton: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsButton: {
    padding: 8,
  },
  quickFiltersSection: {
    marginBottom: 20,
  },
  quickFiltersScroll: {
    marginTop: 12,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#fff',
    marginRight: 12,
    gap: 6,
  },
  quickFilterChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  quickFilterText: {
    color: '#667eea',
    fontWeight: '600',
  },
  quickFilterTextActive: {
    color: '#fff',
  },
  presetsSection: {
    marginBottom: 20,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  presetsList: {
    gap: 8,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  presetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  presetName: {
    flex: 1,
  },
  savePresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  analyticsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  analyticsBlur: {
    flex: 1,
  },
  analyticsContent: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontWeight: '700',
    color: '#667eea',
  },
  statLabel: {
    opacity: 0.7,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
  },
  presetInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
