// VoiceCode Mobile - Enhanced Folder Management Screen
// Nested folders, drag-and-drop, folder sharing, analytics, and Apple-caliber design

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
  Share,
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
import { getFolders, createFolder, updateFolder, deleteFolder } from '../../store/slices/searchSlice';
import { HomeStackParamList } from '../../navigation/types';
import { Folder } from '../../services/FolderService';
import { elevation, blurIntensity } from '../../theme';

type FolderManagementScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'FolderManagement'>;
type FolderManagementScreenRouteProp = RouteProp<HomeStackParamList, 'FolderManagement'>;

interface FolderManagementScreenProps {
  navigation: FolderManagementScreenNavigationProp;
  route: FolderManagementScreenRouteProp;
}

// Predefined folder colors
const FOLDER_COLORS = [
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
 * FolderManagementScreen Component
 * Create, edit, and delete folders with nesting support
 */
export const FolderManagementScreen: React.FC<FolderManagementScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  // Redux state
  const { folders, foldersLoading, foldersError } = useAppSelector((state) => state.search);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);
  const [parentFolder, setParentFolder] = useState<string | undefined>(undefined);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Animation values
  const fabScale = useRef(new Animated.Value(1)).current;
  const analyticsSlide = useRef(new Animated.Value(300)).current;

  /**
   * Load folders on mount
   */
  useEffect(() => {
    if (userId) {
      dispatch(getFolders(userId));
    }
  }, [userId, dispatch]);

  /**
   * Open create folder modal
   */
  const handleCreateFolder = useCallback(async (parentId?: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingFolder(null);
    setFolderName('');
    setFolderColor(FOLDER_COLORS[0]);
    setParentFolder(parentId);
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
   * Open edit folder modal
   */
  const handleEditFolder = useCallback((folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setParentFolder(folder.parentId);
    setShowModal(true);
  }, []);

  /**
   * Save folder (create or update)
   */
  const handleSaveFolder = useCallback(async () => {
    if (!folderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      if (editingFolder) {
        await dispatch(updateFolder({ id: editingFolder.id, name: folderName.trim(), color: folderColor }));
      } else {
        await dispatch(createFolder({ userId, name: folderName.trim(), color: folderColor, parentId: parentFolder }));
      }
      setShowModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save folder');
    }
  }, [folderName, folderColor, parentFolder, editingFolder, userId, dispatch]);

  /**
   * Delete folder with confirmation
   */
  const handleDeleteFolder = useCallback(
    async (folder: Folder) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const hasSubfolders = folder.subfolderCount && folder.subfolderCount > 0;
      const hasTranscripts = folder.transcriptCount && folder.transcriptCount > 0;

      let message = `Are you sure you want to delete "${folder.name}"?`;
      if (hasSubfolders) {
        message += ' This will also delete all subfolders.';
      }
      if (hasTranscripts) {
        const count = folder.transcriptCount || 0;
        message += ` This will remove it from ${count} transcript${count > 1 ? 's' : ''}.`;
      }

      Alert.alert('Delete Folder', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteFolder(folder.id));
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete folder');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]);
    },
    [dispatch]
  );

  /**
   * Toggle folder expansion
   */
  const handleToggleExpand = useCallback(async (folderId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  /**
   * Show folder analytics
   */
  const handleShowAnalytics = useCallback(async (folder: Folder) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFolder(folder);
    setShowAnalytics(true);

    // Animate analytics panel
    Animated.spring(analyticsSlide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [analyticsSlide]);

  /**
   * Hide folder analytics
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
      setSelectedFolder(null);
    });
  }, [analyticsSlide]);

  /**
   * Share folder
   */
  const handleShareFolder = useCallback(async (folder: Folder) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await Share.share({
        message: `Check out my "${folder.name}" folder with ${folder.transcriptCount || 0} transcripts!`,
        title: `Share ${folder.name}`,
      });

      if (result.action === Share.sharedAction) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share folder');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  /**
   * Handle drag start
   */
  const handleDragStart = useCallback(async (folder: Folder) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDraggedFolder(folder);
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(async (targetFolderId: string | null) => {
    if (!draggedFolder) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Prevent dropping folder into itself or its descendants
    if (targetFolderId === draggedFolder.id) {
      Alert.alert('Error', 'Cannot move folder into itself');
      setDraggedFolder(null);
      setDropTarget(null);
      return;
    }

    try {
      await dispatch(updateFolder({
        id: draggedFolder.id,
        name: draggedFolder.name,
        color: draggedFolder.color,
        parentId: targetFolderId,
      }));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to move folder');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setDraggedFolder(null);
    setDropTarget(null);
  }, [draggedFolder, dispatch]);

  /**
   * Toggle view mode
   */
  const handleToggleViewMode = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  }, []);

  /**
   * Get root folders (no parent)
   */
  const rootFolders = folders.filter((f) => !f.parentId);

  /**
   * Get subfolders for a parent
   */
  const getSubfolders = (parentId: string) => {
    return folders.filter((f) => f.parentId === parentId);
  };

  /**
   * Render analytics content
   */
  const renderAnalyticsContent = () => {
    if (!selectedFolder) return null;

    const subfolders = getSubfolders(selectedFolder.id);
    const totalTranscripts = selectedFolder.transcriptCount || 0;
    const totalSubfolders = subfolders.length;

    return (
      <View style={styles.analyticsInner}>
        <View style={styles.analyticsHeader}>
          <View style={styles.analyticsTitle}>
            <Ionicons name="stats-chart" size={24} color={selectedFolder.color} />
            <Text variant="h6" style={styles.analyticsFolderName}>
              {selectedFolder.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleHideAnalytics}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.analyticsStats}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={32} color={theme.colors.primary} />
            <Text variant="h4" style={styles.statValue}>{totalTranscripts}</Text>
            <Text variant="caption" style={styles.statLabel}>Transcripts</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="folder-outline" size={32} color={theme.colors.primary} />
            <Text variant="h4" style={styles.statValue}>{totalSubfolders}</Text>
            <Text variant="caption" style={styles.statLabel}>Subfolders</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color={theme.colors.primary} />
            <Text variant="h4" style={styles.statValue}>
              {selectedFolder.createdAt ? new Date(selectedFolder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
            </Text>
            <Text variant="caption" style={styles.statLabel}>Created</Text>
          </View>
        </View>

        <View style={styles.analyticsActions}>
          <Button
            onPress={() => {
              handleHideAnalytics();
              handleShareFolder(selectedFolder);
            }}
            style={styles.analyticsButton}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text variant="button" style={styles.analyticsButtonText}>Share</Text>
          </Button>

          <Button
            onPress={() => {
              handleHideAnalytics();
              handleEditFolder(selectedFolder);
            }}
            style={styles.analyticsButton}
          >
            <Ionicons name="pencil-outline" size={20} color="#fff" />
            <Text variant="button" style={styles.analyticsButtonText}>Edit</Text>
          </Button>
        </View>
      </View>
    );
  };

  /**
   * Render folder item with enhanced features
   */
  const renderFolderItem = (folder: Folder, level: number = 0) => {
    const subfolders = getSubfolders(folder.id);
    const hasSubfolders = subfolders.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isDragging = draggedFolder?.id === folder.id;
    const isDropTarget = dropTarget === folder.id;

    return (
      <View key={folder.id}>
        <TouchableOpacity
          onLongPress={() => handleDragStart(folder)}
          onPress={() => hasSubfolders && handleToggleExpand(folder.id)}
          activeOpacity={0.7}
        >
          <Card
            elevation={isDragging ? 3 : isDropTarget ? 2 : 1}
            style={[
              styles.folderCard,
              { marginLeft: level * 16 },
              isDragging && styles.draggingCard,
              isDropTarget && styles.dropTargetCard,
            ]}
          >
            <View style={styles.folderContent}>
              {/* Expand/Collapse Icon */}
              {hasSubfolders && (
                <TouchableOpacity
                  onPress={() => handleToggleExpand(folder.id)}
                  style={styles.expandButton}
                >
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}

              <View style={styles.folderInfo}>
                <View style={[styles.colorIndicator, { backgroundColor: folder.color }]} />
                <View style={styles.folderDetails}>
                  <View style={styles.folderHeader}>
                    <Ionicons
                      name={isExpanded ? 'folder-open' : 'folder'}
                      size={20}
                      color={folder.color}
                    />
                    <Text variant="h6" style={styles.folderName}>
                      {folder.name}
                    </Text>
                  </View>
                  <View style={styles.folderStats}>
                    <Text variant="caption" style={styles.stat}>
                      {folder.transcriptCount || 0} {folder.transcriptCount === 1 ? 'transcript' : 'transcripts'}
                    </Text>
                    {hasSubfolders && (
                      <Text variant="caption" style={styles.stat}>
                        • {subfolders.length} {subfolders.length === 1 ? 'subfolder' : 'subfolders'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.folderActions}>
                <TouchableOpacity
                  testID={`analytics-${folder.id}`}
                  onPress={() => handleShowAnalytics(folder)}
                  style={styles.actionButton}
                >
                  <Ionicons name="stats-chart-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`share-${folder.id}`}
                  onPress={() => handleShareFolder(folder)}
                  style={styles.actionButton}
                >
                  <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`add-subfolder-${folder.id}`}
                  onPress={() => handleCreateFolder(folder.id)}
                  style={styles.actionButton}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`edit-folder-${folder.id}`}
                  onPress={() => handleEditFolder(folder)}
                  style={styles.actionButton}
                >
                  <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`delete-folder-${folder.id}`}
                  onPress={() => handleDeleteFolder(folder)}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Render subfolders recursively when expanded */}
        {hasSubfolders && isExpanded && subfolders.map((subfolder) => renderFolderItem(subfolder, level + 1))}

        {/* Drop zone indicator */}
        {draggedFolder && draggedFolder.id !== folder.id && (
          <TouchableOpacity
            onPress={() => handleDrop(folder.id)}
            style={styles.dropZone}
          >
            <Text variant="caption" style={styles.dropZoneText}>
              Drop here to move into &quot;{folder.name}&quot;
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Loading State */}
      {foldersLoading ? (
        <View style={styles.centerContent}>
          <LoadingSpinner size="large" />
          <Text variant="body" style={styles.loadingText}>
            Loading folders...
          </Text>
        </View>
      ) : foldersError ? (
        /* Error State */
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text variant="h6" style={styles.errorTitle}>
            Failed to load folders
          </Text>
          <Text variant="body" style={styles.errorMessage}>
            {foldersError}
          </Text>
          <Button onPress={() => userId && dispatch(getFolders(userId))} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      ) : folders.length === 0 ? (
        /* Empty State */
        <View style={styles.centerContent}>
          <Ionicons name="folder-outline" size={64} color={theme.colors.textSecondary} />
          <Text variant="h6" style={styles.emptyTitle}>
            No folders yet
          </Text>
          <Text variant="body" style={styles.emptyMessage}>
            Create folders to organize your transcripts
          </Text>
          <Button testID="create-first-folder" onPress={() => handleCreateFolder()} style={styles.createButton}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text variant="button" style={styles.createButtonText}>
              Create Your First Folder
            </Text>
          </Button>
        </View>
      ) : (
        /* Folders List */
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View>
                <Text variant="h5">Your Folders</Text>
                <Text variant="caption" style={styles.folderCount}>
                  {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleToggleViewMode} style={styles.viewModeButton}>
                <Ionicons
                  name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            {rootFolders.map((folder) => renderFolderItem(folder))}

            {/* Drop zone for root level */}
            {draggedFolder && draggedFolder.parentId && (
              <TouchableOpacity
                onPress={() => handleDrop(null)}
                style={styles.rootDropZone}
              >
                <Ionicons name="arrow-up-outline" size={20} color={theme.colors.primary} />
                <Text variant="caption" style={styles.rootDropZoneText}>
                  Move to root level
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Floating Action Button */}
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <TouchableOpacity
              testID="create-folder-fab"
              onPress={() => handleCreateFolder()}
              style={[styles.fab, { backgroundColor: theme.colors.primary }, elevation.lg]}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      {/* Analytics Panel */}
      {showAnalytics && selectedFolder && (
        <Animated.View
          style={[
            styles.analyticsPanel,
            { transform: [{ translateY: analyticsSlide }] },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.analyticsBlur}>
              {renderAnalyticsContent()}
            </BlurView>
          ) : (
            <View style={[styles.analyticsContent, { backgroundColor: theme.colors.surface }]}>
              {renderAnalyticsContent()}
            </View>
          )}
        </Animated.View>
      )}

      {/* Create/Edit Folder Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <Text variant="h5" style={styles.modalTitle}>
              {editingFolder ? 'Edit Folder' : parentFolder ? 'Create Subfolder' : 'Create Folder'}
            </Text>

            {/* Folder Name Input */}
            <Text variant="label" style={styles.inputLabel}>
              Folder Name
            </Text>
            <TextInput
              testID="folder-name-input"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Enter folder name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
            />

            {/* Color Picker */}
            <Text variant="label" style={styles.inputLabel}>
              Folder Color
            </Text>
            <View style={styles.colorPicker}>
              {FOLDER_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  testID={`color-${color}`}
                  onPress={() => setFolderColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    folderColor === color && styles.colorOptionSelected,
                  ]}
                >
                  {folderColor === color && (
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
                onPress={handleSaveFolder}
                style={styles.modalButton}
              >
                {editingFolder ? 'Update' : 'Create'}
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
  folderCount: {
    marginTop: 4,
    opacity: 0.7,
  },
  viewModeButton: {
    padding: 8,
  },
  expandButton: {
    padding: 8,
    marginRight: 8,
  },
  draggingCard: {
    opacity: 0.5,
    transform: [{ scale: 0.95 }],
  },
  dropTargetCard: {
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
  },
  dropZone: {
    padding: 12,
    marginVertical: 4,
    marginLeft: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
  },
  dropZoneText: {
    color: '#1e40af',
    textAlign: 'center',
  },
  rootDropZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    gap: 8,
  },
  rootDropZoneText: {
    color: '#667eea',
    fontWeight: '600',
  },
  folderCard: {
    padding: 16,
    marginBottom: 12,
  },
  folderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 16,
  },
  folderDetails: {
    flex: 1,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  folderName: {
    flex: 1,
  },
  folderStats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    opacity: 0.7,
  },
  folderActions: {
    flexDirection: 'row',
    gap: 8,
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
    borderRadius: 8,
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
  analyticsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  analyticsBlur: {
    flex: 1,
  },
  analyticsContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  analyticsInner: {
    flex: 1,
    padding: 20,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyticsFolderName: {
    fontWeight: '600',
  },
  analyticsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
  analyticsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyticsButtonText: {
    color: '#fff',
  },
});
