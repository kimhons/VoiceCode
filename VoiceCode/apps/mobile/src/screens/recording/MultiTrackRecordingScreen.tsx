import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AudioTrack {
  id: string;
  name: string;
  source: string;
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  levels: number[];
}

const MultiTrackRecordingScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(125);

  const [tracks, setTracks] = useState<AudioTrack[]>([
    {
      id: '1',
      name: 'System Audio',
      source: 'Computer',
      color: '#007AFF',
      isMuted: false,
      isSolo: false,
      volume: 0.8,
      levels: [0.6, 0.7, 0.5, 0.8, 0.6, 0.7, 0.5, 0.9],
    },
    {
      id: '2',
      name: 'Microphone',
      source: 'Built-in Mic',
      color: '#34C759',
      isMuted: false,
      isSolo: false,
      volume: 1.0,
      levels: [0.4, 0.5, 0.7, 0.6, 0.8, 0.5, 0.6, 0.7],
    },
    {
      id: '3',
      name: 'Participant 1',
      source: 'Remote',
      color: '#FF9500',
      isMuted: false,
      isSolo: false,
      volume: 0.9,
      levels: [0.5, 0.6, 0.4, 0.7, 0.5, 0.6, 0.8, 0.5],
    },
    {
      id: '4',
      name: 'Participant 2',
      source: 'Remote',
      color: '#AF52DE',
      isMuted: true,
      isSolo: false,
      volume: 0.7,
      levels: [0.3, 0.4, 0.3, 0.5, 0.4, 0.3, 0.4, 0.3],
    },
  ]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = (id: string) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, isMuted: !t.isMuted } : t)));
  };

  const toggleSolo = (id: string) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, isSolo: !t.isSolo } : t)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.recordingBadge}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.masterMeter}>
        <Text style={styles.masterLabel}>Master</Text>
        <View style={styles.meterContainer}>
          <View style={styles.meterBar}>
            <View style={[styles.meterFill, { width: '75%' }]} />
          </View>
          <View style={styles.meterBar}>
            <View style={[styles.meterFill, { width: '68%' }]} />
          </View>
        </View>
        <Text style={styles.dbLabel}>-6 dB</Text>
      </View>

      <ScrollView style={styles.tracksContainer} showsVerticalScrollIndicator={false}>
        {tracks.map(track => (
          <View key={track.id} style={styles.trackCard}>
            <View style={styles.trackHeader}>
              <View style={[styles.trackColorBar, { backgroundColor: track.color }]} />
              <View style={styles.trackInfo}>
                <Text style={styles.trackName}>{track.name}</Text>
                <Text style={styles.trackSource}>{track.source}</Text>
              </View>
              <View style={styles.trackControls}>
                <TouchableOpacity
                  style={[styles.controlButton, track.isMuted && styles.controlButtonActive]}
                  onPress={() => toggleMute(track.id)}
                >
                  <Text style={[styles.controlText, track.isMuted && styles.controlTextActive]}>
                    M
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, track.isSolo && styles.soloButtonActive]}
                  onPress={() => toggleSolo(track.id)}
                >
                  <Text style={[styles.controlText, track.isSolo && styles.soloTextActive]}>S</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.trackWaveform}>
              {track.levels.map((level, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: 40 * level * (track.isMuted ? 0.2 : 1),
                      backgroundColor: track.isMuted ? '#8E8E93' : track.color,
                      opacity: track.isMuted ? 0.3 : 1,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.trackMeter}>
              <View style={styles.volumeSlider}>
                <View
                  style={[
                    styles.volumeFill,
                    { width: `${track.volume * 100}%`, backgroundColor: track.color },
                  ]}
                />
                <View style={[styles.volumeKnob, { left: `${track.volume * 100 - 2}%` }]} />
              </View>
              <Text style={styles.volumeLabel}>{Math.round(track.volume * 100)}%</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addTrackButton}>
          <Ionicons name="add-circle" size={24} color="#007AFF" />
          <Text style={styles.addTrackText}>Add Audio Source</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark" size={22} color="#FF9500" />
            <Text style={styles.actionText}>Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pauseButton}>
            <Ionicons name="pause" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopButton} onPress={() => setIsRecording(false)}>
            <View style={styles.stopIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="layers" size={22} color="#007AFF" />
            <Text style={styles.actionText}>Tracks</Text>
          </TouchableOpacity>
        </View>
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
  recordingBadge: { flexDirection: 'row', alignItems: 'center' },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  recordingText: { fontSize: 13, fontWeight: '500', color: '#FF3B30' },
  durationText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFF',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  settingsButton: { padding: 4 },
  masterMeter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
  },
  masterLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', width: 50 },
  meterContainer: { flex: 1, marginHorizontal: 12 },
  meterBar: { height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, marginVertical: 2 },
  meterFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  dbLabel: { fontSize: 12, color: '#8E8E93', width: 45, textAlign: 'right' },
  tracksContainer: { flex: 1, paddingHorizontal: 16, marginTop: 16 },
  trackCard: { backgroundColor: '#1C1C1E', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  trackHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  trackColorBar: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  trackSource: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  trackControls: { flexDirection: 'row' },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  controlButtonActive: { backgroundColor: '#FF3B30' },
  soloButtonActive: { backgroundColor: '#FF9500' },
  controlText: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
  controlTextActive: { color: '#FFF' },
  soloTextActive: { color: '#FFF' },
  trackWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D0D0D',
  },
  waveBar: { width: 20, borderRadius: 4 },
  trackMeter: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  volumeSlider: {
    flex: 1,
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    position: 'relative',
  },
  volumeFill: { height: '100%', borderRadius: 3 },
  volumeKnob: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  volumeLabel: { fontSize: 12, color: '#8E8E93', width: 40, textAlign: 'right' },
  addTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderStyle: 'dashed',
  },
  addTrackText: { fontSize: 15, color: '#007AFF', marginLeft: 8 },
  bottomPadding: { height: 20 },
  controls: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  pauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: { width: 18, height: 18, borderRadius: 3, backgroundColor: '#FFF' },
});

export default MultiTrackRecordingScreen;
