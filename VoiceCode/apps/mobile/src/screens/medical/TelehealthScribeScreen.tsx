import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TelehealthSession {
  id: string;
  patientName: string;
  platform: string;
  startTime: Date;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  hasTranscript: boolean;
}

const TelehealthScribeScreen: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [speakerDiarization, setSpeakerDiarization] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(true);

  const platforms = [
    { id: 'zoom', name: 'Zoom', icon: 'videocam', connected: true },
    { id: 'teams', name: 'Microsoft Teams', icon: 'people', connected: true },
    { id: 'meet', name: 'Google Meet', icon: 'logo-google', connected: false },
    { id: 'doxy', name: 'Doxy.me', icon: 'medkit', connected: true },
  ];

  const recentSessions: TelehealthSession[] = [
    {
      id: '1',
      patientName: 'John Smith',
      platform: 'Zoom',
      startTime: new Date(Date.now() - 3600000),
      duration: 25,
      status: 'completed',
      hasTranscript: true,
    },
    {
      id: '2',
      patientName: 'Maria Garcia',
      platform: 'Doxy.me',
      startTime: new Date(Date.now() - 7200000),
      duration: 18,
      status: 'completed',
      hasTranscript: true,
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      platform: 'Teams',
      startTime: new Date(Date.now() - 86400000),
      duration: 32,
      status: 'completed',
      hasTranscript: true,
    },
  ];

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Telehealth Scribe</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.listeningSection}>
          <TouchableOpacity
            style={[styles.listeningButton, isListening && styles.listeningButtonActive]}
            onPress={() => setIsListening(!isListening)}
          >
            <View style={[styles.listeningIcon, isListening && styles.listeningIconActive]}>
              <Ionicons name={isListening ? 'radio' : 'mic'} size={32} color="#FFF" />
            </View>
            <Text style={styles.listeningTitle}>
              {isListening ? 'Listening to Call...' : 'Start Listening'}
            </Text>
            <Text style={styles.listeningSubtitle}>
              {isListening
                ? 'Transcribing audio in real-time'
                : 'Tap to begin transcribing your telehealth call'}
            </Text>
          </TouchableOpacity>

          {isListening && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live Transcription Active</Text>
              <View style={styles.waveform}>
                {[0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.6].map((h, i) => (
                  <View key={i} style={[styles.waveformBar, { height: 20 * h }]} />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Platforms</Text>
          <View style={styles.platformsGrid}>
            {platforms.map(platform => (
              <TouchableOpacity key={platform.id} style={styles.platformCard}>
                <View
                  style={[styles.platformIcon, platform.connected && styles.platformIconConnected]}
                >
                  <Ionicons
                    name={platform.icon as any}
                    size={24}
                    color={platform.connected ? '#007AFF' : '#999'}
                  />
                </View>
                <Text style={styles.platformName}>{platform.name}</Text>
                <View
                  style={[
                    styles.platformStatus,
                    platform.connected && styles.platformStatusConnected,
                  ]}
                >
                  <Text
                    style={[
                      styles.platformStatusText,
                      platform.connected && styles.platformStatusTextConnected,
                    ]}
                  >
                    {platform.connected ? 'Connected' : 'Connect'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcription Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="text" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>Auto-Transcribe</Text>
              </View>
              <Switch
                value={autoTranscribe}
                onValueChange={setAutoTranscribe}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="people" size={20} color="#FF9500" />
                <Text style={styles.settingLabel}>Speaker Identification</Text>
              </View>
              <Switch
                value={speakerDiarization}
                onValueChange={setSpeakerDiarization}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-mute" size={20} color="#34C759" />
                <Text style={styles.settingLabel}>Noise Reduction</Text>
              </View>
              <Switch
                value={noiseReduction}
                onValueChange={setNoiseReduction}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentSessions.map(session => (
            <TouchableOpacity key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionPatient}>{session.patientName}</Text>
                  <View style={styles.sessionMeta}>
                    <Ionicons name="videocam" size={12} color="#8E8E93" />
                    <Text style={styles.sessionPlatform}>{session.platform}</Text>
                    <Text style={styles.sessionDot}>•</Text>
                    <Text style={styles.sessionDuration}>{session.duration} min</Text>
                  </View>
                </View>
                <Text style={styles.sessionTime}>{formatTime(session.startTime)}</Text>
              </View>
              {session.hasTranscript && (
                <View style={styles.sessionFooter}>
                  <View style={styles.transcriptBadge}>
                    <Ionicons name="document-text" size={12} color="#34C759" />
                    <Text style={styles.transcriptText}>Transcript Available</Text>
                  </View>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                    <Ionicons name="chevron-forward" size={14} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  settingsButton: { padding: 4 },
  content: { flex: 1 },
  listeningSection: { padding: 16 },
  listeningButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  listeningButtonActive: { backgroundColor: '#34C759' },
  listeningIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  listeningIconActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  listeningTitle: { fontSize: 20, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  listeningSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', marginRight: 8 },
  liveText: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginRight: 12 },
  waveform: { flexDirection: 'row', alignItems: 'center' },
  waveformBar: { width: 3, backgroundColor: '#34C759', borderRadius: 2, marginHorizontal: 1 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  seeAllText: { fontSize: 14, color: '#007AFF' },
  platformsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  platformCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    margin: '1%',
    alignItems: 'center',
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformIconConnected: { backgroundColor: '#007AFF10' },
  platformName: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginBottom: 8 },
  platformStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  platformStatusConnected: { backgroundColor: '#34C75920' },
  platformStatusText: { fontSize: 12, color: '#8E8E93' },
  platformStatusTextConnected: { color: '#34C759', fontWeight: '500' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  sessionCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {},
  sessionPatient: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  sessionMeta: { flexDirection: 'row', alignItems: 'center' },
  sessionPlatform: { fontSize: 13, color: '#8E8E93', marginLeft: 4 },
  sessionDot: { fontSize: 13, color: '#8E8E93', marginHorizontal: 6 },
  sessionDuration: { fontSize: 13, color: '#8E8E93' },
  sessionTime: { fontSize: 12, color: '#8E8E93' },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  transcriptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C75910',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  transcriptText: { fontSize: 12, color: '#34C759', marginLeft: 4 },
  viewButton: { flexDirection: 'row', alignItems: 'center' },
  viewButtonText: { fontSize: 14, color: '#007AFF', marginRight: 2 },
  bottomPadding: { height: 40 },
});

export default TelehealthScribeScreen;
