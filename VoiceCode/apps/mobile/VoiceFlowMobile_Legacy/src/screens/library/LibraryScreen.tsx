// VoiceFlow Pro Mobile - Library Screen

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector } from '../../store';
import { Text, Card, Input, Button } from '../../components/common';
import { Recording } from '../../types/recording';

type SortOption = 'date' | 'duration' | 'name';
type SortOrder = 'asc' | 'desc';

export const LibraryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { recordings } = useAppSelector(state => state.recording);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Filter and sort recordings
  const filteredRecordings = useMemo(() => {
    let filtered = [...recordings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(recording =>
        recording.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.transcription?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Folder filter
    if (selectedFolder) {
      filtered = filtered.filter(recording => recording.folder === selectedFolder);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [recordings, searchQuery, sortBy, sortOrder, selectedFolder]);

  const handlePlayRecording = (recording: Recording) => {
    // TODO: Implement playback
    Alert.alert('Play Recording', `Playing: ${recording.title}`);
  };

  const handleDeleteRecording = (recording: Recording) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${recording.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete
            console.log('Delete recording:', recording.id);
          },
        },
      ]
    );
  };

  const handleRenameRecording = (recording: Recording) => {
    // TODO: Implement rename
    Alert.alert('Rename Recording', `Rename: ${recording.title}`);
  };

  const handleShareRecording = (recording: Recording) => {
    // TODO: Implement share
    Alert.alert('Share Recording', `Share: ${recording.title}`);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <Card
      style={styles.recordingCard}
      onPress={() => handlePlayRecording(item)}
    >
      <View style={styles.recordingHeader}>
        <View style={styles.recordingInfo}>
          <Text variant="h4" color={theme.colors.textPrimary} numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="caption" color={theme.colors.textSecondary}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.recordingMeta}>
          <Text variant="body" color={theme.colors.primary}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      </View>

      {item.transcription && (
        <Text
          variant="body"
          color={theme.colors.textSecondary}
          numberOfLines={2}
          style={styles.transcription}
        >
          {item.transcription}
        </Text>
      )}

      <View style={styles.recordingFooter}>
        <View style={styles.tags}>
          {item.tags?.slice(0, 2).map((tag, index) => (
            <View
              key={index}
              style={[styles.tag, { backgroundColor: theme.colors.surface }]}
            >
              <Text variant="caption" color={theme.colors.textSecondary}>
                {tag}
              </Text>
            </View>
          ))}
          {item.isFavorite && (
            <Text variant="body" style={styles.favoriteIcon}>
              ⭐
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleShareRecording(item)}
            style={styles.actionButton}
          >
            <Text variant="body">📤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRenameRecording(item)}
            style={styles.actionButton}
          >
            <Text variant="body">✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteRecording(item)}
            style={styles.actionButton}
          >
            <Text variant="body">🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="h2" align="center" color={theme.colors.textSecondary}>
        📚
      </Text>
      <Text variant="h3" align="center" color={theme.colors.textPrimary} style={styles.emptyTitle}>
        No Recordings Yet
      </Text>
      <Text variant="body" align="center" color={theme.colors.textSecondary}>
        {searchQuery
          ? 'No recordings match your search'
          : 'Start recording to see your library'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h2" color={theme.colors.textPrimary}>
          Library
        </Text>
        <Text variant="body" color={theme.colors.textSecondary}>
          {filteredRecordings.length} recording{filteredRecordings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search recordings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="🔍"
        />
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <View style={styles.sortButtons}>
          <Button
            title="Date"
            onPress={() => setSortBy('date')}
            variant={sortBy === 'date' ? 'primary' : 'outline'}
            size="small"
          />
          <Button
            title="Duration"
            onPress={() => setSortBy('duration')}
            variant={sortBy === 'duration' ? 'primary' : 'outline'}
            size="small"
          />
          <Button
            title="Name"
            onPress={() => setSortBy('name')}
            variant={sortBy === 'name' ? 'primary' : 'outline'}
            size="small"
          />
        </View>
        <TouchableOpacity onPress={toggleSortOrder} style={styles.sortOrderButton}>
          <Text variant="h3">{sortOrder === 'asc' ? '↑' : '↓'}</Text>
        </TouchableOpacity>
      </View>

      {/* Recordings List */}
      <FlatList
        data={filteredRecordings}
        renderItem={renderRecordingItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  sortButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  sortOrderButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  recordingCard: {
    marginBottom: 12,
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordingInfo: {
    flex: 1,
    marginRight: 12,
  },
  recordingMeta: {
    alignItems: 'flex-end',
  },
  transcription: {
    marginBottom: 12,
  },
  recordingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  favoriteIcon: {
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
});

