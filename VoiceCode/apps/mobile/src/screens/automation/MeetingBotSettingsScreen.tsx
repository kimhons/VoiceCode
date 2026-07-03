import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MeetingBotSettingsScreen: React.FC = () => {
  const [autoJoin, setAutoJoin] = useState(true);
  const [autoRecord, setAutoRecord] = useState(true);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [waitInLobby, setWaitInLobby] = useState(true);
  const [notifyHost, setNotifyHost] = useState(true);
  const [captureChat, setCaptureChat] = useState(false);
  const [captureScreenShare, setCaptureScreenShare] = useState(true);

  const botStatus = {
    name: 'VoiceCode Bot',
    status: 'active',
    meetingsJoined: 156,
    hoursRecorded: 234,
  };

  const supportedPlatforms = [
    { id: 'zoom', name: 'Zoom', icon: 'videocam', color: '#2D8CFF', connected: true },
    { id: 'teams', name: 'Microsoft Teams', icon: 'people', color: '#6264A7', connected: true },
    { id: 'meet', name: 'Google Meet', icon: 'logo-google', color: '#00897B', connected: false },
    { id: 'webex', name: 'Cisco Webex', icon: 'globe', color: '#00BCEB', connected: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Meeting Bot</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.botCard}>
          <View style={styles.botAvatar}>
            <Ionicons name="hardware-chip" size={32} color="#007AFF" />
          </View>
          <View style={styles.botInfo}>
            <Text style={styles.botName}>{botStatus.name}</Text>
            <View style={styles.botStatusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active & Ready</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.configureButton}>
            <Text style={styles.configureText}>Configure</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{botStatus.meetingsJoined}</Text>
            <Text style={styles.statLabel}>Meetings Joined</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{botStatus.hoursRecorded}h</Text>
            <Text style={styles.statLabel}>Hours Recorded</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Behavior</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="enter" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Join Meetings</Text>
                  <Text style={styles.settingDesc}>Join scheduled meetings automatically</Text>
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
                  <Text style={styles.settingDesc}>Start recording when meeting begins</Text>
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
                  <Text style={styles.settingDesc}>Generate transcript after recording</Text>
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
                <Ionicons name="time" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Wait in Lobby</Text>
                  <Text style={styles.settingDesc}>Wait if placed in meeting lobby</Text>
                </View>
              </View>
              <Switch
                value={waitInLobby}
                onValueChange={setWaitInLobby}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#5856D6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Notify Host</Text>
                  <Text style={styles.settingDesc}>Inform meeting host when bot joins</Text>
                </View>
              </View>
              <Switch
                value={notifyHost}
                onValueChange={setNotifyHost}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capture Options</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubbles" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Capture Chat</Text>
                  <Text style={styles.settingDesc}>Include chat messages in transcript</Text>
                </View>
              </View>
              <Switch
                value={captureChat}
                onValueChange={setCaptureChat}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="desktop" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Capture Screen Share</Text>
                  <Text style={styles.settingDesc}>Record screen sharing content</Text>
                </View>
              </View>
              <Switch
                value={captureScreenShare}
                onValueChange={setCaptureScreenShare}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Platforms</Text>
          {supportedPlatforms.map(platform => (
            <TouchableOpacity key={platform.id} style={styles.platformCard}>
              <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                <Ionicons name={platform.icon as any} size={22} color={platform.color} />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{platform.name}</Text>
                <Text
                  style={[
                    styles.platformStatus,
                    { color: platform.connected ? '#34C759' : '#8E8E93' },
                  ]}
                >
                  {platform.connected ? 'Connected' : 'Not connected'}
                </Text>
              </View>
              <Ionicons
                name={platform.connected ? 'checkmark-circle' : 'add-circle'}
                size={24}
                color={platform.connected ? '#34C759' : '#007AFF'}
              />
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
  botCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  botAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  botInfo: { flex: 1 },
  botName: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  botStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', marginRight: 6 },
  statusText: { fontSize: 13, color: '#34C759' },
  configureButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  configureText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  platformStatus: { fontSize: 12, marginTop: 2 },
  bottomPadding: { height: 40 },
});

export default MeetingBotSettingsScreen;
