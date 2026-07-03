import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SalesforceIntegrationScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [autoLog, setAutoLog] = useState(true);
  const [linkContacts, setLinkContacts] = useState(true);
  const [attachTranscripts, setAttachTranscripts] = useState(true);
  const [syncNotes, setSyncNotes] = useState(false);

  const accountInfo = {
    org: 'Company Corp',
    user: 'john.smith@company.com',
    edition: 'Enterprise',
  };

  const mappedObjects = [
    { id: '1', name: 'Contacts', icon: 'person', mapped: 156, color: '#007AFF' },
    { id: '2', name: 'Accounts', icon: 'business', mapped: 45, color: '#34C759' },
    { id: '3', name: 'Opportunities', icon: 'cash', mapped: 28, color: '#FF9500' },
    { id: '4', name: 'Leads', icon: 'people', mapped: 67, color: '#AF52DE' },
  ];

  const recentActivity = [
    { action: 'Call logged', record: 'Sarah Wilson (Acme Corp)', date: 'Today, 3:45 PM' },
    { action: 'Transcript attached', record: 'Q4 Review - TechStart Inc', date: 'Today, 2:15 PM' },
    { action: 'Contact matched', record: 'Mike Johnson', date: 'Today, 11:30 AM' },
    { action: 'Call logged', record: 'Demo Call - NewClient Ltd', date: 'Yesterday' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Salesforce</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.sfLogo}>
              <Ionicons name="cloud-done" size={28} color="#00A1E0" />
            </View>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionTitle}>{accountInfo.org}</Text>
              <Text style={styles.connectionEmail}>{accountInfo.user}</Text>
              <Text style={styles.connectionEdition}>{accountInfo.edition} Edition</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isConnected ? '#34C75920' : '#FF3B3020' },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }]}
              />
              <Text style={[styles.statusText, { color: isConnected ? '#34C759' : '#FF3B30' }]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Logging</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="call" size={20} color="#00A1E0" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Log Calls</Text>
                  <Text style={styles.settingDesc}>Automatically log calls as activities</Text>
                </View>
              </View>
              <Switch
                value={autoLog}
                onValueChange={setAutoLog}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="person-add" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Link Contacts</Text>
                  <Text style={styles.settingDesc}>Match participants to SF contacts</Text>
                </View>
              </View>
              <Switch
                value={linkContacts}
                onValueChange={setLinkContacts}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="attach" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Attach Transcripts</Text>
                  <Text style={styles.settingDesc}>Add transcripts to activity records</Text>
                </View>
              </View>
              <Switch
                value={attachTranscripts}
                onValueChange={setAttachTranscripts}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="create" size={20} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sync Notes</Text>
                  <Text style={styles.settingDesc}>Sync AI summaries as notes</Text>
                </View>
              </View>
              <Switch
                value={syncNotes}
                onValueChange={setSyncNotes}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mapped Objects</Text>
          <View style={styles.objectsGrid}>
            {mappedObjects.map(obj => (
              <TouchableOpacity key={obj.id} style={styles.objectCard}>
                <View style={[styles.objectIcon, { backgroundColor: obj.color + '20' }]}>
                  <Ionicons name={obj.icon as any} size={24} color={obj.color} />
                </View>
                <Text style={styles.objectName}>{obj.name}</Text>
                <Text style={styles.objectCount}>{obj.mapped} mapped</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentActivity.map((activity, idx) => (
            <View key={idx} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityAction}>{activity.action}</Text>
                <Text style={styles.activityRecord}>{activity.record}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="sync" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Force Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Field Mapping</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.disconnectButton}>
          <Ionicons name="unlink" size={20} color="#FF3B30" />
          <Text style={styles.disconnectText}>Disconnect Salesforce</Text>
        </TouchableOpacity>

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
  connectionCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 20 },
  connectionHeader: { flexDirection: 'row', alignItems: 'center' },
  sfLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#00A1E015',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: { flex: 1 },
  connectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  connectionEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  connectionEdition: { fontSize: 12, color: '#00A1E0', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
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
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  objectsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  objectCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  objectIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  objectName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  objectCount: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  activityRecord: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  activityDate: { fontSize: 11, color: '#C7C7CC', marginTop: 4 },
  actionsSection: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  actionText: { fontSize: 14, fontWeight: '500', color: '#007AFF', marginLeft: 8 },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FF3B3015',
  },
  disconnectText: { fontSize: 15, fontWeight: '500', color: '#FF3B30', marginLeft: 8 },
  bottomPadding: { height: 40 },
});

export default SalesforceIntegrationScreen;
