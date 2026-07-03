import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DataEncryptionScreen: React.FC = () => {
  const [endToEndEnabled, setEndToEndEnabled] = useState(true);
  const [atRestEnabled, setAtRestEnabled] = useState(true);
  const [inTransitEnabled, setInTransitEnabled] = useState(true);
  const [localEncryption, setLocalEncryption] = useState(true);
  const [backupEncryption, setBackupEncryption] = useState(true);

  const encryptionStats = {
    filesEncrypted: 1456,
    totalSize: '4.8 GB',
    lastKeyRotation: '15 days ago',
    algorithm: 'AES-256-GCM',
  };

  const encryptionLevels = [
    {
      id: 'e2e',
      label: 'End-to-End',
      description: 'Data encrypted from device to device',
      icon: 'lock-closed',
      color: '#34C759',
      enabled: endToEndEnabled,
    },
    {
      id: 'rest',
      label: 'At Rest',
      description: 'Data encrypted when stored',
      icon: 'server',
      color: '#007AFF',
      enabled: atRestEnabled,
    },
    {
      id: 'transit',
      label: 'In Transit',
      description: 'Data encrypted during transfer',
      icon: 'swap-horizontal',
      color: '#FF9500',
      enabled: inTransitEnabled,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Data Encryption</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="shield-checkmark" size={32} color="#34C759" />
          </View>
          <Text style={styles.statusTitle}>Encryption Active</Text>
          <Text style={styles.statusSubtitle}>
            Your data is protected with {encryptionStats.algorithm}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{encryptionStats.filesEncrypted}</Text>
            <Text style={styles.statLabel}>Files Encrypted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{encryptionStats.totalSize}</Text>
            <Text style={styles.statLabel}>Protected Data</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Encryption Layers</Text>
          {encryptionLevels.map(level => (
            <View key={level.id} style={styles.levelCard}>
              <View style={[styles.levelIcon, { backgroundColor: level.color + '20' }]}>
                <Ionicons name={level.icon as any} size={22} color={level.color} />
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelLabel}>{level.label}</Text>
                <Text style={styles.levelDesc}>{level.description}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: level.enabled ? '#34C75920' : '#FF3B3020' },
                ]}
              >
                <Text
                  style={[styles.statusBadgeText, { color: level.enabled ? '#34C759' : '#FF3B30' }]}
                >
                  {level.enabled ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Security</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Local Encryption</Text>
                  <Text style={styles.settingDesc}>Encrypt data stored on device</Text>
                </View>
              </View>
              <Switch
                value={localEncryption}
                onValueChange={setLocalEncryption}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud" size={20} color="#5856D6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Backup Encryption</Text>
                  <Text style={styles.settingDesc}>Encrypt cloud backups</Text>
                </View>
              </View>
              <Switch
                value={backupEncryption}
                onValueChange={setBackupEncryption}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Management</Text>
          <View style={styles.keyCard}>
            <View style={styles.keyHeader}>
              <Ionicons name="key" size={20} color="#FF9500" />
              <Text style={styles.keyTitle}>Encryption Key</Text>
            </View>
            <View style={styles.keyInfo}>
              <View style={styles.keyRow}>
                <Text style={styles.keyLabel}>Algorithm</Text>
                <Text style={styles.keyValue}>{encryptionStats.algorithm}</Text>
              </View>
              <View style={styles.keyRow}>
                <Text style={styles.keyLabel}>Last Rotation</Text>
                <Text style={styles.keyValue}>{encryptionStats.lastKeyRotation}</Text>
              </View>
              <View style={styles.keyRow}>
                <Text style={styles.keyLabel}>Key Size</Text>
                <Text style={styles.keyValue}>256-bit</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.rotateButton}>
              <Ionicons name="refresh" size={18} color="#007AFF" />
              <Text style={styles.rotateText}>Rotate Encryption Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance</Text>
          <View style={styles.complianceCard}>
            {['HIPAA', 'GDPR', 'SOC 2', 'ISO 27001'].map((cert, idx) => (
              <View key={cert} style={styles.complianceBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.complianceText}>{cert}</Text>
              </View>
            ))}
          </View>
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
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  statusSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
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
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  levelIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  levelDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '500' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  keyCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  keyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  keyTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginLeft: 10 },
  keyInfo: { backgroundColor: '#F9F9FB', borderRadius: 10, padding: 12, marginBottom: 14 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  keyLabel: { fontSize: 14, color: '#8E8E93' },
  keyValue: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  rotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
  },
  rotateText: { fontSize: 14, fontWeight: '500', color: '#007AFF', marginLeft: 6 },
  complianceCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C75910',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  complianceText: { fontSize: 13, fontWeight: '600', color: '#34C759', marginLeft: 6 },
  bottomPadding: { height: 40 },
});

export default DataEncryptionScreen;
