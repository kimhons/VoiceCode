/**
 * VoiceFlow Pro - Home Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function HomeScreen() {
  const recordings = useSelector((state: RootState) => state.recordings.recordings);
  const user = useSelector((state: RootState) => state.user);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VoiceFlow Pro</Text>
        <Text style={styles.subtitle}>Professional Voice Recording</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="mic" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{recordings.length}</Text>
          <Text style={styles.statLabel}>Recordings</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="time" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>
            {Math.round(recordings.reduce((acc, r) => acc + r.duration, 0) / 60)}
          </Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>
            {recordings.filter(r => r.transcription).length}
          </Text>
          <Text style={styles.statLabel}>Transcribed</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recent Recordings</Text>
        {recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mic-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>Tap the Record button to get started</Text>
          </View>
        ) : (
          recordings.slice(0, 5).map((recording) => (
            <TouchableOpacity key={recording.id} style={styles.recordingItem}>
              <View style={styles.recordingIcon}>
                <Ionicons name="play-circle" size={40} color="#007AFF" />
              </View>
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingTitle}>{recording.title}</Text>
                <Text style={styles.recordingMeta}>
                  {Math.round(recording.duration / 60)} min • {recording.language}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#007AFF' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  statBox: { flex: 1, alignItems: 'center', padding: 12 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
  recordingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  recordingIcon: { marginRight: 16 },
  recordingInfo: { flex: 1 },
  recordingTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  recordingMeta: { fontSize: 12, color: '#666', marginTop: 4 },
});

