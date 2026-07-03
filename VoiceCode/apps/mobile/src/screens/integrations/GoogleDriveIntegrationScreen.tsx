import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface DriveFolder {
  id: string;
  name: string;
  path: string;
  itemCount: number;
  isDefault: boolean;
}

const GoogleDriveIntegrationScreen: React.FC = () => {
  const [isConnected] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupTranscripts, setBackupTranscripts] = useState(true);
  const [backupRecordings, setBackupRecordings] = useState(false);
  const [backupSummaries, setBackupSummaries] = useState(true);
  const [syncOnWifiOnly, setSyncOnWifiOnly] = useState(true);

  const folders: DriveFolder[] = [
    {
      id: '1',
      name: 'VoiceCode Backups',
      path: '/My Drive/VoiceCode Backups',
      itemCount: 156,
      isDefault: true,
    },
    {
      id: '2',
      name: 'Meeting Transcripts',
      path: '/My Drive/Meeting Transcripts',
      itemCount: 89,
      isDefault: false,
    },
    {
      id: '3',
      name: 'Client Recordings',
      path: '/My Drive/Work/Client Recordings',
      itemCount: 34,
      isDefault: false,
    },
  ];

  const recentBackups = [
    { name: 'Q1 Planning Notes.docx', date: '2 hours ago', size: '245 KB' },
    { name: 'Team Standup Transcript.pdf', date: 'Yesterday', size: '128 KB' },
    { name: 'Client Call Recording.mp3', date: '3 days ago', size: '45.2 MB' },
  ];

  const storageUsed = 2.4;
  const storageTotal = 15;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Google Drive</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionIcon}>
            <Ionicons name="logo-google" size={28} color="#4285F4" />
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionEmail}>user@gmail.com</Text>
            <View style={styles.statusRow}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.disconnectButton}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Ionicons name="cloud" size={20} color="#4285F4" />
            <Text style={styles.storageTitle}>Storage</Text>
          </View>
          <View style={styles.storageBar}>
            <View
              style={[styles.storageFill, { width: `${(storageUsed / storageTotal) * 100}%` }]}
            />
          </View>
          <Text style={styles.storageText}>
            {storageUsed} GB of {storageTotal} GB used
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload" size={20} color="#4285F4" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Backup</Text>
                  <Text style={styles.settingDescription}>Automatically backup new content</Text>
                </View>
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
                <Ionicons name="wifi" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Wi-Fi Only</Text>
                  <Text style={styles.settingDescription}>Only sync when connected to Wi-Fi</Text>
                </View>
              </View>
              <Switch
                value={syncOnWifiOnly}
                onValueChange={setSyncOnWifiOnly}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content to Backup</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text" size={20} color="#34C759" />
                <Text style={styles.settingLabel}>Transcripts</Text>
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
                <Ionicons name="mic" size={20} color="#FF3B30" />
                <Text style={styles.settingLabel}>Audio Recordings</Text>
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
                <Ionicons name="sparkles" size={20} color="#AF52DE" />
                <Text style={styles.settingLabel}>AI Summaries</Text>
              </View>
              <Switch
                value={backupSummaries}
                onValueChange={setBackupSummaries}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Backup Folders</Text>
            <TouchableOpacity>
              <Ionicons name="add" size={22} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {folders.map(folder => (
            <TouchableOpacity key={folder.id} style={styles.folderCard}>
              <View style={styles.folderIcon}>
                <Ionicons name="folder" size={24} color="#4285F4" />
              </View>
              <View style={styles.folderInfo}>
                <View style={styles.folderNameRow}>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  {folder.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.folderPath}>{folder.path}</Text>
                <Text style={styles.folderCount}>{folder.itemCount} items</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          ))}
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
                <Ionicons
                  name={backup.name.endsWith('.mp3') ? 'musical-note' : 'document'}
                  size={18}
                  color="#4285F4"
                />
              </View>
              <View style={styles.backupInfo}>
                <Text style={styles.backupName}>{backup.name}</Text>
                <View style={styles.backupMeta}>
                  <Text style={styles.backupDate}>{backup.date}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.backupSize}>{backup.size}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.backupAction}>
                <Ionicons name="open-outline" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.syncButton}>
          <Ionicons name="sync" size={20} color="#FFF" />
          <Text style={styles.syncText}>Sync Now</Text>
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
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  connectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4285F420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: { flex: 1 },
  connectionEmail: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
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
  storageCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
  },
  storageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  storageTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginLeft: 8 },
  storageBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, marginBottom: 8 },
  storageFill: { height: '100%', backgroundColor: '#4285F4', borderRadius: 4 },
  storageText: { fontSize: 13, color: '#8E8E93' },
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
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4285F420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  folderInfo: { flex: 1 },
  folderNameRow: { flexDirection: 'row', alignItems: 'center' },
  folderName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  defaultBadge: {
    backgroundColor: '#4285F420',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  defaultText: { fontSize: 10, fontWeight: '600', color: '#4285F4' },
  folderPath: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  folderCount: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  backupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  backupIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4285F420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backupInfo: { flex: 1 },
  backupName: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  backupMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  backupDate: { fontSize: 12, color: '#8E8E93' },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  backupSize: { fontSize: 12, color: '#8E8E93' },
  backupAction: { padding: 8 },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
  },
  syncText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  bottomPadding: { height: 40 },
});

export default GoogleDriveIntegrationScreen;
