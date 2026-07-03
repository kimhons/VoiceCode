/**
 * VoiceFlow Pro - Library Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, deleteRecording } from '../store';

export default function LibraryScreen() {
  const recordings = useSelector((state: RootState) => state.recordings.recordings);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'name'>('date');

  const filteredRecordings = recordings
    .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'duration') return b.duration - a.duration;
      return a.title.localeCompare(b.title);
    });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const renderRecording = ({ item }: { item: typeof recordings[0] }) => (
    <TouchableOpacity style={styles.recordingCard}>
      <View style={styles.recordingLeft}>
        <View style={styles.playButton}>
          <Ionicons name="play" size={24} color="#007AFF" />
        </View>
        <View style={styles.recordingDetails}>
          <Text style={styles.recordingTitle}>{item.title}</Text>
          <Text style={styles.recordingMeta}>
            {formatDate(item.createdAt)} • {formatDuration(item.duration)} • {item.language}
          </Text>
          {item.transcription && (
            <Text style={styles.transcriptPreview} numberOfLines={2}>
              {item.transcription}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => dispatch(deleteRecording(item.id))} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.count}>{recordings.length} recordings</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recordings..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['date', 'duration', 'name'] as const).map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
            onPress={() => setSortBy(option)}
          >
            <Text style={[styles.sortButtonText, sortBy === option && styles.sortButtonTextActive]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRecordings}
        keyExtractor={item => item.id}
        renderItem={renderRecording}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No recordings found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  count: { fontSize: 14, color: '#666' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16, color: '#333' },
  sortContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  sortLabel: { fontSize: 14, color: '#666', marginRight: 12 },
  sortButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e9ecef', marginRight: 8 },
  sortButtonActive: { backgroundColor: '#007AFF' },
  sortButtonText: { fontSize: 12, color: '#666' },
  sortButtonTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16 },
  recordingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  recordingLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,122,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordingDetails: { flex: 1 },
  recordingTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  recordingMeta: { fontSize: 12, color: '#666', marginTop: 4 },
  transcriptPreview: { fontSize: 12, color: '#999', marginTop: 4 },
  deleteButton: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 16 },
});

