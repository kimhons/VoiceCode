import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AudioVisualizerScreen: React.FC = () => {
  const [visualizerType, setVisualizerType] = useState('waveform');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(125);
  const totalDuration = 1845;

  const visualizerTypes = [
    { id: 'waveform', label: 'Waveform', icon: 'pulse' },
    { id: 'spectrum', label: 'Spectrum', icon: 'bar-chart' },
    { id: 'circular', label: 'Circular', icon: 'radio-button-on' },
    { id: 'bars', label: 'Bars', icon: 'stats-chart' },
  ];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const waveformBars = Array.from({ length: 60 }, () => Math.random() * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Audio Visualizer</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.recordingInfo}>
        <Text style={styles.recordingName}>Team Meeting Recording</Text>
        <Text style={styles.recordingMeta}>Today at 10:30 AM • 30:45</Text>
      </View>

      <View style={styles.visualizerContainer}>
        <View style={styles.visualizerBackground}>
          {visualizerType === 'waveform' && (
            <View style={styles.waveformContainer}>
              {waveformBars.map((height, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveformBar,
                    {
                      height: `${height}%`,
                      backgroundColor:
                        idx < (currentTime / totalDuration) * 60 ? '#007AFF' : '#E5E5EA',
                    },
                  ]}
                />
              ))}
            </View>
          )}
          {visualizerType === 'spectrum' && (
            <View style={styles.spectrumContainer}>
              {Array.from({ length: 20 }, (_, idx) => (
                <View key={idx} style={styles.spectrumColumn}>
                  {Array.from({ length: 10 }, (_, rowIdx) => (
                    <View
                      key={rowIdx}
                      style={[
                        styles.spectrumCell,
                        {
                          backgroundColor: rowIdx < Math.random() * 10 ? '#007AFF' : '#E5E5EA20',
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
          {visualizerType === 'circular' && (
            <View style={styles.circularContainer}>
              <View style={styles.circularOuter}>
                <View style={styles.circularInner}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color="#007AFF" />
                </View>
              </View>
            </View>
          )}
          {visualizerType === 'bars' && (
            <View style={styles.barsContainer}>
              {Array.from({ length: 8 }, (_, idx) => (
                <View
                  key={idx}
                  style={[styles.verticalBar, { height: `${20 + Math.random() * 60}%` }]}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.typeSelector}>
        {visualizerTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[styles.typeButton, visualizerType === type.id && styles.typeButtonActive]}
            onPress={() => setVisualizerType(type.id)}
          >
            <Ionicons
              name={type.icon as any}
              size={20}
              color={visualizerType === type.id ? '#FFF' : '#8E8E93'}
            />
            <Text style={[styles.typeLabel, visualizerType === type.id && styles.typeLabelActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.timelineContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <View style={styles.timeline}>
          <View
            style={[styles.timelineFill, { width: `${(currentTime / totalDuration) * 100}%` }]}
          />
          <View
            style={[styles.timelineHandle, { left: `${(currentTime / totalDuration) * 100}%` }]}
          />
        </View>
        <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={28} color="#1C1C1E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-back" size={32} color="#1C1C1E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={() => setIsPlaying(!isPlaying)}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-forward" size={32} color="#1C1C1E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={28} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={22} color="#007AFF" />
          <Text style={styles.actionText}>Bookmark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={22} color="#007AFF" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download-outline" size={22} color="#007AFF" />
          <Text style={styles.actionText}>Export</Text>
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
  settingsButton: { padding: 4 },
  recordingInfo: { alignItems: 'center', paddingVertical: 16 },
  recordingName: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  recordingMeta: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  visualizerContainer: { flex: 1, paddingHorizontal: 16 },
  visualizerBackground: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: { flexDirection: 'row', alignItems: 'center', height: '60%', width: '90%' },
  waveformBar: { flex: 1, marginHorizontal: 1, borderRadius: 2, minHeight: 4 },
  spectrumContainer: {
    flexDirection: 'row',
    height: '60%',
    width: '90%',
    justifyContent: 'space-around',
  },
  spectrumColumn: { flex: 1, flexDirection: 'column-reverse', marginHorizontal: 2 },
  spectrumCell: { flex: 1, marginVertical: 1, borderRadius: 2 },
  circularContainer: { justifyContent: 'center', alignItems: 'center' },
  circularOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#007AFF40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', height: '60%', width: '80%' },
  verticalBar: { flex: 1, backgroundColor: '#007AFF', marginHorizontal: 4, borderRadius: 4 },
  typeSelector: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 16 },
  typeButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
  },
  typeButtonActive: { backgroundColor: '#007AFF' },
  typeLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  typeLabelActive: { color: '#FFF' },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timeText: { fontSize: 12, color: '#8E8E93', width: 45 },
  timeline: {
    flex: 1,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  timelineFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  timelineHandle: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginLeft: -8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  controlButton: { padding: 12 },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 12, color: '#007AFF', marginTop: 6 },
});

export default AudioVisualizerScreen;
