import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  thumbnail: string;
  isSelected: boolean;
}

const VideoClipEditorScreen: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(15);
  const [selectedTool, setSelectedTool] = useState<'trim' | 'split' | 'crop' | null>('trim');
  const totalDuration = 180;

  const [clips, setClips] = useState<Clip[]>([
    { id: '1', startTime: 0, endTime: 45, thumbnail: '1', isSelected: true },
    { id: '2', startTime: 45, endTime: 90, thumbnail: '2', isSelected: false },
    { id: '3', startTime: 90, endTime: 135, thumbnail: '3', isSelected: false },
    { id: '4', startTime: 135, endTime: 180, thumbnail: '4', isSelected: false },
  ]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tools = [
    { id: 'trim', icon: 'cut', label: 'Trim' },
    { id: 'split', icon: 'git-branch', label: 'Split' },
    { id: 'crop', icon: 'crop', label: 'Crop' },
    { id: 'rotate', icon: 'refresh', label: 'Rotate' },
    { id: 'speed', icon: 'speedometer', label: 'Speed' },
  ];

  const selectClip = (id: string) => {
    setClips(prev => prev.map(c => ({ ...c, isSelected: c.id === id })));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Video</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewContainer}>
        <View style={styles.videoPreview}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam" size={48} color="#8E8E93" />
            <Text style={styles.previewText}>Video Preview</Text>
          </View>
          <TouchableOpacity style={styles.playOverlay} onPress={() => setIsPlaying(!isPlaying)}>
            <View style={styles.playButtonLarge}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.timeDisplay}>
          <Text style={styles.currentTimeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.durationText}> / {formatTime(totalDuration)}</Text>
        </View>
      </View>

      <View style={styles.toolsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolsScroll}
        >
          {tools.map(tool => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolButton, selectedTool === tool.id && styles.toolButtonActive]}
              onPress={() => setSelectedTool(tool.id as any)}
            >
              <Ionicons
                name={tool.icon as any}
                size={20}
                color={selectedTool === tool.id ? '#007AFF' : '#8E8E93'}
              />
              <Text style={[styles.toolLabel, selectedTool === tool.id && styles.toolLabelActive]}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.timelineSection}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Timeline</Text>
          <View style={styles.timelineActions}>
            <TouchableOpacity style={styles.timelineAction}>
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.timelineAction}>
              <Ionicons name="layers" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeline}>
          <View style={styles.timelineContent}>
            <View style={styles.timeRuler}>
              {[0, 30, 60, 90, 120, 150, 180].map(t => (
                <View key={t} style={styles.timeMarker}>
                  <Text style={styles.timeMarkerText}>{formatTime(t)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.clipsTrack}>
              {clips.map(clip => (
                <TouchableOpacity
                  key={clip.id}
                  style={[
                    styles.clipItem,
                    { width: ((clip.endTime - clip.startTime) / totalDuration) * 600 },
                    clip.isSelected && styles.clipItemSelected,
                  ]}
                  onPress={() => selectClip(clip.id)}
                >
                  <View style={styles.clipThumbnail}>
                    <Ionicons name="image" size={16} color="#FFF" />
                  </View>
                  {clip.isSelected && (
                    <>
                      <View style={styles.clipHandleLeft} />
                      <View style={styles.clipHandleRight} />
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.audioTrack}>
              <View style={styles.audioWaveform}>
                {Array.from({ length: 60 }).map((_, i) => (
                  <View key={i} style={[styles.audioBar, { height: Math.random() * 20 + 5 }]} />
                ))}
              </View>
            </View>

            <View style={[styles.playhead, { left: (currentTime / totalDuration) * 600 + 50 }]} />
          </View>
        </ScrollView>
      </View>

      <View style={styles.clipControls}>
        <TouchableOpacity style={styles.clipControlButton}>
          <Ionicons name="trash" size={20} color="#FF3B30" />
          <Text style={styles.clipControlText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clipControlButton}>
          <Ionicons name="copy" size={20} color="#007AFF" />
          <Text style={styles.clipControlText}>Duplicate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clipControlButton}>
          <Ionicons name="volume-high" size={20} color="#34C759" />
          <Text style={styles.clipControlText}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clipControlButton}>
          <Ionicons name="color-palette" size={20} color="#FF9500" />
          <Text style={styles.clipControlText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playbackControls}>
        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="play-skip-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="play-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mainPlayBtn} onPress={() => setIsPlaying(!isPlaying)}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="play-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="play-skip-forward" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  exportButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  exportText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  previewContainer: { alignItems: 'center', paddingVertical: 16 },
  videoPreview: {
    width: '90%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewText: { fontSize: 14, color: '#8E8E93', marginTop: 8 },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: { flexDirection: 'row', marginTop: 12 },
  currentTimeText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  durationText: { fontSize: 16, color: '#8E8E93' },
  toolsBar: { borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  toolsScroll: { paddingHorizontal: 16, paddingVertical: 10 },
  toolButton: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  toolButtonActive: { backgroundColor: '#007AFF20', borderRadius: 12 },
  toolLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  toolLabelActive: { color: '#007AFF' },
  timelineSection: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  timelineActions: { flexDirection: 'row' },
  timelineAction: { padding: 8 },
  timeline: { flex: 1 },
  timelineContent: { paddingHorizontal: 16, position: 'relative' },
  timeRuler: { flexDirection: 'row', height: 24, marginLeft: 50 },
  timeMarker: { width: 100 },
  timeMarkerText: { fontSize: 10, color: '#8E8E93' },
  clipsTrack: { flexDirection: 'row', height: 60, marginLeft: 50, marginBottom: 8 },
  clipItem: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginRight: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  clipItemSelected: { borderWidth: 2, borderColor: '#FFF' },
  clipThumbnail: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  clipHandleLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#FFF',
  },
  clipHandleRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#FFF',
  },
  audioTrack: {
    height: 40,
    marginLeft: 50,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  audioBar: { width: 2, backgroundColor: '#34C759', borderRadius: 1 },
  playhead: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#FF3B30' },
  clipControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
  },
  clipControlButton: { alignItems: 'center' },
  clipControlText: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
  },
  controlBtn: { padding: 12 },
  mainPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
});

export default VideoClipEditorScreen;
