import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DropboxIntegrationScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupTranscripts, setBackupTranscripts] = useState(true);
  const [backupRecordings, setBackupRecordings] = useState(true);
  const [backupExports, setBackupExports] = useState(false);

  const accountInfo = {
    email: 'john.smith@company.com',
    plan: 'Business',
    storage: { used: 145.2, total: 2000 },
  };

  const syncFolders = [
    {
      id: '1',
      name: 'VoiceCode Recordings',
      path: '/VoiceCode/Recordings',
      items: 156,
      synced: true,
    },
    {
      id: '2',
      name: 'VoiceCode Transcripts',
      path: '/VoiceCode/Transcripts',
      items: 142,
      synced: true,
    },
    { id: '3', name: 'Exports', path: '/VoiceCode/Exports', items: 34, synced: false },
  ];

  const recentBackups = [
    { name: 'Team Meeting Recording', date: 'Today, 2:30 PM', size: '128 MB', status: 'synced' },
    { name: 'Client Call Transcript', date: 'Today, 11:15 AM', size: '2.4 MB', status: 'synced' },
    { name: 'Weekly Standup', date: 'Yesterday', size: '45 MB', status: 'synced' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Dropbox</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.dropboxLogo}>
              <Ionicons name="cloud" size={28} color="#0061FF" />
            </View>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionTitle}>Dropbox {accountInfo.plan}</Text>
              <Text style={styles.connectionEmail}>{accountInfo.email}</Text>
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
          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageUsed,
                { width: `${(accountInfo.storage.used / accountInfo.storage.total) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.storageText}>
            {accountInfo.storage.used} GB of {accountInfo.storage.total / 1000} TB used
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Backup Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload" size={20} color="#0061FF" />
                <Text style={styles.settingLabel}>Auto-Backup</Text>
              </View>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text" size={20} color="#FF9500" />
                <Text style={styles.settingLabel}>Backup Transcripts</Text>
              </View>
              <Switch
                value={backupTranscripts}
                onValueChange={setBackupTranscripts}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mic" size={20} color="#AF52DE" />
                <Text style={styles.settingLabel}>Backup Recordings</Text>
              </View>
              <Switch
                value={backupRecordings}
                onValueChange={setBackupRecordings}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="download" size={20} color="#34C759" />
                <Text style={styles.settingLabel}>Backup Exports</Text>
              </View>
              <Switch
                value={backupExports}
                onValueChange={setBackupExports}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Folders</Text>
          {syncFolders.map(folder => (
            <TouchableOpacity key={folder.id} style={styles.folderCard}>
              <View style={styles.folderIcon}>
                <Ionicons name="folder" size={24} color="#0061FF" />
              </View>
              <View style={styles.folderInfo}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderPath}>{folder.path}</Text>
                <Text style={styles.folderItems}>{folder.items} items</Text>
              </View>
              <View style={styles.folderStatus}>
                {folder.synced ? (
                  <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color="#8E8E93" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addFolderButton}>
            <Ionicons name="add" size={20} color="#0061FF" />
            <Text style={styles.addFolderText}>Add Sync Folder</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Backups</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentBackups.map((backup, idx) => (
            <View key={idx} style={styles.backupCard}>
              <View style={styles.backupIcon}>
                <Ionicons name="document" size={20} color="#0061FF" />
              </View>
              <View style={styles.backupInfo}>
                <Text style={styles.backupName}>{backup.name}</Text>
                <Text style={styles.backupMeta}>
                  {backup.date} • {backup.size}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.disconnectButton}>
          <Ionicons name="unlink" size={20} color="#FF3B30" />
          <Text style={styles.disconnectText}>Disconnect Dropbox</Text>
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
  connectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dropboxLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0061FF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: { flex: 1 },
  connectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  connectionEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  storageBar: { height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, overflow: 'hidden' },
  storageUsed: { height: '100%', backgroundColor: '#0061FF', borderRadius: 4 },
  storageText: { fontSize: 12, color: '#8E8E93', marginTop: 8 },
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
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0061FF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderInfo: { flex: 1 },
  folderName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  folderPath: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  folderItems: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  folderStatus: { marginLeft: 8 },
  addFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0061FF',
    borderStyle: 'dashed',
  },
  addFolderText: { fontSize: 15, color: '#0061FF', marginLeft: 8 },
  backupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  backupIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0061FF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backupInfo: { flex: 1 },
  backupName: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  backupMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
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

export default DropboxIntegrationScreen;
