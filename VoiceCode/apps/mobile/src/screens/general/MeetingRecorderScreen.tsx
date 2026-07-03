import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MeetingRecorderScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [participants, setParticipants] = useState<string[]>(['You']);

  const recentMeetings = [
    { id: '1', title: 'Weekly Team Standup', date: 'Today', duration: '32 min', participants: 5 },
    {
      id: '2',
      title: 'Client Review Call',
      date: 'Yesterday',
      duration: '45 min',
      participants: 3,
    },
    { id: '3', title: 'Product Planning', date: '3 days ago', duration: '1h 15m', participants: 8 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meeting Recorder</Text>
        <TouchableOpacity>
          <Ionicons name="calendar-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Meeting Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter meeting title..."
            placeholderTextColor="#999"
            value={meetingTitle}
            onChangeText={setMeetingTitle}
          />
        </View>

        <View style={styles.participantsSection}>
          <Text style={styles.label}>Participants ({participants.length})</Text>
          <View style={styles.participantsList}>
            {participants.map((p, i) => (
              <View key={p} style={styles.participantChip}>
                <Text style={styles.participantText}>{p}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addParticipantButton}>
              <Ionicons name="add" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {isRecording ? 'Recording in progress...' : 'Tap to start recording'}
          </Text>
          {isRecording && (
            <View style={styles.recordingStats}>
              <Text style={styles.recordingTime}>00:05:23</Text>
              <View style={styles.speakerIndicator}>
                <View style={styles.speakerDot} />
                <Text style={styles.speakerText}>Speaker detected</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="text" size={20} color="#34C759" />
            <Text style={styles.featureLabel}>Transcription</Text>
            <Text style={styles.featureStatus}>ON</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={styles.featureLabel}>Speaker ID</Text>
            <Text style={styles.featureStatus}>ON</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#FF9500" />
            <Text style={styles.featureLabel}>Action Items</Text>
            <Text style={styles.featureStatus}>AUTO</Text>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Meetings</Text>
          {recentMeetings.map(meeting => (
            <TouchableOpacity key={meeting.id} style={styles.meetingCard}>
              <View style={styles.meetingIcon}>
                <Ionicons name="videocam" size={20} color="#007AFF" />
              </View>
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
                <Text style={styles.meetingMeta}>
                  {meeting.date} • {meeting.duration} • {meeting.participants} participants
                </Text>
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
  content: { flex: 1 },
  inputSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  participantsSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  participantsList: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  participantChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  participantText: { fontSize: 13, color: '#007AFF' },
  addParticipantButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingSection: { backgroundColor: '#FFF', padding: 32, alignItems: 'center', marginBottom: 8 },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: { backgroundColor: '#FF3B30' },
  recordHint: { fontSize: 14, color: '#666', marginTop: 16 },
  recordingStats: { alignItems: 'center', marginTop: 16 },
  recordingTime: { fontSize: 32, fontWeight: '300', color: '#1A1A1A' },
  speakerIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  speakerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', marginRight: 6 },
  speakerText: { fontSize: 13, color: '#666' },
  featuresRow: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  featureItem: { flex: 1, alignItems: 'center' },
  featureLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  featureStatus: { fontSize: 10, color: '#34C759', fontWeight: '600', marginTop: 2 },
  recentSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  meetingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  meetingInfo: { flex: 1 },
  meetingTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  meetingMeta: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default MeetingRecorderScreen;
