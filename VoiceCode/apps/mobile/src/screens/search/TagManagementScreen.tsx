// VoiceFlow Pro Mobile - Enhanced Tag Management Screen
// Tag analytics, bulk operations, smart suggestions, and Apple-caliber design

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  Platform,
  FlatList,
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
import { getTags, createTag, updateTag, deleteTag } from '../../store/slices/searchSlice';
import { HomeStackParamList } from '../../navigation/types';
import { Tag } from '../../services/TagService';
import { elevation, blurIntensity } from '../../theme';

type TagManagementScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'TagManagement'>;
type TagManagementScreenRouteProp = RouteProp<HomeStackParamList, 'TagManagement'>;

interface TagManagementScreenProps {
  navigation: TagManagementScreenNavigationProp;
  route: TagManagementScreenRouteProp;
}

// Predefined tag colors
const TAG_COLORS = [
  '#667eea', // Purple
  '#f59e0b', // Orange
  '#10b981', // Green
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
];

/**
 * TagManagementScreen Component
 * Create, edit, and delete tags
 */
export const TagManagementScreen: React.FC<TagManagementScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux state
  const { tags, tagsLoading, tagsError } = useAppSelector((state) => state.search);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Animation values
  const fabScale = useRef(new Animated.Value(1)).current;
  const selectionBarHeight = useRef(new Animated.Value(0)).current;

  /**
   * Load tags on mount
   */
  useEffect(() => {
    if (userId) {
      dispatch(getTags(userId));
    }
  }, [userId, dispatch]);

  /**
   * Generate smart tag suggestions based on existing tags
   */
  useEffect(() => {
    if (tags.length > 0) {
      // Analyze existing tags to suggest new ones
      const commonCategories = ['Work', 'Personal', 'Meeting', 'Interview', 'Brainstorming', 'Notes'];
      const existingNames = tags.map(t => t.name.toLowerCase());
      const suggestions = commonCategories.filter(cat => !existingNames.includes(cat.toLowerCase()));
      setSuggestedTags(suggestions.slice(0, 3));
    }
  }, [tags]);

  /**
   * Animate selection mode
   */
  useEffect(() => {
    Animated.timing(selectionBarHeight, {
      toValue: isSelectionMode ? 60 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelectionMode, selectionBarHeight]);

  /**
   * Open create tag modal
   */
  const handleCreateTag = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingTag(null);
    setTagName('');
    setTagColor(TAG_COLORS[0]);
    setShowModal(true);

    // Animate FAB
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fabScale]);

  /**
   * Open edit tag modal
   */
  const handleEditTag = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setShowModal(true);
  }, []);

  /**
   * Save tag (create or update)
   */
  const handleSaveTag = useCallback(async () => {
    if (!tagName.trim()) {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      if (editingTag) {
        await dispatch(updateTag({ id: editingTag.id, name: tagName.trim(), color: tagColor }));
      } else {
        await dispatch(createTag({ userId, name: tagName.trim(), color: tagColor }));
      }
      setShowModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save tag');
    }
  }, [tagName, tagColor, editingTag, userId, dispatch]);

  /**
   * Delete tag with confirmation
   */
  const handleDeleteTag = useCallback(
    async (tag: Tag) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Delete Tag',
        `Are you sure you want to delete "${tag.name}"? This will remove it from all transcripts.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await dispatch(deleteTag(tag.id));
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete tag');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            },
          },
        ]
      );
    },
    [dispatch]
  );

  /**
   * Toggle tag selection
   */
  const handleToggleSelection = useCallback(async (tagId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  }, []);

  /**
   * Enter selection mode
   */
  const handleEnterSelectionMode = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSelectionMode(true);
  }, []);

  /**
   * Exit selection mode
   */
  const handleExitSelectionMode = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSelectionMode(false);
    setSelectedTags(new Set());
  }, []);

  /**
   * Bulk delete selected tags
   */
  const handleBulkDelete = useCallback(async () => {
    if (selectedTags.size === 0) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Tags',
      `Are you sure you want to delete ${selectedTags.size} ${selectedTags.size === 1 ? 'tag' : 'tags'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const tagId of selectedTags) {
                await dispatch(deleteTag(tagId));
              }
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setIsSelectionMode(false);
              setSelectedTags(new Set());
            } catch (error) {
              Alert.alert('Error', 'Failed to delete tags');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  }, [selectedTags, dispatch]);

  /**
   * Select all tags
   */
  const handleSelectAll = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(new Set(tags.map(t => t.id)));
  }, [tags]);

  /**
   * Create tag from suggestion
   */
  const handleCreateFromSuggestion = useCallback(async (suggestion: string) => {
    if (!userId) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      await dispatch(createTag({ userId, name: suggestion, color: randomColor }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to create tag');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [userId, dispatch]);

  /**
   * Render tag item with selection support
   */
  const renderTagItem = (tag: Tag) => {
    const isSelected = selectedTags.has(tag.id);

    return (
      <TouchableOpacity
        key={tag.id}
        onPress={() => isSelectionMode ? handleToggleSelection(tag.id) : null}
        onLongPress={!isSelectionMode ? handleEnterSelectionMode : undefined}
        activeOpacity={isSelectionMode ? 0.7 : 1}
      >
        <Card elevation={isSelected ? 2 : 1} style={[
          styles.tagCard,
          isSelected && { borderWidth: 2, borderColor: theme.colors.primary },
        ]}>
          <View style={styles.tagContent}>
            {/* Selection Checkbox */}
            {isSelectionMode && (
              <View style={styles.checkbox}>
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.tagInfo}>
              <View style={[styles.colorIndicator, { backgroundColor: tag.color }]} />
              <View style={styles.tagDetails}>
                <Text variant="h6" style={styles.tagName}>
                  {tag.name}
                </Text>
                <Text variant="caption" style={styles.transcriptCount}>
                  {tag.transcriptCount || 0} {tag.transcriptCount === 1 ? 'transcript' : 'transcripts'}
                </Text>
              </View>
            </View>

            {!isSelectionMode && (
              <View style={styles.tagActions}>
                <TouchableOpacity
                  testID={`edit-tag-${tag.id}`}
                  onPress={() => handleEditTag(tag)}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`delete-tag-${tag.id}`}
                  onPress={() => handleDeleteTag(tag)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Loading State */}
      {tagsLoading ? (
        <View style={styles.centerContent}>
          <LoadingSpinner size="large" />
          <Text variant="body" style={styles.loadingText}>
            Loading tags...
          </Text>
        </View>
      ) : tagsError ? (
        /* Error State */
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text variant="h6" style={styles.errorTitle}>
            Failed to load tags
          </Text>
          <Text variant="body" style={styles.errorMessage}>
            {tagsError}
          </Text>
          <Button onPress={() => userId && dispatch(getTags(userId))} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      ) : tags.length === 0 ? (
        /* Empty State */
        <View style={styles.centerContent}>
          <Ionicons name="pricetag-outline" size={64} color={theme.colors.textSecondary} />
          <Text variant="h6" style={styles.emptyTitle}>
            No tags yet
          </Text>
          <Text variant="body" style={styles.emptyMessage}>
            Create tags to organize your transcripts
          </Text>
          <Button testID="create-first-tag" onPress={handleCreateTag} style={styles.createButton}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text variant="button" style={styles.createButtonText}>
              Create Your First Tag
            </Text>
          </Button>
        </View>
      ) : (
        /* Tags List */
        <>
          {/* Selection Mode Bar */}
          {isSelectionMode && (
            <Animated.View
              style={[
                styles.selectionBar,
                { backgroundColor: theme.colors.surface, height: selectionBarHeight },
                elevation.md,
              ]}
            >
              <TouchableOpacity onPress={handleExitSelectionMode} style={styles.selectionAction}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <Text variant="h6" style={styles.selectionCount}>
                {selectedTags.size} selected
              </Text>

              <View style={styles.selectionActions}>
                <TouchableOpacity onPress={handleSelectAll} style={styles.selectionAction}>
                  <Text variant="button" style={{ color: theme.colors.primary }}>
                    Select All
                  </Text>
                </TouchableOpacity>

                {selectedTags.size > 0 && (
                  <TouchableOpacity onPress={handleBulkDelete} style={styles.selectionAction}>
                    <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text variant="h5">Your Tags</Text>
              <View style={styles.headerActions}>
                <Text variant="caption" style={styles.tagCount}>
                  {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
                </Text>
                {!isSelectionMode && tags.length > 1 && (
                  <TouchableOpacity onPress={handleEnterSelectionMode}>
                    <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                      Select
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Smart Tag Suggestions */}
            {suggestedTags.length > 0 && !isSelectionMode && (
              <View style={styles.suggestionsContainer}>
                <Text variant="label" style={styles.suggestionsTitle}>
                  Suggested Tags
                </Text>
                <View style={styles.suggestionsList}>
                  {suggestedTags.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionChip, { borderColor: theme.colors.primary }]}
                      onPress={() => handleCreateFromSuggestion(suggestion)}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                      <Text variant="caption" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {tags.map(renderTagItem)}
          </ScrollView>

          {/* Floating Action Button */}
          {!isSelectionMode && (
            <Animated.View style={{ transform: [{ scale: fabScale }] }}>
              <TouchableOpacity
                testID="create-tag-fab"
                onPress={handleCreateTag}
                style={[styles.fab, { backgroundColor: theme.colors.primary }, elevation.lg]}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}

      {/* Create/Edit Tag Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <Text variant="h5" style={styles.modalTitle}>
              {editingTag ? 'Edit Tag' : 'Create Tag'}
            </Text>

            {/* Tag Name Input */}
            <Text variant="label" style={styles.inputLabel}>
              Tag Name
            </Text>
            <TextInput
              testID="tag-name-input"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              value={tagName}
              onChangeText={setTagName}
              placeholder="Enter tag name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
            />

            {/* Color Picker */}
            <Text variant="label" style={styles.inputLabel}>
              Tag Color
            </Text>
            <View style={styles.colorPicker}>
              {TAG_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  testID={`color-${color}`}
                  onPress={() => setTagColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    tagColor === color && styles.colorOptionSelected,
                  ]}
                >
                  {tagColor === color && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                testID="cancel-button"
                onPress={() => setShowModal(false)}
                variant="secondary"
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                testID="save-button"
                onPress={handleSaveTag}
                style={styles.modalButton}
              >
                {editingTag ? 'Update' : 'Create'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  retryButton: {
    marginTop: 24,
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
  createButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagCount: {
    opacity: 0.7,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    overflow: 'hidden',
  },
  selectionCount: {
    flex: 1,
    marginLeft: 12,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectionAction: {
    padding: 8,
  },
  suggestionsContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  suggestionsTitle: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#1e40af',
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  checkbox: {
    marginRight: 12,
  },
  tagCard: {
    padding: 16,
    marginBottom: 12,
  },
  tagContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  tagDetails: {
    flex: 1,
  },
  tagName: {
    marginBottom: 4,
  },
  transcriptCount: {
    opacity: 0.7,
  },
  tagActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  inputLabel: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
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
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
});
