import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TranscriptWord {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  isEdited?: boolean;
}

interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerColor: string;
  words: TranscriptWord[];
  startTime: number;
}

const InteractiveTranscriptEditorScreen: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);

  const [segments] = useState<TranscriptSegment[]>([
    {
      id: '1',
      speaker: 'Speaker 1',
      speakerColor: '#007AFF',
      startTime: 0,
      words: [
        { id: 'w1', text: 'Good', startTime: 0, endTime: 0.3, confidence: 0.98 },
        { id: 'w2', text: 'morning,', startTime: 0.3, endTime: 0.7, confidence: 0.95 },
        { id: 'w3', text: 'everyone.', startTime: 0.7, endTime: 1.2, confidence: 0.97 },
        { id: 'w4', text: 'Today', startTime: 1.3, endTime: 1.6, confidence: 0.99 },
        { id: 'w5', text: "we'll", startTime: 1.6, endTime: 1.8, confidence: 0.92 },
        { id: 'w6', text: 'be', startTime: 1.8, endTime: 1.9, confidence: 0.99 },
        { id: 'w7', text: 'discussing', startTime: 1.9, endTime: 2.5, confidence: 0.96 },
        { id: 'w8', text: 'the', startTime: 2.5, endTime: 2.6, confidence: 0.99 },
        { id: 'w9', text: 'quarterly', startTime: 2.6, endTime: 3.1, confidence: 0.94 },
        { id: 'w10', text: 'results.', startTime: 3.1, endTime: 3.6, confidence: 0.97 },
      ],
    },
    {
      id: '2',
      speaker: 'Speaker 2',
      speakerColor: '#34C759',
      startTime: 4,
      words: [
        { id: 'w11', text: 'Thanks', startTime: 4.0, endTime: 4.3, confidence: 0.98 },
        { id: 'w12', text: 'for', startTime: 4.3, endTime: 4.4, confidence: 0.99 },
        { id: 'w13', text: 'the', startTime: 4.4, endTime: 4.5, confidence: 0.99 },
        { id: 'w14', text: 'update.', startTime: 4.5, endTime: 4.9, confidence: 0.96 },
        { id: 'w15', text: 'Can', startTime: 5.0, endTime: 5.2, confidence: 0.98 },
        { id: 'w16', text: 'you', startTime: 5.2, endTime: 5.3, confidence: 0.99 },
        { id: 'w17', text: 'share', startTime: 5.3, endTime: 5.6, confidence: 0.95 },
        { id: 'w18', text: 'the', startTime: 5.6, endTime: 5.7, confidence: 0.99 },
        {
          id: 'w19',
          text: 'revenue',
          startTime: 5.7,
          endTime: 6.2,
          confidence: 0.93,
          isEdited: true,
        },
        { id: 'w20', text: 'figures?', startTime: 6.2, endTime: 6.7, confidence: 0.97 },
      ],
    },
  ]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordStyle = (word: TranscriptWord) => {
    const isActive = currentTime >= word.startTime && currentTime <= word.endTime;
    const isLowConfidence = word.confidence < 0.9;
    return [
      styles.word,
      isActive && styles.wordActive,
      isLowConfidence && styles.wordLowConfidence,
      word.isEdited && styles.wordEdited,
      selectedWordId === word.id && styles.wordSelected,
    ];
  };

  const handleWordPress = (word: TranscriptWord) => {
    setSelectedWordId(word.id);
    setEditingText(word.text);
    setCurrentTime(word.startTime);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Transcript</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="arrow-undo" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="arrow-redo" size={20} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.toolDivider} />
        <TouchableOpacity
          style={[styles.toolButton, showFindReplace && styles.toolButtonActive]}
          onPress={() => setShowFindReplace(!showFindReplace)}
        >
          <Ionicons name="search" size={20} color={showFindReplace ? '#FFF' : '#007AFF'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="text" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="person-add" size={20} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.toolDivider} />
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="sparkles" size={20} color="#AF52DE" />
        </TouchableOpacity>
      </View>

      {showFindReplace && (
        <View style={styles.findReplaceBar}>
          <View style={styles.findRow}>
            <TextInput
              style={styles.findInput}
              placeholder="Find..."
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.findNavButton}>
              <Ionicons name="chevron-up" size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.findNavButton}>
              <Ionicons name="chevron-down" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.replaceRow}>
            <TextInput
              style={styles.findInput}
              placeholder="Replace with..."
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.replaceButton}>
              <Text style={styles.replaceButtonText}>Replace</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.replaceAllButton}>
              <Text style={styles.replaceAllText}>All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.transcriptContainer} showsVerticalScrollIndicator={false}>
        {segments.map(segment => (
          <View key={segment.id} style={styles.segmentContainer}>
            <View style={styles.segmentHeader}>
              <View style={[styles.speakerBadge, { backgroundColor: segment.speakerColor }]}>
                <Text style={styles.speakerText}>{segment.speaker}</Text>
              </View>
              <Text style={styles.timestampText}>{formatTime(segment.startTime)}</Text>
            </View>
            <View style={styles.wordsContainer}>
              {segment.words.map(word => (
                <TouchableOpacity key={word.id} onPress={() => handleWordPress(word)}>
                  <Text style={getWordStyle(word)}>{word.text} </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {selectedWordId && (
        <View style={styles.editPanel}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Edit Word</Text>
            <TouchableOpacity onPress={() => setSelectedWordId(null)}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editInput}
            value={editingText}
            onChangeText={setEditingText}
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.editActionButton}>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={[styles.editActionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editActionButton}>
              <Ionicons name="add" size={18} color="#007AFF" />
              <Text style={styles.editActionText}>Insert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editApplyButton}>
              <Text style={styles.editApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.playerBar}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentTime / 10) * 100}%` }]} />
          </View>
          <View style={styles.timeLabels}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>10:00</Text>
          </View>
        </View>
        <View style={styles.playerControls}>
          <TouchableOpacity style={styles.playerButton}>
            <Ionicons name="play-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playPauseButton} onPress={() => setIsPlaying(!isPlaying)}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playerButton}>
            <Ionicons name="play-forward" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.speedButton}
            onPress={() => setPlaybackSpeed(playbackSpeed >= 2 ? 0.5 : playbackSpeed + 0.5)}
          >
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  saveButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9F9FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolButtonActive: { backgroundColor: '#007AFF' },
  toolDivider: { width: 1, height: 24, backgroundColor: '#E5E5EA', marginHorizontal: 8 },
  findReplaceBar: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  findRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  findInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1C1C1E',
  },
  findNavButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  replaceRow: { flexDirection: 'row', alignItems: 'center' },
  replaceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: 8,
  },
  replaceButtonText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  replaceAllButton: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 4 },
  replaceAllText: { fontSize: 13, color: '#007AFF' },
  transcriptContainer: { flex: 1, padding: 16 },
  segmentContainer: { marginBottom: 20 },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  speakerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  speakerText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  timestampText: { fontSize: 12, color: '#8E8E93', marginLeft: 10 },
  wordsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { fontSize: 16, lineHeight: 28, color: '#1C1C1E' },
  wordActive: { backgroundColor: '#FFEB3B40', borderRadius: 2 },
  wordLowConfidence: { backgroundColor: '#FF950020', borderRadius: 2 },
  wordEdited: { color: '#007AFF' },
  wordSelected: { backgroundColor: '#007AFF20', borderRadius: 2 },
  bottomPadding: { height: 100 },
  editPanel: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', padding: 16 },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  editInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 12,
  },
  editActions: { flexDirection: 'row', alignItems: 'center' },
  editActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editActionText: { fontSize: 14, color: '#007AFF', marginLeft: 4 },
  editApplyButton: {
    marginLeft: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  editApplyText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  playerBar: { backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingVertical: 12 },
  progressContainer: { marginBottom: 12 },
  progressBar: { height: 4, backgroundColor: '#3A3A3C', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 11, color: '#8E8E93' },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  playerButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  speedButton: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3A3A3C',
    borderRadius: 14,
  },
  speedText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
});

export default InteractiveTranscriptEditorScreen;
