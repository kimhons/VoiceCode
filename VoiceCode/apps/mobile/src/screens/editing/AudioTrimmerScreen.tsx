import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AudioTrimmerScreen: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [startTime, setStartTime] = useState(30);
  const [endTime, setEndTime] = useState(180);
  const totalDuration = 245;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const waveformData = Array.from({ length: 60 }, () => Math.random() * 0.8 + 0.2);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trim Audio</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.fileInfo}>
          <View style={styles.fileIcon}>
            <Ionicons name="musical-note" size={24} color="#FF3B30" />
          </View>
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>Team Meeting Recording</Text>
            <Text style={styles.fileMeta}>Original: {formatTime(totalDuration)} • MP3</Text>
          </View>
        </View>

        <View style={styles.waveformContainer}>
          <View style={styles.waveformWrapper}>
            <View style={styles.waveform}>
              {waveformData.map((height, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveBar,
                    {
                      height: `${height * 100}%`,
                      backgroundColor:
                        idx >= (startTime / totalDuration) * 60 &&
                        idx <= (endTime / totalDuration) * 60
                          ? '#007AFF'
                          : '#E5E5EA',
                    },
                  ]}
                />
              ))}
            </View>
            <View
              style={[
                styles.selectionOverlay,
                {
                  left: `${(startTime / totalDuration) * 100}%`,
                  width: `${((endTime - startTime) / totalDuration) * 100}%`,
                },
              ]}
            >
              <View style={styles.handleLeft}>
                <View style={styles.handleBar} />
              </View>
              <View style={styles.handleRight}>
                <View style={styles.handleBar} />
              </View>
            </View>
            <View style={[styles.playhead, { left: `${(currentTime / totalDuration) * 100}%` }]} />
          </View>

          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>0:00</Text>
            <Text style={styles.timeLabel}>{formatTime(totalDuration / 2)}</Text>
            <Text style={styles.timeLabel}>{formatTime(totalDuration)}</Text>
          </View>
        </View>

        <View style={styles.selectionInfo}>
          <View style={styles.selectionTime}>
            <Text style={styles.selectionLabel}>Start</Text>
            <TouchableOpacity style={styles.timeInput}>
              <Text style={styles.timeInputText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.durationBadge}>
            <Ionicons name="time" size={14} color="#007AFF" />
            <Text style={styles.durationText}>{formatTime(endTime - startTime)}</Text>
          </View>
          <View style={styles.selectionTime}>
            <Text style={styles.selectionLabel}>End</Text>
            <TouchableOpacity style={styles.timeInput}>
              <Text style={styles.timeInputText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-back" size={28} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={() => setIsPlaying(!isPlaying)}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="play-forward" size={28} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="cut" size={20} color="#FF9500" />
            </View>
            <Text style={styles.quickActionText}>Split</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="remove-circle" size={20} color="#FF3B30" />
            </View>
            <Text style={styles.quickActionText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="copy" size={20} color="#007AFF" />
            </View>
            <Text style={styles.quickActionText}>Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="volume-mute" size={20} color="#AF52DE" />
            </View>
            <Text style={styles.quickActionText}>Mute</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Preview Trim</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewInfo}>
              <Text style={styles.previewLabel}>New Duration</Text>
              <Text style={styles.previewValue}>{formatTime(endTime - startTime)}</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewLabel}>Removed</Text>
              <Text style={styles.previewValue}>
                {formatTime(totalDuration - (endTime - startTime))}
              </Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewLabel}>Est. Size</Text>
              <Text style={styles.previewValue}>2.4 MB</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.undoButton}>
          <Ionicons name="arrow-undo" size={20} color="#007AFF" />
          <Text style={styles.undoText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton}>
          <Text style={styles.applyText}>Apply Trim</Text>
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
  cancelButton: { padding: 4 },
  cancelText: { fontSize: 17, color: '#007AFF' },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  saveButton: { padding: 4 },
  saveText: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF3B3020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileDetails: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  fileMeta: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  waveformContainer: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 20 },
  waveformWrapper: { height: 100, position: 'relative' },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waveBar: { width: 3, borderRadius: 2 },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#007AFF10',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  handleLeft: {
    position: 'absolute',
    left: -8,
    top: 0,
    bottom: 0,
    width: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleRight: {
    position: 'absolute',
    right: -8,
    top: 0,
    bottom: 0,
    width: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBar: { width: 4, height: 40, backgroundColor: '#007AFF', borderRadius: 2 },
  playhead: { position: 'absolute', top: -8, bottom: -8, width: 2, backgroundColor: '#FF3B30' },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeLabel: { fontSize: 11, color: '#8E8E93' },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  selectionTime: { alignItems: 'center' },
  selectionLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  timeInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timeInputText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    fontVariant: ['tabular-nums'],
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  durationText: { fontSize: 15, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  controlButton: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  quickAction: { alignItems: 'center' },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: { fontSize: 12, color: '#8E8E93' },
  previewSection: {},
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  previewInfo: { flex: 1, alignItems: 'center' },
  previewLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  previewValue: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  previewDivider: { width: 1, backgroundColor: '#F2F2F7' },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginRight: 10,
  },
  undoText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});

export default AudioTrimmerScreen;
