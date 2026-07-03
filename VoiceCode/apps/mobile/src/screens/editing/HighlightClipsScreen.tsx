import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface HighlightClip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  type: 'ai' | 'manual' | 'action' | 'decision';
  thumbnail?: string;
  isSelected: boolean;
}

const HighlightClipsScreen: React.FC = () => {
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const [clips, setClips] = useState<HighlightClip[]>([
    {
      id: '1',
      title: 'Key Decision: Q1 Budget Approved',
      startTime: 120,
      endTime: 180,
      type: 'decision',
      isSelected: false,
    },
    {
      id: '2',
      title: 'Action Item: Review Proposal',
      startTime: 245,
      endTime: 280,
      type: 'action',
      isSelected: false,
    },
    {
      id: '3',
      title: 'Important Discussion: Market Strategy',
      startTime: 450,
      endTime: 540,
      type: 'ai',
      isSelected: false,
    },
    {
      id: '4',
      title: 'Team Agreement on Timeline',
      startTime: 720,
      endTime: 780,
      type: 'decision',
      isSelected: false,
    },
    {
      id: '5',
      title: 'Custom Highlight',
      startTime: 890,
      endTime: 920,
      type: 'manual',
      isSelected: false,
    },
    {
      id: '6',
      title: 'Action Item: Follow Up with Client',
      startTime: 1050,
      endTime: 1100,
      type: 'action',
      isSelected: false,
    },
  ]);

  const filterTypes = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'ai', label: 'AI Detected', icon: 'sparkles' },
    { id: 'decision', label: 'Decisions', icon: 'checkmark-circle' },
    { id: 'action', label: 'Actions', icon: 'checkbox' },
    { id: 'manual', label: 'Manual', icon: 'hand-left' },
  ];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'ai':
        return '#AF52DE';
      case 'decision':
        return '#34C759';
      case 'action':
        return '#FF9500';
      case 'manual':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'ai':
        return 'sparkles';
      case 'decision':
        return 'checkmark-circle';
      case 'action':
        return 'checkbox';
      case 'manual':
        return 'hand-left';
      default:
        return 'bookmark';
    }
  };

  const toggleClipSelection = (id: string) => {
    if (selectedClips.includes(id)) {
      setSelectedClips(prev => prev.filter(c => c !== id));
    } else {
      setSelectedClips(prev => [...prev, id]);
    }
  };

  const filteredClips = filterType === 'all' ? clips : clips.filter(c => c.type === filterType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Highlight Clips</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.sourceInfo}>
        <View style={styles.sourceIcon}>
          <Ionicons name="videocam" size={20} color="#007AFF" />
        </View>
        <View style={styles.sourceDetails}>
          <Text style={styles.sourceName}>Team Planning Meeting</Text>
          <Text style={styles.sourceMeta}>45:32 • {clips.length} highlights detected</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTypes.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, filterType === filter.id && styles.filterChipActive]}
              onPress={() => setFilterType(filter.id)}
            >
              <Ionicons
                name={filter.icon as any}
                size={14}
                color={filterType === filter.id ? '#FFF' : '#8E8E93'}
              />
              <Text
                style={[styles.filterText, filterType === filter.id && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedClips.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedClips.length} selected</Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.selectionAction}>
              <Ionicons name="git-merge" size={18} color="#007AFF" />
              <Text style={styles.selectionActionText}>Merge</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectionAction}>
              <Ionicons name="download" size={18} color="#34C759" />
              <Text style={styles.selectionActionText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectionAction}>
              <Ionicons name="trash" size={18} color="#FF3B30" />
              <Text style={styles.selectionActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.clipsList} showsVerticalScrollIndicator={false}>
        {filteredClips.map((clip, idx) => (
          <TouchableOpacity
            key={clip.id}
            style={[styles.clipCard, selectedClips.includes(clip.id) && styles.clipCardSelected]}
            onPress={() => toggleClipSelection(clip.id)}
            onLongPress={() => toggleClipSelection(clip.id)}
          >
            <View style={styles.clipThumbnail}>
              <Ionicons name="play" size={20} color="#FFF" />
              <Text style={styles.clipDuration}>{formatTime(clip.endTime - clip.startTime)}</Text>
            </View>
            <View style={styles.clipContent}>
              <View style={styles.clipHeader}>
                <View
                  style={[styles.typeBadge, { backgroundColor: getTypeColor(clip.type) + '20' }]}
                >
                  <Ionicons
                    name={getTypeIcon(clip.type) as any}
                    size={12}
                    color={getTypeColor(clip.type)}
                  />
                  <Text style={[styles.typeText, { color: getTypeColor(clip.type) }]}>
                    {clip.type.charAt(0).toUpperCase() + clip.type.slice(1)}
                  </Text>
                </View>
                <Text style={styles.clipTime}>
                  {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                </Text>
              </View>
              <Text style={styles.clipTitle}>{clip.title}</Text>
            </View>
            <View style={styles.clipActions}>
              {selectedClips.includes(clip.id) ? (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.clipAction}>
                    <Ionicons name="create-outline" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clipAction}>
                    <Ionicons name="share-outline" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.exportAllButton}>
          <Ionicons name="film" size={20} color="#FFF" />
          <Text style={styles.exportAllText}>Create Highlight Reel</Text>
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
  addButton: { padding: 4 },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceDetails: { flex: 1 },
  sourceName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  sourceMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
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
    borderRadius: 18,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 13, color: '#8E8E93', marginLeft: 6 },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectionText: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  selectionActions: { flexDirection: 'row' },
  selectionAction: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  selectionActionText: { fontSize: 13, color: '#FFF', marginLeft: 4 },
  clipsList: { flex: 1, padding: 16 },
  clipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  clipCardSelected: { borderWidth: 2, borderColor: '#007AFF' },
  clipThumbnail: {
    width: 80,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  clipDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    color: '#FFF',
  },
  clipContent: { flex: 1, padding: 12 },
  clipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeText: { fontSize: 11, fontWeight: '500', marginLeft: 4 },
  clipTime: { fontSize: 11, color: '#8E8E93' },
  clipTitle: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  clipActions: { justifyContent: 'center', paddingHorizontal: 8 },
  clipAction: { padding: 6 },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: { height: 100 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  exportAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
  },
  exportAllText: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default HighlightClipsScreen;
