import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

interface DebugScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const SAMPLE_LOGS = [
  '[12:04:01] INFO  app started',
  '[12:04:02] DEBUG audio session configured',
  '[12:04:05] WARN  network latency high',
];

const DebugScreen: React.FC<DebugScreenProps> = ({ navigation }) => {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [logs, setLogs] = useState<string[]>(SAMPLE_LOGS);
  const [cacheSize, setCacheSize] = useState('24 MB');
  const [status, setStatus] = useState<string | null>(null);

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );

  const Action = ({
    label,
    icon,
    onPress,
    testID,
    danger,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    testID: string;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.action} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={20} color={danger ? '#e5484d' : '#667eea'} style={styles.rowIcon} />
      <Text style={[styles.actionLabel, danger && styles.dangerLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} testID="debug-screen">
      <Text style={styles.title}>Debug</Text>

      <View style={styles.section}>
        <InfoRow label="Device" value={`${Platform.OS === 'ios' ? 'iPhone' : 'Android'} 15`} />
        <InfoRow label="OS" value={String(Platform.Version ?? '18.0')} />
        <InfoRow label="App Version" value={appVersion} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cache Size</Text>
          <Text style={styles.rowValue}>{cacheSize}</Text>
          <TouchableOpacity onPress={() => { setCacheSize('0 MB'); setStatus('Cache cleared'); }} testID="clear-cache">
            <Text style={styles.inlineAction}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section} testID="logs-section">
        <Text style={styles.sectionTitle}>Logs</Text>
        {logs.map((line, i) => (
          <Text key={i} style={styles.logLine}>
            {line}
          </Text>
        ))}
        {logs.length === 0 ? <Text style={styles.logLine}>No log entries.</Text> : null}
        <Action label="Export Logs" icon="download-outline" onPress={() => setStatus('Logs exported')} testID="export-logs" />
        <Action
          label="Clear Logs"
          icon="trash-outline"
          onPress={() => { setLogs([]); setStatus('Logs cleared'); }}
          testID="clear-logs"
        />
      </View>

      <View style={styles.section}>
        <Action
          label="Trigger Crash"
          icon="warning-outline"
          onPress={() => setStatus('Test crash triggered')}
          testID="test-crash"
          danger
        />
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  rowValue: { fontSize: 15, color: '#555' },
  inlineAction: { fontSize: 14, color: '#667eea', marginLeft: 12 },
  logLine: { fontFamily: 'Courier', fontSize: 12, color: '#444', paddingHorizontal: 16, paddingVertical: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowIcon: { marginRight: 12 },
  actionLabel: { fontSize: 16, color: '#1a1a2e' },
  dangerLabel: { color: '#e5484d' },
  status: { textAlign: 'center', color: '#667eea', paddingVertical: 16 },
});

export default DebugScreen;
