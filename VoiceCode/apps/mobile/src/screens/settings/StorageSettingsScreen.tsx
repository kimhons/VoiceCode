import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StorageSettingsScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const OFFLINE_LIMITS = ['500 MB', '1 GB', '5 GB'];
const AUTO_DELETE = ['7 days', '30 days', '90 days', 'Never'];

const StorageSettingsScreen: React.FC<StorageSettingsScreenProps> = () => {
  const [offlineLimit, setOfflineLimit] = useState('1 GB');
  const [autoDownload, setAutoDownload] = useState(false);
  const [autoDelete, setAutoDelete] = useState('Never');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [confirmingAudio, setConfirmingAudio] = useState(false);

  const breakdown = [
    { label: 'Audio', size: '2.4 GB', color: '#667eea', icon: 'musical-notes-outline' as const },
    { label: 'Transcripts', size: '156 MB', color: '#34C759', icon: 'document-text-outline' as const },
    { label: 'Cache', size: '89 MB', color: '#FF9500', icon: 'refresh-outline' as const },
  ];

  return (
    <ScrollView style={styles.container} testID="storage-settings-screen">
      <View style={styles.usageCard} testID="storage-usage">
        <Text style={styles.usageTitle}>Storage Used</Text>
        <Text style={styles.usageValue}>2.6 GB of 5 GB</Text>
        <View style={styles.usageBar}>
          <View style={[styles.usageFill, { width: '52%' }]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        {breakdown.map((item) => (
          <View key={item.label} style={styles.row}>
            <Ionicons name={item.icon} size={20} color={item.color} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.size}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.actionRow} testID="clear-cache" onPress={() => setCacheCleared(true)}>
          <Ionicons name="trash-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Free Up Space</Text>
        </TouchableOpacity>
        {cacheCleared ? <Text style={styles.successMsg}>Cache cleared</Text> : null}

        <TouchableOpacity style={styles.actionRow} testID="clear-audio" onPress={() => setConfirmingAudio(true)}>
          <Ionicons name="trash-bin-outline" size={20} color="#FF3B30" style={styles.rowIcon} />
          <Text style={[styles.rowLabel, styles.dangerLabel]}>Delete All Recordings</Text>
        </TouchableOpacity>
        {confirmingAudio ? (
          <Text style={styles.warningMsg}>Are you sure you want to remove all recordings?</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Storage</Text>
        <View style={styles.chipRow} testID="offline-limit-selector">
          {OFFLINE_LIMITS.map((limit) => (
            <TouchableOpacity
              key={limit}
              style={[styles.chip, offlineLimit === limit && styles.chipActive]}
              onPress={() => setOfflineLimit(limit)}
            >
              <Text style={[styles.chipText, offlineLimit === limit && styles.chipTextActive]}>
                {limit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.rowLabel}>Auto-Download</Text>
          <Switch
            testID="auto-download-toggle"
            value={autoDownload}
            onValueChange={setAutoDownload}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Delete</Text>
        <View style={styles.chipRow} testID="auto-delete-selector">
          {AUTO_DELETE.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.chip, autoDelete === option && styles.chipActive]}
              onPress={() => setAutoDelete(option)}
            >
              <Text style={[styles.chipText, autoDelete === option && styles.chipTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  usageCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  usageTitle: { fontSize: 14, color: '#8E8E93' },
  usageValue: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginTop: 4 },
  usageBar: { height: 8, backgroundColor: '#e5e5ea', borderRadius: 4, marginTop: 12 },
  usageFill: { height: '100%', backgroundColor: '#667eea', borderRadius: 4 },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  rowValue: { fontSize: 15, color: '#8E8E93' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerLabel: { color: '#FF3B30' },
  successMsg: { color: '#34C759', fontSize: 14, paddingBottom: 8 },
  warningMsg: { color: '#FF9500', fontSize: 14, paddingBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: '#667eea' },
  chipText: { fontSize: 14, color: '#1a1a2e' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});

export default StorageSettingsScreen;
