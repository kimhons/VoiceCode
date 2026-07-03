import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const HubSpotIntegrationScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [autoLogCalls, setAutoLogCalls] = useState(true);
  const [syncContacts, setSyncContacts] = useState(true);
  const [createDeals, setCreateDeals] = useState(false);
  const [attachRecordings, setAttachRecordings] = useState(true);

  const accountInfo = {
    portal: 'Company Corp',
    portalId: '12345678',
    user: 'john.smith@company.com',
  };

  const syncStats = [
    { label: 'Contacts Synced', value: 234, icon: 'people', color: '#FF7A59' },
    { label: 'Calls Logged', value: 89, icon: 'call', color: '#34C759' },
    { label: 'Deals Created', value: 12, icon: 'cash', color: '#FF9500' },
    { label: 'Notes Added', value: 156, icon: 'document-text', color: '#007AFF' },
  ];

  const recentActivity = [
    { type: 'call', description: 'Call logged with Sarah Wilson', time: '2 hours ago' },
    { type: 'contact', description: 'Contact synced: Mike Johnson', time: '3 hours ago' },
    { type: 'note', description: 'Meeting notes added to Deal #1234', time: '5 hours ago' },
    { type: 'call', description: 'Call logged with Acme Corp', time: 'Yesterday' },
  ];

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'call':
        return 'call';
      case 'contact':
        return 'person';
      case 'note':
        return 'document-text';
      default:
        return 'ellipse';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>HubSpot</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.hubspotLogo}>
              <Ionicons name="apps" size={28} color="#FF7A59" />
            </View>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionTitle}>{accountInfo.portal}</Text>
              <Text style={styles.connectionMeta}>Portal ID: {accountInfo.portalId}</Text>
              <Text style={styles.connectionEmail}>{accountInfo.user}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={[styles.statusText, { color: '#34C759' }]}>Connected</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {syncStats.map((stat, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="call" size={20} color="#FF7A59" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Log Calls</Text>
                  <Text style={styles.settingDesc}>Log calls as engagements</Text>
                </View>
              </View>
              <Switch
                value={autoLogCalls}
                onValueChange={setAutoLogCalls}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="people" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sync Contacts</Text>
                  <Text style={styles.settingDesc}>Match participants to contacts</Text>
                </View>
              </View>
              <Switch
                value={syncContacts}
                onValueChange={setSyncContacts}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cash" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Create Deals</Text>
                  <Text style={styles.settingDesc}>Auto-create deals from calls</Text>
                </View>
              </View>
              <Switch
                value={createDeals}
                onValueChange={setCreateDeals}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="attach" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Attach Recordings</Text>
                  <Text style={styles.settingDesc}>Link recordings to contacts</Text>
                </View>
              </View>
              <Switch
                value={attachRecordings}
                onValueChange={setAttachRecordings}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
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
              <View style={[styles.activityIcon, { backgroundColor: '#FF7A5920' }]}>
                <Ionicons name={getActivityIcon(activity.type) as any} size={18} color="#FF7A59" />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityDesc}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.disconnectButton}>
          <Ionicons name="unlink" size={20} color="#FF3B30" />
          <Text style={styles.disconnectText}>Disconnect HubSpot</Text>
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
  hubspotLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF7A5915',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: { flex: 1 },
  connectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  connectionMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  connectionEmail: { fontSize: 12, color: '#FF7A59', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  statCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: { flex: 1 },
  activityDesc: { fontSize: 14, color: '#1C1C1E' },
  activityTime: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
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

export default HubSpotIntegrationScreen;
