import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SpeechCoachScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'practice' | 'presentation' | 'interview'>(
    'practice'
  );

  const metrics = [
    { label: 'Pace', value: '145 wpm', status: 'good', icon: 'speedometer' },
    { label: 'Clarity', value: '92%', status: 'excellent', icon: 'mic' },
    { label: 'Filler Words', value: '3', status: 'good', icon: 'warning' },
    { label: 'Volume', value: 'Optimal', status: 'excellent', icon: 'volume-high' },
  ];

  const modes = [
    { id: 'practice', label: 'Free Practice', icon: 'mic' },
    { id: 'presentation', label: 'Presentation', icon: 'easel' },
    { id: 'interview', label: 'Interview', icon: 'people' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Speech Coach</Text>
        <TouchableOpacity>
          <Ionicons name="analytics" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.modeSelector}>
        {modes.map(mode => (
          <TouchableOpacity
            key={mode.id}
            style={[styles.modeButton, selectedMode === mode.id && styles.modeButtonActive]}
            onPress={() => setSelectedMode(mode.id as typeof selectedMode)}
          >
            <Ionicons
              name={mode.icon as any}
              size={20}
              color={selectedMode === mode.id ? '#FFF' : '#007AFF'}
            />
            <Text style={[styles.modeText, selectedMode === mode.id && styles.modeTextActive]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.recordSection}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {isRecording ? 'Recording your speech...' : 'Tap to start practicing'}
          </Text>
          {isRecording && <Text style={styles.recordingTime}>00:01:23</Text>}
        </View>

        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Live Metrics</Text>
          <View style={styles.metricsGrid}>
            {metrics.map(metric => (
              <View key={metric.label} style={styles.metricCard}>
                <Ionicons
                  name={metric.icon as any}
                  size={24}
                  color={
                    metric.status === 'excellent'
                      ? '#34C759'
                      : metric.status === 'good'
                        ? '#007AFF'
                        : '#FF9500'
                  }
                />
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FF9500" />
            <Text style={styles.tipText}>
              Try to maintain eye contact with your audience. Look up from your notes periodically.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="time" size={20} color="#007AFF" />
            <Text style={styles.tipText}>
              Your pace is slightly fast. Try taking brief pauses between key points.
            </Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {[1, 2, 3].map(i => (
            <TouchableOpacity key={i} style={styles.sessionCard}>
              <View style={styles.sessionIcon}>
                <Ionicons name="play-circle" size={24} color="#007AFF" />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>Practice Session {i}</Text>
                <Text style={styles.sessionMeta}>5 min • {92 - i}% clarity</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modeButtonActive: { backgroundColor: '#007AFF' },
  modeText: { fontSize: 12, color: '#007AFF', marginLeft: 6 },
  modeTextActive: { color: '#FFF' },
  content: { flex: 1 },
  recordSection: { backgroundColor: '#FFF', padding: 32, alignItems: 'center', marginBottom: 8 },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: { backgroundColor: '#FF3B30' },
  recordHint: { fontSize: 14, color: '#666', marginTop: 16 },
  recordingTime: { fontSize: 24, fontWeight: '300', color: '#1A1A1A', marginTop: 8 },
  metricsSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metricCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: '1%',
  },
  metricValue: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginTop: 8 },
  metricLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  tipsSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  tipText: { flex: 1, fontSize: 14, color: '#1A1A1A', marginLeft: 12, lineHeight: 20 },
  historySection: { padding: 16, marginBottom: 24 },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  sessionIcon: { marginRight: 12 },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  sessionMeta: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default SpeechCoachScreen;
