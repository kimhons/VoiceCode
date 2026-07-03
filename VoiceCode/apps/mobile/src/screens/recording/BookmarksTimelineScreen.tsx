import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Bookmark {
  id: string;
  timestamp: number;
  label: string;
  note?: string;
  type: 'manual' | 'ai' | 'action' | 'decision';
  color: string;
}

const BookmarksTimelineScreen: React.FC = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const recordingDuration = 3600; // 1 hour in seconds

  const bookmarkTypes = [
    { id: 'all', label: 'All', color: '#007AFF' },
    { id: 'manual', label: 'Manual', color: '#8E8E93' },
    { id: 'ai', label: 'AI Detected', color: '#AF52DE' },
    { id: 'action', label: 'Action Items', color: '#FF9500' },
    { id: 'decision', label: 'Decisions', color: '#34C759' },
  ];

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: '1', timestamp: 120, label: 'Meeting Started', type: 'manual', color: '#8E8E93' },
    {
      id: '2',
      timestamp: 450,
      label: 'Budget Discussion',
      note: 'Q1 budget allocation',
      type: 'ai',
      color: '#AF52DE',
    },
    { id: '3', timestamp: 780, label: 'Action: Review proposal', type: 'action', color: '#FF9500' },
    {
      id: '4',
      timestamp: 1200,
      label: 'Decision: Approve marketing spend',
      type: 'decision',
      color: '#34C759',
    },
    { id: '5', timestamp: 1560, label: 'Key Point: Revenue targets', type: 'ai', color: '#AF52DE' },
    {
      id: '6',
      timestamp: 1890,
      label: 'Action: Schedule follow-up',
      type: 'action',
      color: '#FF9500',
    },
    {
      id: '7',
      timestamp: 2400,
      label: 'Team assignments discussed',
      type: 'manual',
      color: '#8E8E93',
    },
    {
      id: '8',
      timestamp: 2850,
      label: 'Decision: Hire 2 developers',
      type: 'decision',
      color: '#34C759',
    },
    {
      id: '9',
      timestamp: 3200,
      label: 'Action: Send meeting notes',
      type: 'action',
      color: '#FF9500',
    },
    { id: '10', timestamp: 3500, label: 'Meeting Ended', type: 'manual', color: '#8E8E93' },
  ]);

  const formatTimestamp = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0)
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredBookmarks = bookmarks.filter(
    b => selectedType === 'all' || b.type === selectedType
  );

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'ai':
        return 'sparkles';
      case 'action':
        return 'checkbox';
      case 'decision':
        return 'checkmark-circle';
      default:
        return 'bookmark';
    }
  };

  const startEditing = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
  };

  const saveEdit = () => {
    if (editingId) {
      setBookmarks(prev => prev.map(b => (b.id === editingId ? { ...b, label: editLabel } : b)));
      setEditingId(null);
      setEditLabel('');
    }
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.recordingInfo}>
        <Text style={styles.recordingTitle}>Team Standup Meeting</Text>
        <Text style={styles.recordingMeta}>
          Jan 18, 2026 • {formatTimestamp(recordingDuration)}
        </Text>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {bookmarkTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.filterChip,
                selectedType === type.id && { backgroundColor: type.color },
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Text
                style={[styles.filterText, selectedType === type.id && styles.filterTextActive]}
              >
                {type.label}
              </Text>
              {type.id !== 'all' && (
                <View
                  style={[styles.filterCount, selectedType === type.id && styles.filterCountActive]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      selectedType === type.id && styles.filterCountTextActive,
                    ]}
                  >
                    {bookmarks.filter(b => b.type === type.id).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.timelineTrack}>
          <View style={styles.timelineProgress} />
          {bookmarks.map(bookmark => (
            <View
              key={bookmark.id}
              style={[
                styles.timelineMarker,
                {
                  left: `${(bookmark.timestamp / recordingDuration) * 100}%`,
                  backgroundColor: bookmark.color,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>0:00</Text>
          <Text style={styles.timeLabel}>{formatTimestamp(recordingDuration / 2)}</Text>
          <Text style={styles.timeLabel}>{formatTimestamp(recordingDuration)}</Text>
        </View>
      </View>

      <ScrollView style={styles.bookmarksList} showsVerticalScrollIndicator={false}>
        <Text style={styles.listHeader}>{filteredBookmarks.length} bookmarks</Text>

        {filteredBookmarks.map((bookmark, index) => (
          <View key={bookmark.id} style={styles.bookmarkCard}>
            <View style={styles.bookmarkTimeline}>
              <View style={[styles.bookmarkDot, { backgroundColor: bookmark.color }]} />
              {index < filteredBookmarks.length - 1 && <View style={styles.bookmarkLine} />}
            </View>

            <TouchableOpacity style={styles.bookmarkContent} onPress={() => startEditing(bookmark)}>
              {editingId === bookmark.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editLabel}
                    onChangeText={setEditLabel}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.bookmarkHeader}>
                    <View style={[styles.bookmarkIcon, { backgroundColor: bookmark.color + '20' }]}>
                      <Ionicons
                        name={getTypeIcon(bookmark.type) as any}
                        size={16}
                        color={bookmark.color}
                      />
                    </View>
                    <Text style={styles.bookmarkLabel}>{bookmark.label}</Text>
                  </View>
                  {bookmark.note && <Text style={styles.bookmarkNote}>{bookmark.note}</Text>}
                  <View style={styles.bookmarkFooter}>
                    <TouchableOpacity style={styles.timestampButton}>
                      <Ionicons name="play" size={12} color="#007AFF" />
                      <Text style={styles.timestampText}>
                        {formatTimestamp(bookmark.timestamp)}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.bookmarkActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="create-outline" size={16} color="#8E8E93" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => deleteBookmark(bookmark.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.playerBar}>
        <TouchableOpacity style={styles.playerButton}>
          <Ionicons name="play-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={26} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playerButton}>
          <Ionicons name="play-forward" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookmarkButton}>
          <Ionicons name="bookmark" size={22} color="#FF9500" />
        </TouchableOpacity>
      </View>
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
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  addButton: { padding: 4 },
  recordingInfo: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  recordingTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  recordingMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: { fontSize: 14, color: '#1C1C1E' },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  filterCount: {
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterCountText: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
  filterCountTextActive: { color: '#FFF' },
  timelineContainer: { backgroundColor: '#FFF', padding: 16 },
  timelineTrack: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, position: 'relative' },
  timelineProgress: {
    height: '100%',
    width: '100%',
    backgroundColor: '#007AFF20',
    borderRadius: 4,
  },
  timelineMarker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
    marginLeft: -8,
  },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeLabel: { fontSize: 11, color: '#8E8E93' },
  bookmarksList: { flex: 1, padding: 16 },
  listHeader: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  bookmarkCard: { flexDirection: 'row', marginBottom: 4 },
  bookmarkTimeline: { width: 24, alignItems: 'center' },
  bookmarkDot: { width: 12, height: 12, borderRadius: 6 },
  bookmarkLine: { width: 2, flex: 1, backgroundColor: '#E5E5EA', marginTop: 4 },
  bookmarkContent: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginLeft: 10,
    marginBottom: 8,
  },
  editContainer: { flexDirection: 'row', alignItems: 'center' },
  editInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1C1C1E',
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  bookmarkHeader: { flexDirection: 'row', alignItems: 'center' },
  bookmarkIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bookmarkLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E', flex: 1 },
  bookmarkNote: { fontSize: 13, color: '#8E8E93', marginTop: 6, marginLeft: 38 },
  bookmarkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  timestampButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timestampText: { fontSize: 12, color: '#007AFF', marginLeft: 4, fontWeight: '500' },
  bookmarkActions: { flexDirection: 'row' },
  actionButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  bottomPadding: { height: 80 },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
  },
  playerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  bookmarkButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BookmarksTimelineScreen;
