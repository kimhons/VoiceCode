import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface QueueItem {
  id: string;
  name: string;
  duration: string;
  size: string;
  status: 'processing' | 'queued' | 'completed' | 'failed';
  progress?: number;
  type: 'transcription' | 'enhancement' | 'export';
}

const RecordingQueueScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'processing', label: 'Processing' },
    { id: 'queued', label: 'Queued' },
    { id: 'completed', label: 'Completed' },
  ];

  const queueItems: QueueItem[] = [
    {
      id: '1',
      name: 'Team Meeting Recording',
      duration: '45:23',
      size: '128 MB',
      status: 'processing',
      progress: 67,
      type: 'transcription',
    },
    {
      id: '2',
      name: 'Client Call',
      duration: '32:10',
      size: '92 MB',
      status: 'processing',
      progress: 23,
      type: 'enhancement',
    },
    {
      id: '3',
      name: 'Weekly Standup',
      duration: '15:45',
      size: '45 MB',
      status: 'queued',
      type: 'transcription',
    },
    {
      id: '4',
      name: 'Interview Recording',
      duration: '58:30',
      size: '167 MB',
      status: 'queued',
      type: 'export',
    },
    {
      id: '5',
      name: 'Product Demo',
      duration: '28:15',
      size: '81 MB',
      status: 'completed',
      type: 'transcription',
    },
    {
      id: '6',
      name: 'Training Session',
      duration: '1:23:45',
      size: '238 MB',
      status: 'failed',
      type: 'enhancement',
    },
  ];

  const filteredItems = queueItems.filter(
    item => selectedFilter === 'all' || item.status === selectedFilter
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'processing':
        return '#007AFF';
      case 'queued':
        return '#FF9500';
      case 'completed':
        return '#34C759';
      case 'failed':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'processing':
        return 'sync';
      case 'queued':
        return 'time';
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'alert-circle';
      default:
        return 'ellipse';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'transcription':
        return 'Transcription';
      case 'enhancement':
        return 'Enhancement';
      case 'export':
        return 'Export';
      default:
        return type;
    }
  };

  const processingCount = queueItems.filter(i => i.status === 'processing').length;
  const queuedCount = queueItems.filter(i => i.status === 'queued').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Processing Queue</Text>
        <TouchableOpacity style={styles.clearButton}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.statLabel}>{processingCount} Processing</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.statLabel}>{queuedCount} Queued</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredItems.map(item => (
          <TouchableOpacity key={item.id} style={styles.queueCard}>
            <View style={styles.cardHeader}>
              <View
                style={[styles.statusIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}
              >
                <Ionicons
                  name={getStatusIcon(item.status) as any}
                  size={20}
                  color={getStatusColor(item.status)}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.metaText}>{item.duration}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{item.size}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={[styles.typeLabel, { color: getStatusColor(item.status) }]}>
                    {getTypeLabel(item.type)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="ellipsis-vertical" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {item.status === 'processing' && item.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{item.progress}%</Text>
              </View>
            )}

            {item.status === 'failed' && (
              <View style={styles.failedActions}>
                <TouchableOpacity style={styles.retryButton}>
                  <Ionicons name="refresh" size={16} color="#007AFF" />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeButton}>
                  <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No items in queue</Text>
            <Text style={styles.emptyDesc}>Items will appear here when processing</Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.pauseButton}>
          <Ionicons name="pause" size={20} color="#FF9500" />
          <Text style={styles.pauseText}>Pause Queue</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  clearButton: { padding: 4 },
  clearText: { fontSize: 17, color: '#FF3B30' },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  statDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statLabel: { fontSize: 14, color: '#8E8E93' },
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#8E8E93' },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  content: { flex: 1, padding: 16 },
  queueCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#8E8E93' },
  metaDot: { fontSize: 12, color: '#8E8E93', marginHorizontal: 6 },
  typeLabel: { fontSize: 12, fontWeight: '500' },
  menuButton: { padding: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, marginRight: 10 },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', color: '#007AFF', width: 36 },
  failedActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF15',
    borderRadius: 16,
    marginRight: 10,
  },
  retryText: { fontSize: 13, color: '#007AFF', marginLeft: 4 },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B3015',
    borderRadius: 16,
  },
  removeText: { fontSize: 13, color: '#FF3B30', marginLeft: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#8E8E93', marginTop: 8 },
  bottomPadding: { height: 80 },
  footer: { backgroundColor: '#FFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FF950015',
    borderRadius: 12,
  },
  pauseText: { fontSize: 16, fontWeight: '600', color: '#FF9500', marginLeft: 8 },
});

export default RecordingQueueScreen;
