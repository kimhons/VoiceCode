import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Recording {
  id: string;
  title: string;
  date: string;
  duration: number;
  size: number;
  hasTranscript: boolean;
  isFavorite: boolean;
  tags: string[];
  folder?: string;
}

const RecordingLibraryScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filters = [
    { id: 'all', label: 'All', icon: 'albums' },
    { id: 'recent', label: 'Recent', icon: 'time' },
    { id: 'favorites', label: 'Favorites', icon: 'star' },
    { id: 'transcribed', label: 'Transcribed', icon: 'document-text' },
  ];

  const recordings: Recording[] = [
    {
      id: '1',
      title: 'Team Standup Meeting',
      date: '2026-01-18',
      duration: 1845,
      size: 45.2,
      hasTranscript: true,
      isFavorite: true,
      tags: ['meeting', 'team'],
      folder: 'Work',
    },
    {
      id: '2',
      title: 'Patient Consultation - J. Smith',
      date: '2026-01-18',
      duration: 1230,
      size: 32.1,
      hasTranscript: true,
      isFavorite: false,
      tags: ['medical', 'consult'],
      folder: 'Medical',
    },
    {
      id: '3',
      title: 'Product Roadmap Discussion',
      date: '2026-01-17',
      duration: 3600,
      size: 88.5,
      hasTranscript: true,
      isFavorite: true,
      tags: ['product', 'planning'],
      folder: 'Work',
    },
    {
      id: '4',
      title: 'Interview - Senior Developer',
      date: '2026-01-17',
      duration: 2700,
      size: 65.3,
      hasTranscript: false,
      isFavorite: false,
      tags: ['interview', 'hiring'],
    },
    {
      id: '5',
      title: 'Weekly Review',
      date: '2026-01-16',
      duration: 1500,
      size: 38.7,
      hasTranscript: true,
      isFavorite: false,
      tags: ['review'],
    },
    {
      id: '6',
      title: 'Client Call - Acme Corp',
      date: '2026-01-15',
      duration: 2100,
      size: 52.4,
      hasTranscript: true,
      isFavorite: true,
      tags: ['client', 'sales'],
    },
  ];

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatSize = (mb: number): string => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredRecordings = recordings.filter(r => {
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedFilter === 'favorites' && !r.isFavorite) return false;
    if (selectedFilter === 'transcribed' && !r.hasTranscript) return false;
    return true;
  });

  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <TouchableOpacity style={styles.recordingCard}>
      <View style={styles.recordingHeader}>
        <View style={styles.recordingIcon}>
          <Ionicons name="mic" size={20} color="#007AFF" />
        </View>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.recordingMeta}>
            <Text style={styles.metaText}>{formatDate(item.date)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{formatSize(item.size)}</Text>
          </View>
        </View>
        <View style={styles.recordingActions}>
          {item.isFavorite && (
            <Ionicons name="star" size={16} color="#FF9500" style={styles.favoriteIcon} />
          )}
          {item.hasTranscript && (
            <View style={styles.transcriptBadge}>
              <Text style={styles.transcriptBadgeText}>T</Text>
            </View>
          )}
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>
      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {item.folder && (
            <View style={styles.folderBadge}>
              <Ionicons name="folder" size={12} color="#8E8E93" />
              <Text style={styles.folderText}>{item.folder}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recordings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="folder-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recordings..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          <Ionicons name={viewMode === 'list' ? 'grid' : 'list'} size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons
                name={filter.icon as any}
                size={16}
                color={selectedFilter === filter.id ? '#FFF' : '#007AFF'}
              />
              <Text
                style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortBar}>
        <Text style={styles.resultCount}>{filteredRecordings.length} recordings</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortLabel}>Sort by: </Text>
          <Text style={styles.sortValue}>{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</Text>
          <Ionicons name="chevron-down" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRecordings}
        renderItem={renderRecordingItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.storageBar}>
        <View style={styles.storageInfo}>
          <Ionicons name="cloud" size={18} color="#34C759" />
          <Text style={styles.storageText}>322.2 MB used of 10 GB</Text>
        </View>
        <View style={styles.storageProgress}>
          <View style={[styles.storageFill, { width: '3.2%' }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="mic" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  headerActions: { flexDirection: 'row' },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 8 },
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersScroll: { paddingHorizontal: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#007AFF', marginLeft: 6 },
  filterTextActive: { color: '#FFF' },
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F5F7',
  },
  resultCount: { fontSize: 13, color: '#8E8E93' },
  sortButton: { flexDirection: 'row', alignItems: 'center' },
  sortLabel: { fontSize: 13, color: '#8E8E93' },
  sortValue: { fontSize: 13, color: '#007AFF', fontWeight: '500' },
  listContent: { padding: 16 },
  recordingCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  recordingHeader: { flexDirection: 'row', alignItems: 'center' },
  recordingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingInfo: { flex: 1 },
  recordingTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  recordingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 13, color: '#8E8E93' },
  metaDot: { fontSize: 13, color: '#8E8E93', marginHorizontal: 6 },
  recordingActions: { flexDirection: 'row', alignItems: 'center' },
  favoriteIcon: { marginRight: 8 },
  transcriptBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  transcriptBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  moreButton: { padding: 4 },
  tagsContainer: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  tag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: { fontSize: 12, color: '#8E8E93' },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  folderText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  storageBar: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  storageInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  storageText: { fontSize: 13, color: '#8E8E93', marginLeft: 8 },
  storageProgress: { height: 4, backgroundColor: '#E5E5EA', borderRadius: 2 },
  storageFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 2 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default RecordingLibraryScreen;
