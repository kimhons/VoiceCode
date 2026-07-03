import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

const SubtitleEditorScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(45);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>('2');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const [subtitles, setSubtitles] = useState<Subtitle[]>([
    {
      id: '1',
      startTime: 0,
      endTime: 5,
      text: "Welcome everyone to today's meeting.",
      speaker: 'Sarah',
    },
    {
      id: '2',
      startTime: 5,
      endTime: 12,
      text: "Let's start with the quarterly review.",
      speaker: 'Sarah',
    },
    {
      id: '3',
      startTime: 12,
      endTime: 18,
      text: 'The numbers are looking really good this quarter.',
      speaker: 'Mike',
    },
    {
      id: '4',
      startTime: 18,
      endTime: 25,
      text: 'We exceeded our targets by fifteen percent.',
      speaker: 'Mike',
    },
    {
      id: '5',
      startTime: 25,
      endTime: 32,
      text: "That's fantastic news! What drove this growth?",
      speaker: 'Sarah',
    },
    {
      id: '6',
      startTime: 32,
      endTime: 40,
      text: 'Primarily the new product launch and marketing campaign.',
      speaker: 'Mike',
    },
    {
      id: '7',
      startTime: 40,
      endTime: 48,
      text: 'The team did an amazing job on execution.',
      speaker: 'Mike',
    },
  ]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const startEditing = (subtitle: Subtitle) => {
    setEditingId(subtitle.id);
    setEditText(subtitle.text);
  };

  const saveEdit = () => {
    if (editingId) {
      setSubtitles(prev => prev.map(s => (s.id === editingId ? { ...s, text: editText } : s)));
      setEditingId(null);
      setEditText('');
    }
  };

  const getCurrentSubtitle = () => {
    return subtitles.find(s => currentTime >= s.startTime && currentTime < s.endTime);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Subtitles</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        <View style={styles.videoPreview}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam" size={32} color="#8E8E93" />
          </View>
          <View style={styles.subtitleOverlay}>
            <Text style={styles.subtitleText}>{getCurrentSubtitle()?.text || ''}</Text>
          </View>
        </View>
        <View style={styles.playbackBar}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '45%' }]} />
          </View>
          <Text style={styles.timeText}>{formatTime(100)}</Text>
        </View>
        <View style={styles.playControls}>
          <TouchableOpacity style={styles.playControl}>
            <Ionicons name="play-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playControl}>
            <Ionicons name="play-forward" size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toolsBar}>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="add-circle" size={20} color="#007AFF" />
          <Text style={styles.toolText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="git-merge" size={20} color="#34C759" />
          <Text style={styles.toolText}>Merge</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="cut" size={20} color="#FF9500" />
          <Text style={styles.toolText}>Split</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="time" size={20} color="#AF52DE" />
          <Text style={styles.toolText}>Timing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="text" size={20} color="#FF3B30" />
          <Text style={styles.toolText}>Style</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.subtitlesList} showsVerticalScrollIndicator={false}>
        {subtitles.map((subtitle, idx) => (
          <TouchableOpacity
            key={subtitle.id}
            style={[
              styles.subtitleCard,
              selectedSubtitle === subtitle.id && styles.subtitleCardSelected,
              getCurrentSubtitle()?.id === subtitle.id && styles.subtitleCardActive,
            ]}
            onPress={() => setSelectedSubtitle(subtitle.id)}
          >
            <View style={styles.subtitleIndex}>
              <Text style={styles.indexText}>{idx + 1}</Text>
            </View>
            <View style={styles.subtitleContent}>
              <View style={styles.subtitleTiming}>
                <TouchableOpacity style={styles.timingBadge}>
                  <Text style={styles.timingText}>{formatTime(subtitle.startTime)}</Text>
                </TouchableOpacity>
                <Ionicons name="arrow-forward" size={12} color="#8E8E93" />
                <TouchableOpacity style={styles.timingBadge}>
                  <Text style={styles.timingText}>{formatTime(subtitle.endTime)}</Text>
                </TouchableOpacity>
                {subtitle.speaker && (
                  <View style={styles.speakerBadge}>
                    <Text style={styles.speakerText}>{subtitle.speaker}</Text>
                  </View>
                )}
              </View>
              {editingId === subtitle.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelEdit} onPress={() => setEditingId(null)}>
                      <Ionicons name="close" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveEdit} onPress={saveEdit}>
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => startEditing(subtitle)}>
                  <Text style={styles.subtitleTextContent}>{subtitle.text}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.subtitleActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="play" size={16} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{subtitles.length} subtitles</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statText}>SRT format</Text>
        </View>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
  exportButton: { padding: 4 },
  previewSection: { backgroundColor: '#000', padding: 16 },
  videoPreview: {
    aspectRatio: 16 / 9,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subtitleOverlay: { position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center' },
  subtitleText: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#FFF',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    textAlign: 'center',
  },
  playbackBar: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  timeText: { fontSize: 12, color: '#8E8E93', width: 50 },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#3C3C3E',
    borderRadius: 2,
    marginHorizontal: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  playControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  playControl: { padding: 12 },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  toolsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toolButton: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  toolText: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  subtitlesList: { flex: 1, padding: 16 },
  subtitleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  subtitleCardSelected: { borderWidth: 2, borderColor: '#007AFF' },
  subtitleCardActive: { backgroundColor: '#007AFF10' },
  subtitleIndex: {
    width: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  subtitleContent: { flex: 1, padding: 12 },
  subtitleTiming: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timingBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timingText: { fontSize: 11, fontFamily: 'Courier', color: '#1C1C1E' },
  speakerBadge: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  speakerText: { fontSize: 11, fontWeight: '500', color: '#007AFF' },
  subtitleTextContent: { fontSize: 15, color: '#1C1C1E', lineHeight: 22 },
  editContainer: { flexDirection: 'row', alignItems: 'flex-start' },
  editInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1C1C1E',
    minHeight: 60,
  },
  editActions: { marginLeft: 8 },
  cancelEdit: { padding: 8, marginBottom: 4 },
  saveEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleActions: { justifyContent: 'center', paddingHorizontal: 8 },
  actionBtn: { padding: 8 },
  bottomPadding: { height: 20 },
  footer: { backgroundColor: '#FFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  statText: { fontSize: 13, color: '#8E8E93' },
  statDivider: { marginHorizontal: 8, color: '#8E8E93' },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});

export default SubtitleEditorScreen;
