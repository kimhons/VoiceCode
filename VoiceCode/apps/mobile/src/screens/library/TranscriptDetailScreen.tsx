/**
 * TranscriptDetailScreen
 * Full transcript view with audio playback, search, speaker labels, and editing
 * Inspired by Otter.ai's transcript interface
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

// Components
import { AudioPlayerBar } from '../../components/playback';
import {
  InteractiveTranscriptEditor,
  TranscriptSearchBar,
  SpeakerLabel,
  WordData,
} from '../../components/transcript';

// Hooks
import { useAudioPlayback } from '../../hooks/useAudioPlayback';
import { useSpeakerDiarization, SpeakerSegment, Speaker } from '../../hooks/useSpeakerDiarization';
import { useWordEditor } from '../../hooks/useWordEditor';

// Types
interface TranscriptDetailParams {
  recordingId: string;
  title?: string;
  audioUrl?: string;
}

type TranscriptDetailRouteProp = RouteProp<{ TranscriptDetail: TranscriptDetailParams }, 'TranscriptDetail'>;

interface TranscriptDetailScreenProps {
  navigation?: { goBack: () => void };
  route?: { params?: TranscriptDetailParams };
}

// Mock data for demo
const MOCK_WORDS: WordData[] = [
  { word: 'Hello', start: 0.0, end: 0.3, confidence: 0.98 },
  { word: 'everyone,', start: 0.35, end: 0.7, confidence: 0.95 },
  { word: 'welcome', start: 0.8, end: 1.1, confidence: 0.97 },
  { word: 'to', start: 1.15, end: 1.25, confidence: 0.99 },
  { word: 'our', start: 1.3, end: 1.45, confidence: 0.96 },
  { word: 'meeting', start: 1.5, end: 1.9, confidence: 0.94 },
  { word: 'today.', start: 1.95, end: 2.3, confidence: 0.92 },
  { word: "Let's", start: 2.5, end: 2.7, confidence: 0.91 },
  { word: 'start', start: 2.75, end: 3.0, confidence: 0.93 },
  { word: 'by', start: 3.05, end: 3.15, confidence: 0.98 },
  { word: 'reviewing', start: 3.2, end: 3.6, confidence: 0.89 },
  { word: 'the', start: 3.65, end: 3.75, confidence: 0.99 },
  { word: 'agenda.', start: 3.8, end: 4.2, confidence: 0.88 },
  { word: 'First,', start: 5.0, end: 5.3, confidence: 0.95 },
  { word: 'we', start: 5.35, end: 5.45, confidence: 0.97 },
  { word: 'need', start: 5.5, end: 5.7, confidence: 0.94 },
  { word: 'to', start: 5.75, end: 5.85, confidence: 0.99 },
  { word: 'discuss', start: 5.9, end: 6.3, confidence: 0.92 },
  { word: 'the', start: 6.35, end: 6.45, confidence: 0.99 },
  { word: 'quarterly', start: 6.5, end: 7.0, confidence: 0.87 },
  { word: 'results.', start: 7.05, end: 7.5, confidence: 0.85 },
];

const TranscriptDetailScreen: React.FC<TranscriptDetailScreenProps> = ({
  navigation: navigationProp,
  route: routeProp,
}) => {
  const { theme } = useTheme();
  const navigationHook = useNavigation();
  const routeHook = useRoute<TranscriptDetailRouteProp>();
  const navigation = navigationProp ?? navigationHook;
  const route = routeProp ?? routeHook;

  const { recordingId, title = 'Meeting Notes', audioUrl } = route.params || {};

  // State
  const [words, setWords] = useState<WordData[]>(MOCK_WORDS);
  const [showSearch, setShowSearch] = useState(false);
  const [searchMatchIndices, setSearchMatchIndices] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Hooks
  const {
    speakers,
    segments,
    renameSpeaker,
    changeSpeakerColor,
    getSpeakerForWord,
    detectSpeakers,
    isDetecting,
  } = useSpeakerDiarization({
    initialSpeakers: [
      { id: 'speaker_1', name: 'Speaker 1', color: '#667eea' },
      { id: 'speaker_2', name: 'Speaker 2', color: '#f59e0b' },
    ],
    initialSegments: [
      { speakerId: 'speaker_1', startTime: 0, endTime: 4.5, text: '', wordIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      { speakerId: 'speaker_2', startTime: 5.0, endTime: 7.5, text: '', wordIndices: [13, 14, 15, 16, 17, 18, 19, 20] },
    ],
  });

  const {
    editingIndex,
    startEdit,
    commitEdit,
    cancelEdit,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useWordEditor({
    words,
    onWordChange: (index, newWord) => {
      setWords(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], word: newWord };
        return updated;
      });
    },
  });

  // Find current word based on playback time
  const currentWordIndex = useMemo(() => {
    return words.findIndex(
      w => currentPlaybackTime >= w.start && currentPlaybackTime <= w.end
    );
  }, [words, currentPlaybackTime]);

  // Group words by speaker segments
  const groupedSegments = useMemo(() => {
    return segments.map(segment => ({
      ...segment,
      speaker: speakers.find(s => s.id === segment.speakerId),
      words: segment.wordIndices.map(i => ({ ...words[i], index: i })),
    }));
  }, [segments, speakers, words]);

  // Handle time updates from audio player
  const handleTimeUpdate = useCallback((timeSeconds: number) => {
    setCurrentPlaybackTime(timeSeconds);
  }, []);

  // Handle seek from word tap
  const handleWordTimestampTap = useCallback((timestamp: number) => {
    // This will be handled by AudioPlayerBar's seekTo
    setCurrentPlaybackTime(timestamp);
  }, []);

  // Handle search results
  const handleSearchResults = useCallback((indices: number[], currentIndex: number) => {
    setSearchMatchIndices(indices);
    setCurrentSearchIndex(currentIndex);
  }, []);

  // Handle navigation to search match
  const handleNavigateToMatch = useCallback((wordIndex: number) => {
    // Scroll to word - would need ref to specific word elements
    // For now, this is a placeholder
  }, []);

  // Handle word edit
  const handleWordEdit = useCallback((index: number, newWord: string) => {
    commitEdit(index, newWord);
  }, [commitEdit]);

  // Handle word tap
  const handleWordTap = useCallback((index: number) => {
    if (isEditing) {
      startEdit(index);
    } else {
      // Jump to word timestamp
      handleWordTimestampTap(words[index].start);
    }
  }, [isEditing, startEdit, words, handleWordTimestampTap]);

  // Handle word long press (enter edit mode)
  const handleWordLongPress = useCallback((index: number) => {
    setIsEditing(true);
    startEdit(index);
  }, [startEdit]);

  // Handle word delete
  const handleWordDelete = useCallback((index: number) => {
    Alert.alert(
      'Delete Word',
      `Are you sure you want to delete "${words[index].word}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setWords(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  }, [words]);

  // Handle copy transcript
  const handleCopy = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = words.map(w => w.word).join(' ');
    Clipboard.setString(text);
    Alert.alert('Copied', 'Transcript copied to clipboard');
  }, [words]);

  // Handle share
  const handleShare = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = words.map(w => w.word).join(' ');
    try {
      await Share.share({
        message: text,
        title: title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [words, title]);

  // Handle delete recording
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  }, [navigation]);

  // Toggle search
  const toggleSearch = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearch(prev => !prev);
  }, []);

  // Toggle edit mode
  const toggleEditMode = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(prev => !prev);
    if (isEditing) {
      cancelEdit();
    }
  }, [isEditing, cancelEdit]);

  // Handle speaker rename
  const handleSpeakerRename = useCallback((speakerId: string, newName: string) => {
    renameSpeaker(speakerId, newName);
  }, [renameSpeaker]);

  // Handle speaker color change
  const handleSpeakerColorChange = useCallback((speakerId: string, newColor: string) => {
    changeSpeakerColor(speakerId, newColor);
  }, [changeSpeakerColor]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity testID="back-button" onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            January 4, 2026 • 5:23
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity testID="search-button" onPress={toggleSearch} style={styles.headerButton}>
            <Ionicons
              name={showSearch ? 'close' : 'search'}
              size={22}
              color={showSearch ? theme.colors.primary : theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity testID="edit-button" onPress={toggleEditMode} style={styles.headerButton}>
            <Ionicons
              name={isEditing ? 'checkmark' : 'pencil'}
              size={22}
              color={isEditing ? theme.colors.primary : theme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View testID="search-bar">
          <TranscriptSearchBar
            words={words}
            onSearchResults={handleSearchResults}
            onNavigateToMatch={handleNavigateToMatch}
            onClose={() => setShowSearch(false)}
          />
        </View>
      )}

      {/* Undo/Redo Bar (when editing) */}
      {isEditing && (
        <Animated.View
          testID="edit-toolbar"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.undoRedoBar, { backgroundColor: theme.colors.surface }]}
        >
          <TouchableOpacity
            style={[styles.undoRedoButton, !canUndo && styles.undoRedoButtonDisabled]}
            onPress={undo}
            disabled={!canUndo}
          >
            <Ionicons
              name="arrow-undo"
              size={20}
              color={canUndo ? theme.colors.primary : theme.colors.textTertiary}
            />
            <Text
              style={[
                styles.undoRedoText,
                { color: canUndo ? theme.colors.primary : theme.colors.textTertiary },
              ]}
            >
              Undo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.undoRedoButton, !canRedo && styles.undoRedoButtonDisabled]}
            onPress={redo}
            disabled={!canRedo}
          >
            <Ionicons
              name="arrow-redo"
              size={20}
              color={canRedo ? theme.colors.primary : theme.colors.textTertiary}
            />
            <Text
              style={[
                styles.undoRedoText,
                { color: canRedo ? theme.colors.primary : theme.colors.textTertiary },
              ]}
            >
              Redo
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Grouped by Speaker Segments */}
          {groupedSegments.map((segment, segmentIndex) => (
            <View key={`segment-${segmentIndex}`} style={styles.segmentContainer}>
              {/* Speaker Label */}
              {segment.speaker && (
                <SpeakerLabel
                  speaker={segment.speaker}
                  timestamp={segment.startTime}
                  onRename={handleSpeakerRename}
                  onColorChange={handleSpeakerColorChange}
                  onTimestampTap={handleWordTimestampTap}
                />
              )}

              {/* Words in this segment */}
              <View
                style={[
                  styles.wordsContainer,
                  segment.speaker && {
                    borderLeftWidth: 3,
                    borderLeftColor: segment.speaker.color,
                  },
                ]}
              >
                <InteractiveTranscriptEditor
                  words={segment.words.map(w => words[w.index])}
                  currentWordIndex={
                    segment.wordIndices.includes(currentWordIndex)
                      ? segment.wordIndices.indexOf(currentWordIndex)
                      : -1
                  }
                  editingIndex={
                    editingIndex !== null && segment.wordIndices.includes(editingIndex)
                      ? segment.wordIndices.indexOf(editingIndex)
                      : null
                  }
                  searchMatchIndices={searchMatchIndices
                    .filter(i => segment.wordIndices.includes(i))
                    .map(i => segment.wordIndices.indexOf(i))}
                  currentSearchMatchIndex={
                    searchMatchIndices[currentSearchIndex] !== undefined &&
                    segment.wordIndices.includes(searchMatchIndices[currentSearchIndex])
                      ? segment.wordIndices.indexOf(searchMatchIndices[currentSearchIndex])
                      : -1
                  }
                  onWordTap={(localIndex) => handleWordTap(segment.wordIndices[localIndex])}
                  onWordLongPress={(localIndex) => handleWordLongPress(segment.wordIndices[localIndex])}
                  onWordEdit={(localIndex, newWord) => handleWordEdit(segment.wordIndices[localIndex], newWord)}
                  onTimestampTap={handleWordTimestampTap}
                  onWordDelete={(localIndex) => handleWordDelete(segment.wordIndices[localIndex])}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Audio Player Bar */}
      {audioUrl && (
        <View testID="audio-player">
          <AudioPlayerBar
            audioUrl={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onSeek={(time) => setCurrentPlaybackTime(time)}
          />
        </View>
      )}

      {/* Bottom Actions */}
      <View style={[styles.actionsBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity testID="copy-button" style={styles.actionButton} onPress={handleCopy}>
          <Ionicons name="copy-outline" size={22} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="share-button" style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-button" style={styles.actionButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={theme.colors.error} />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  undoRedoBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 24,
  },
  undoRedoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  undoRedoButtonDisabled: {
    opacity: 0.5,
  },
  undoRedoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  segmentContainer: {
    marginBottom: 20,
  },
  wordsContainer: {
    paddingLeft: 12,
    marginLeft: 4,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TranscriptDetailScreen;
