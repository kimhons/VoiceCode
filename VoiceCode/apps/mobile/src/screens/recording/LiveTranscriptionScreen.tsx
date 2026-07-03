import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
  speakerColor?: string;
  isPartial?: boolean;
}

const LiveTranscriptionScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformAnimation] = useState(new Animated.Value(0));

  const [segments] = useState<TranscriptSegment[]>([
    {
      id: '1',
      text: 'Good morning, how are you feeling today?',
      timestamp: 0,
      speaker: 'Doctor',
      speakerColor: '#007AFF',
    },
    {
      id: '2',
      text: "I've been having some chest discomfort for the past few days.",
      timestamp: 5,
      speaker: 'Patient',
      speakerColor: '#34C759',
    },
    {
      id: '3',
      text: 'Can you describe the discomfort? Is it sharp, dull, or pressure-like?',
      timestamp: 12,
      speaker: 'Doctor',
      speakerColor: '#007AFF',
    },
    {
      id: '4',
      text: 'It feels more like pressure, especially when I climb stairs.',
      timestamp: 20,
      speaker: 'Patient',
      speakerColor: '#34C759',
    },
    {
      id: '5',
      text: 'How long does it typically last?',
      timestamp: 28,
      speaker: 'Doctor',
      speakerColor: '#007AFF',
    },
    {
      id: '6',
      text: 'Usually about five to ten minutes, then it goes away when I rest.',
      timestamp: 32,
      speaker: 'Patient',
      speakerColor: '#34C759',
      isPartial: true,
    },
  ]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(waveformAnimation, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      waveformAnimation.setValue(0);
    }
  }, [isRecording, isPaused, waveformAnimation]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => setIsPaused(!isPaused);

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.recordingIndicator}>
            <View style={[styles.recordingDot, isPaused && styles.recordingDotPaused]} />
            <Text style={styles.recordingText}>{isPaused ? 'Paused' : 'Recording'}</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.7, 0.9, 0.6].map(
            (h, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: isPaused ? 4 : 40 * h,
                    opacity: isPaused
                      ? 0.3
                      : waveformAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                  },
                ]}
              />
            )
          )}
        </View>
        <View style={styles.audioLevel}>
          <Text style={styles.audioLevelText}>-12 dB</Text>
        </View>
      </View>

      <View style={styles.speakersBar}>
        <Text style={styles.speakersLabel}>Speakers:</Text>
        <View style={styles.speakerChips}>
          <View style={[styles.speakerChip, { borderColor: '#007AFF' }]}>
            <View style={[styles.speakerDot, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.speakerName}>Doctor</Text>
          </View>
          <View style={[styles.speakerChip, { borderColor: '#34C759' }]}>
            <View style={[styles.speakerDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.speakerName}>Patient</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addSpeakerButton}>
          <Ionicons name="add" size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.transcriptContainer} showsVerticalScrollIndicator={false}>
        {segments.map(segment => (
          <View key={segment.id} style={styles.segmentContainer}>
            <View style={styles.segmentHeader}>
              <View style={[styles.segmentSpeakerDot, { backgroundColor: segment.speakerColor }]} />
              <Text style={[styles.segmentSpeaker, { color: segment.speakerColor }]}>
                {segment.speaker}
              </Text>
              <Text style={styles.segmentTimestamp}>{formatDuration(segment.timestamp)}</Text>
            </View>
            <Text style={[styles.segmentText, segment.isPartial && styles.segmentTextPartial]}>
              {segment.text}
              {segment.isPartial && <Text style={styles.cursor}>|</Text>}
            </Text>
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="bookmark-outline" size={24} color="#007AFF" />
          <Text style={styles.controlLabel}>Bookmark</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pauseButton, isPaused && styles.pauseButtonActive]}
          onPress={togglePause}
        >
          <Ionicons name={isPaused ? 'play' : 'pause'} size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
          <View style={styles.stopIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="flag-outline" size={24} color="#007AFF" />
          <Text style={styles.controlLabel}>Flag</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="create-outline" size={18} color="#007AFF" />
          <Text style={styles.quickActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="sparkles" size={18} color="#AF52DE" />
          <Text style={styles.quickActionText}>AI Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="share-outline" size={18} color="#34C759" />
          <Text style={styles.quickActionText}>Share</Text>
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
  headerCenter: { alignItems: 'center' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center' },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  recordingDotPaused: { backgroundColor: '#FF9500' },
  recordingText: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  durationText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFF',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  settingsButton: { padding: 4 },
  waveformContainer: { paddingVertical: 20, alignItems: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', height: 60 },
  waveformBar: { width: 4, backgroundColor: '#007AFF', borderRadius: 2, marginHorizontal: 2 },
  audioLevel: { marginTop: 8 },
  audioLevelText: { fontSize: 12, color: '#8E8E93' },
  speakersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  speakersLabel: { fontSize: 13, color: '#8E8E93', marginRight: 10 },
  speakerChips: { flexDirection: 'row', flex: 1 },
  speakerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  speakerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  speakerName: { fontSize: 13, color: '#FFF' },
  addSpeakerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transcriptContainer: { flex: 1, paddingHorizontal: 16, marginTop: 16 },
  segmentContainer: { marginBottom: 20 },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  segmentSpeakerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  segmentSpeaker: { fontSize: 13, fontWeight: '600', marginRight: 8 },
  segmentTimestamp: { fontSize: 12, color: '#8E8E93' },
  segmentText: { fontSize: 16, color: '#FFF', lineHeight: 24 },
  segmentTextPartial: { color: '#8E8E93' },
  cursor: { color: '#007AFF' },
  bottomPadding: { height: 20 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  controlButton: { alignItems: 'center' },
  controlLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonActive: { backgroundColor: '#34C759' },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: { width: 20, height: 20, borderRadius: 4, backgroundColor: '#FFF' },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickActionText: { fontSize: 13, color: '#FFF', marginLeft: 6 },
});

export default LiveTranscriptionScreen;
