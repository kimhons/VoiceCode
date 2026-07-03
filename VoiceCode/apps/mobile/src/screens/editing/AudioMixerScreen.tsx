import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AudioTrack {
  id: string;
  name: string;
  type: 'voice' | 'music' | 'sfx' | 'ambient';
  color: string;
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
}

const AudioMixerScreen: React.FC = () => {
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [isPlaying, setIsPlaying] = useState(false);

  const [tracks, setTracks] = useState<AudioTrack[]>([
    {
      id: '1',
      name: 'Main Voice',
      type: 'voice',
      color: '#007AFF',
      volume: 1.0,
      pan: 0,
      isMuted: false,
      isSolo: false,
    },
    {
      id: '2',
      name: 'Speaker 2',
      type: 'voice',
      color: '#34C759',
      volume: 0.9,
      pan: 0,
      isMuted: false,
      isSolo: false,
    },
    {
      id: '3',
      name: 'Background Music',
      type: 'music',
      color: '#FF9500',
      volume: 0.3,
      pan: 0,
      isMuted: true,
      isSolo: false,
    },
    {
      id: '4',
      name: 'Ambient',
      type: 'ambient',
      color: '#AF52DE',
      volume: 0.15,
      pan: 0,
      isMuted: false,
      isSolo: false,
    },
  ]);

  const toggleMute = (id: string) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, isMuted: !t.isMuted } : t)));
  };

  const toggleSolo = (id: string) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, isSolo: !t.isSolo } : t)));
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'voice':
        return 'mic';
      case 'music':
        return 'musical-notes';
      case 'sfx':
        return 'volume-high';
      case 'ambient':
        return 'leaf';
      default:
        return 'musical-note';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Audio Mixer</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.masterSection}>
        <View style={styles.masterInfo}>
          <Text style={styles.masterLabel}>Master</Text>
          <Text style={styles.masterDb}>{Math.round((masterVolume - 1) * 20)} dB</Text>
        </View>
        <View style={styles.masterMeter}>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { height: `${masterVolume * 100}%` }]} />
          </View>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { height: `${masterVolume * 95}%` }]} />
          </View>
        </View>
        <View style={styles.masterControls}>
          <TouchableOpacity
            style={styles.playButtonMaster}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.tracksContainer} showsVerticalScrollIndicator={false}>
        {tracks.map(track => (
          <View key={track.id} style={styles.trackCard}>
            <View style={styles.trackHeader}>
              <View style={[styles.trackIcon, { backgroundColor: track.color + '30' }]}>
                <Ionicons name={getTypeIcon(track.type) as any} size={18} color={track.color} />
              </View>
              <View style={styles.trackInfo}>
                <Text style={styles.trackName}>{track.name}</Text>
                <Text style={styles.trackType}>{track.type}</Text>
              </View>
              <View style={styles.trackButtons}>
                <TouchableOpacity
                  style={[styles.muteBtn, track.isMuted && styles.muteBtnActive]}
                  onPress={() => toggleMute(track.id)}
                >
                  <Text style={[styles.muteBtnText, track.isMuted && styles.muteBtnTextActive]}>
                    M
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.soloBtn, track.isSolo && styles.soloBtnActive]}
                  onPress={() => toggleSolo(track.id)}
                >
                  <Text style={[styles.soloBtnText, track.isSolo && styles.soloBtnTextActive]}>
                    S
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.trackControls}>
              <View style={styles.volumeSection}>
                <Text style={styles.controlLabel}>Volume</Text>
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <View
                      style={[
                        styles.sliderFill,
                        {
                          width: `${track.volume * 100}%`,
                          backgroundColor: track.isMuted ? '#8E8E93' : track.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.volumeValue}>{Math.round(track.volume * 100)}%</Text>
                </View>
              </View>

              <View style={styles.panSection}>
                <Text style={styles.controlLabel}>Pan</Text>
                <View style={styles.panContainer}>
                  <Text style={styles.panLabel}>L</Text>
                  <View style={styles.panTrack}>
                    <View
                      style={[styles.panIndicator, { left: `${((track.pan + 1) / 2) * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.panLabel}>R</Text>
                </View>
              </View>
            </View>

            <View style={styles.trackMeter}>
              {Array.from({ length: 20 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.meterBar,
                    {
                      backgroundColor:
                        i < track.volume * 20 * (track.isMuted ? 0 : 1)
                          ? i > 16
                            ? '#FF3B30'
                            : i > 12
                              ? '#FF9500'
                              : track.color
                          : '#3C3C3E',
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addTrackButton}>
          <Ionicons name="add-circle" size={24} color="#007AFF" />
          <Text style={styles.addTrackText}>Add Audio Track</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.presetSection}>
          <Text style={styles.presetLabel}>Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Default', 'Voice Focus', 'Music Mix', 'Podcast'].map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.presetBtn, idx === 0 && styles.presetBtnActive]}
              >
                <Text style={[styles.presetBtnText, idx === 0 && styles.presetBtnTextActive]}>
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyText}>Apply Mix</Text>
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
  addButton: { padding: 4 },
  masterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  masterInfo: { marginRight: 16 },
  masterLabel: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  masterDb: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  masterMeter: { flexDirection: 'row', flex: 1, height: 80 },
  meterTrack: {
    width: 12,
    backgroundColor: '#3C3C3E',
    borderRadius: 6,
    marginHorizontal: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  meterFill: { backgroundColor: '#34C759', borderRadius: 6 },
  masterControls: { marginLeft: 16 },
  playButtonMaster: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tracksContainer: { flex: 1, padding: 16 },
  trackCard: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14, marginBottom: 12 },
  trackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  trackIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  trackType: { fontSize: 12, color: '#8E8E93', marginTop: 2, textTransform: 'capitalize' },
  trackButtons: { flexDirection: 'row' },
  muteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3C3C3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  muteBtnActive: { backgroundColor: '#FF3B30' },
  muteBtnText: { fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  muteBtnTextActive: { color: '#FFF' },
  soloBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3C3C3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  soloBtnActive: { backgroundColor: '#FF9500' },
  soloBtnText: { fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  soloBtnTextActive: { color: '#FFF' },
  trackControls: { flexDirection: 'row', marginBottom: 12 },
  volumeSection: { flex: 2, marginRight: 16 },
  panSection: { flex: 1 },
  controlLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 6 },
  sliderContainer: { flexDirection: 'row', alignItems: 'center' },
  sliderTrack: { flex: 1, height: 6, backgroundColor: '#3C3C3E', borderRadius: 3, marginRight: 8 },
  sliderFill: { height: '100%', borderRadius: 3 },
  volumeValue: { fontSize: 12, color: '#8E8E93', width: 35 },
  panContainer: { flexDirection: 'row', alignItems: 'center' },
  panLabel: { fontSize: 10, color: '#8E8E93', width: 12 },
  panTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#3C3C3E',
    borderRadius: 3,
    marginHorizontal: 4,
    position: 'relative',
  },
  panIndicator: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
    marginLeft: -6,
  },
  trackMeter: { flexDirection: 'row', height: 8, justifyContent: 'space-between' },
  meterBar: { width: 8, borderRadius: 2 },
  addTrackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3C3C3E',
    borderStyle: 'dashed',
  },
  addTrackText: { fontSize: 15, color: '#007AFF', marginLeft: 8 },
  bottomPadding: { height: 20 },
  footer: { backgroundColor: '#1C1C1E', padding: 16, borderTopWidth: 1, borderTopColor: '#3C3C3E' },
  presetSection: { marginBottom: 12 },
  presetLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 8 },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3C3C3E',
    borderRadius: 16,
    marginRight: 8,
  },
  presetBtnActive: { backgroundColor: '#007AFF' },
  presetBtnText: { fontSize: 13, color: '#8E8E93' },
  presetBtnTextActive: { color: '#FFF', fontWeight: '500' },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});

export default AudioMixerScreen;
