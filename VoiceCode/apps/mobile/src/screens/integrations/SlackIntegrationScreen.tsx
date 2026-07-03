import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  isSelected: boolean;
}

interface SlackWorkspace {
  id: string;
  name: string;
  icon: string;
  isConnected: boolean;
}

const SlackIntegrationScreen: React.FC = () => {
  const [autoShare, setAutoShare] = useState(true);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeActionItems, setIncludeActionItems] = useState(true);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);

  const workspace: SlackWorkspace = {
    id: '1',
    name: 'Acme Corporation',
    icon: 'A',
    isConnected: true,
  };

  const [channels, setChannels] = useState<SlackChannel[]>([
    { id: '1', name: 'general', isPrivate: false, memberCount: 125, isSelected: true },
    { id: '2', name: 'product-team', isPrivate: false, memberCount: 24, isSelected: true },
    { id: '3', name: 'engineering', isPrivate: false, memberCount: 45, isSelected: false },
    { id: '4', name: 'design', isPrivate: false, memberCount: 12, isSelected: false },
    { id: '5', name: 'leadership', isPrivate: true, memberCount: 8, isSelected: false },
    { id: '6', name: 'client-calls', isPrivate: true, memberCount: 15, isSelected: true },
  ]);

  const toggleChannel = (id: string) => {
    setChannels(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, isSelected: !ch.isSelected } : ch))
    );
  };

  const recentShares = [
    { channel: '#product-team', document: 'Q1 Planning Notes', time: '2 hours ago' },
    { channel: '#general', document: 'All Hands Meeting', time: 'Yesterday' },
    { channel: '#client-calls', document: 'Acme Corp Call', time: '3 days ago' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Slack Integration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.slackIcon}>
              <Text style={styles.slackIconText}>{workspace.icon}</Text>
            </View>
            <View style={styles.connectionInfo}>
              <Text style={styles.workspaceName}>{workspace.name}</Text>
              <View style={styles.connectionStatus}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.disconnectButton}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Share Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sync" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Share Recordings</Text>
                  <Text style={styles.settingDescription}>
                    Automatically share to selected channels
                  </Text>
                </View>
              </View>
              <Switch
                value={autoShare}
                onValueChange={setAutoShare}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content to Share</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text" size={20} color="#34C759" />
                <Text style={styles.settingLabel}>Full Transcript</Text>
              </View>
              <Switch
                value={includeTranscript}
                onValueChange={setIncludeTranscript}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sparkles" size={20} color="#AF52DE" />
                <Text style={styles.settingLabel}>AI Summary</Text>
              </View>
              <Switch
                value={includeSummary}
                onValueChange={setIncludeSummary}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="checkbox" size={20} color="#FF9500" />
                <Text style={styles.settingLabel}>Action Items</Text>
              </View>
              <Switch
                value={includeActionItems}
                onValueChange={setIncludeActionItems}
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
                      name={channel.isPrivate ? 'lock-closed' : 'pricetag'}
                      size={18}
                      color="#8E8E93"
                    />
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <Text style={styles.memberCount}>{channel.memberCount} members</Text>
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
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#FF3B30" />
                <Text style={styles.settingLabel}>Notify When Complete</Text>
              </View>
              <Switch
                value={notifyOnComplete}
                onValueChange={setNotifyOnComplete}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Shares</Text>
          {recentShares.map((share, idx) => (
            <View key={idx} style={styles.recentShareCard}>
              <View style={styles.shareInfo}>
                <Text style={styles.shareChannel}>{share.channel}</Text>
                <Text style={styles.shareDocument}>{share.document}</Text>
              </View>
              <Text style={styles.shareTime}>{share.time}</Text>
            </View>
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
  connectionCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 14, padding: 16 },
  connectionHeader: { flexDirection: 'row', alignItems: 'center' },
  slackIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4A154B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  slackIconText: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  connectionInfo: { flex: 1 },
  workspaceName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  connectionStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
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
    marginBottom: 12,
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
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12 },
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  channelsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  channelRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  channelInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  channelName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E', marginLeft: 10 },
  memberCount: { fontSize: 12, color: '#8E8E93', marginLeft: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  recentShareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  shareInfo: { flex: 1 },
  shareChannel: { fontSize: 14, fontWeight: '600', color: '#4A154B' },
  shareDocument: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  shareTime: { fontSize: 12, color: '#8E8E93' },
  bottomPadding: { height: 40 },
});

export default SlackIntegrationScreen;
