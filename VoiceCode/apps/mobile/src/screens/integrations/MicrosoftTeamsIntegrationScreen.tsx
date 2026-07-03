import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TeamsChannel {
  id: string;
  name: string;
  teamName: string;
  isPrivate: boolean;
  isSelected: boolean;
}

const MicrosoftTeamsIntegrationScreen: React.FC = () => {
  const [isConnected] = useState(true);
  const [autoJoinMeetings, setAutoJoinMeetings] = useState(true);
  const [postTranscripts, setPostTranscripts] = useState(true);
  const [mentionParticipants, setMentionParticipants] = useState(false);
  const [syncStatus, setSyncStatus] = useState(true);

  const [channels, setChannels] = useState<TeamsChannel[]>([
    { id: '1', name: 'General', teamName: 'Product Team', isPrivate: false, isSelected: true },
    { id: '2', name: 'Development', teamName: 'Product Team', isPrivate: false, isSelected: true },
    { id: '3', name: 'Leadership', teamName: 'Company', isPrivate: true, isSelected: false },
    { id: '4', name: 'Client Projects', teamName: 'Sales', isPrivate: false, isSelected: true },
  ]);

  const recentMeetings = [
    { title: 'Sprint Planning', participants: 8, date: 'Today', status: 'transcribed' },
    { title: 'Design Review', participants: 5, date: 'Yesterday', status: 'transcribed' },
    { title: 'Client Kickoff', participants: 12, date: '2 days ago', status: 'processing' },
  ];

  const toggleChannel = (id: string) => {
    setChannels(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, isSelected: !ch.isSelected } : ch))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Microsoft Teams</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.teamsIcon}>
            <Ionicons name="people" size={28} color="#6264A7" />
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.orgName}>Acme Corporation</Text>
            <View style={styles.statusRow}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.disconnectButton}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Bot Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="enter" size={20} color="#6264A7" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Join Meetings</Text>
                  <Text style={styles.settingDescription}>Bot joins scheduled meetings</Text>
                </View>
              </View>
              <Switch
                value={autoJoinMeetings}
                onValueChange={setAutoJoinMeetings}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sync" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sync Presence Status</Text>
                  <Text style={styles.settingDescription}>Show recording status in Teams</Text>
                </View>
              </View>
              <Switch
                value={syncStatus}
                onValueChange={setSyncStatus}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posting Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text" size={20} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Post Transcripts</Text>
                  <Text style={styles.settingDescription}>Share to selected channels</Text>
                </View>
              </View>
              <Switch
                value={postTranscripts}
                onValueChange={setPostTranscripts}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="at" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Mention Participants</Text>
                  <Text style={styles.settingDescription}>@mention attendees in posts</Text>
                </View>
              </View>
              <Switch
                value={mentionParticipants}
                onValueChange={setMentionParticipants}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Channels</Text>
            <Text style={styles.selectedCount}>
              {channels.filter(c => c.isSelected).length} selected
            </Text>
          </View>
          <View style={styles.channelsCard}>
            {channels.map((channel, idx) => (
              <View key={channel.id}>
                <TouchableOpacity
                  style={styles.channelRow}
                  onPress={() => toggleChannel(channel.id)}
                >
                  <View style={styles.channelInfo}>
                    <Ionicons
                      name={channel.isPrivate ? 'lock-closed' : 'chatbubbles'}
                      size={18}
                      color="#6264A7"
                    />
                    <View style={styles.channelText}>
                      <Text style={styles.channelName}>{channel.name}</Text>
                      <Text style={styles.teamName}>{channel.teamName}</Text>
                    </View>
                  </View>
                  <View style={[styles.checkbox, channel.isSelected && styles.checkboxSelected]}>
                    {channel.isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
                {idx < channels.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Meetings</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentMeetings.map((meeting, idx) => (
            <TouchableOpacity key={idx} style={styles.meetingCard}>
              <View style={styles.meetingIcon}>
                <Ionicons name="videocam" size={20} color="#6264A7" />
              </View>
              <View style={styles.meetingInfo}>
                <Text style={styles.meetingTitle}>{meeting.title}</Text>
                <View style={styles.meetingMeta}>
                  <Ionicons name="people" size={12} color="#8E8E93" />
                  <Text style={styles.meetingMetaText}>{meeting.participants}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.meetingMetaText}>{meeting.date}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  meeting.status === 'transcribed'
                    ? styles.transcribedBadge
                    : styles.processingBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: meeting.status === 'transcribed' ? '#34C759' : '#FF9500' },
                  ]}
                >
                  {meeting.status === 'transcribed' ? 'Ready' : 'Processing'}
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
  teamsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6264A720',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: { flex: 1 },
  orgName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  connectedText: { fontSize: 13, color: '#34C759' },
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF3B3020',
  },
  disconnectText: { fontSize: 13, fontWeight: '500', color: '#FF3B30' },
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
  selectedCount: { fontSize: 13, color: '#007AFF' },
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
  channelsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  channelRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  channelInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  channelText: { marginLeft: 12 },
  channelName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  teamName: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#6264A7', borderColor: '#6264A7' },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  meetingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#6264A720',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  meetingInfo: { flex: 1 },
  meetingTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  meetingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meetingMetaText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  transcribedBadge: { backgroundColor: '#34C75920' },
  processingBadge: { backgroundColor: '#FF950020' },
  statusText: { fontSize: 12, fontWeight: '500' },
  bottomPadding: { height: 40 },
});

export default MicrosoftTeamsIntegrationScreen;
