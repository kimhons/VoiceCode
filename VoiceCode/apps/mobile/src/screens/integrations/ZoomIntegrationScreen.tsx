import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface UpcomingMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  autoRecord: boolean;
}

const ZoomIntegrationScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [autoJoin, setAutoJoin] = useState(true);
  const [autoRecord, setAutoRecord] = useState(true);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [captureChat, setCaptureChat] = useState(false);
  const [syncCalendar, setSyncCalendar] = useState(true);

  const upcomingMeetings: UpcomingMeeting[] = [
    {
      id: '1',
      title: 'Weekly Team Standup',
      date: 'Today',
      time: '10:00 AM',
      duration: 30,
      autoRecord: true,
    },
    {
      id: '2',
      title: 'Product Review',
      date: 'Today',
      time: '2:00 PM',
      duration: 60,
      autoRecord: true,
    },
    {
      id: '3',
      title: 'Client Call - Acme Corp',
      date: 'Tomorrow',
      time: '11:00 AM',
      duration: 45,
      autoRecord: false,
    },
    {
      id: '4',
      title: 'Engineering Sync',
      date: 'Jan 20',
      time: '9:30 AM',
      duration: 30,
      autoRecord: true,
    },
  ];

  const recentRecordings = [
    { title: 'Sprint Planning', date: 'Yesterday', duration: '45 min', status: 'transcribed' },
    { title: 'Design Review', date: '2 days ago', duration: '32 min', status: 'transcribed' },
    { title: 'All Hands Meeting', date: 'Last week', duration: '1h 15min', status: 'processing' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Zoom Integration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionIcon}>
            <Ionicons name="videocam" size={28} color="#2D8CFF" />
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionTitle}>Zoom</Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]}
              />
              <Text style={[styles.statusText, { color: isConnected ? '#34C759' : '#FF3B30' }]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.connectButton, isConnected && styles.disconnectBtn]}>
            <Text style={[styles.connectText, isConnected && styles.disconnectText]}>
              {isConnected ? 'Disconnect' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="enter" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Join Meetings</Text>
                  <Text style={styles.settingDescription}>
                    Bot joins scheduled meetings automatically
                  </Text>
                </View>
              </View>
              <Switch
                value={autoJoin}
                onValueChange={setAutoJoin}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="radio-button-on" size={20} color="#FF3B30" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Record</Text>
                  <Text style={styles.settingDescription}>Start recording when meeting begins</Text>
                </View>
              </View>
              <Switch
                value={autoRecord}
                onValueChange={setAutoRecord}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="text" size={20} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Transcribe</Text>
                  <Text style={styles.settingDescription}>Generate transcript after recording</Text>
                </View>
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
                <Ionicons name="chatbubbles" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Capture Chat</Text>
                  <Text style={styles.settingDescription}>Include chat messages in transcript</Text>
                </View>
              </View>
              <Switch
                value={captureChat}
                onValueChange={setCaptureChat}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar Sync</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="calendar" size={20} color="#5856D6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sync with Calendar</Text>
                  <Text style={styles.settingDescription}>Auto-detect meetings from calendar</Text>
                </View>
              </View>
              <Switch
                value={syncCalendar}
                onValueChange={setSyncCalendar}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {upcomingMeetings.map(meeting => (
            <View key={meeting.id} style={styles.meetingCard}>
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
                <View style={styles.meetingMeta}>
                  <Text style={styles.meetingDate}>{meeting.date}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.meetingTime}>{meeting.time}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.meetingDuration}>{meeting.duration} min</Text>
                </View>
              </View>
              <View style={styles.meetingActions}>
                {meeting.autoRecord && (
                  <View style={styles.autoRecordBadge}>
                    <Ionicons name="radio-button-on" size={12} color="#FF3B30" />
                  </View>
                )}
                <TouchableOpacity style={styles.meetingButton}>
                  <Ionicons name="settings-outline" size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Recordings</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentRecordings.map((recording, idx) => (
            <TouchableOpacity key={idx} style={styles.recordingCard}>
              <View style={styles.recordingIcon}>
                <Ionicons name="videocam" size={20} color="#2D8CFF" />
              </View>
              <View style={styles.recordingInfo}>
                <Text style={styles.recordingTitle}>{recording.title}</Text>
                <View style={styles.recordingMeta}>
                  <Text style={styles.recordingDate}>{recording.date}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.recordingDuration}>{recording.duration}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  recording.status === 'transcribed'
                    ? styles.transcribedBadge
                    : styles.processingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: recording.status === 'transcribed' ? '#34C759' : '#FF9500' },
                  ]}
                >
                  {recording.status === 'transcribed' ? 'Transcribed' : 'Processing'}
                </Text>
              </View>
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
  placeholder: { width: 32 },
  content: { flex: 1 },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  connectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#2D8CFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  connectionInfo: { flex: 1 },
  connectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  connected: { backgroundColor: '#34C759' },
  disconnected: { backgroundColor: '#FF3B30' },
  statusText: { fontSize: 13 },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  disconnectBtn: { backgroundColor: '#FF3B3020' },
  connectText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  disconnectText: { color: '#FF3B30' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: { fontSize: 14, color: '#007AFF' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  meetingInfo: { flex: 1 },
  meetingTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  meetingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meetingDate: { fontSize: 13, color: '#8E8E93' },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  meetingTime: { fontSize: 13, color: '#8E8E93' },
  meetingDuration: { fontSize: 13, color: '#8E8E93' },
  meetingActions: { flexDirection: 'row', alignItems: 'center' },
  autoRecordBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B3020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  meetingButton: { padding: 4 },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  recordingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2D8CFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingInfo: { flex: 1 },
  recordingTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  recordingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  recordingDate: { fontSize: 13, color: '#8E8E93' },
  recordingDuration: { fontSize: 13, color: '#8E8E93' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  transcribedBadge: { backgroundColor: '#34C75920' },
  processingBadge: { backgroundColor: '#FF950020' },
  statusBadgeText: { fontSize: 12, fontWeight: '500' },
  bottomPadding: { height: 40 },
});

export default ZoomIntegrationScreen;
