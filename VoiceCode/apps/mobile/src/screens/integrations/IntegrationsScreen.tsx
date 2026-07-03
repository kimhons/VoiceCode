import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Integration {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  connected: boolean;
}

const INITIAL: Integration[] = [
  { id: 'google-drive', name: 'Google Drive', icon: 'logo-google', connected: true },
  { id: 'dropbox', name: 'Dropbox', icon: 'cloud-outline', connected: false },
  { id: 'notion', name: 'Notion', icon: 'document-outline', connected: false },
];

interface IntegrationsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const IntegrationsScreen: React.FC<IntegrationsScreenProps> = ({ navigation }) => {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL);
  const [message, setMessage] = useState<string | null>(null);
  const [settingsFor, setSettingsFor] = useState<Integration | null>(null);

  const setConnected = (id: string, connected: boolean) => {
    setIntegrations((prev) => prev.map((i) => (i.id === id ? { ...i, connected } : i)));
    const name = integrations.find((i) => i.id === id)?.name ?? '';
    setMessage(connected ? `Connected to ${name}` : `Disconnected from ${name}`);
  };

  return (
    <ScrollView style={styles.container} testID="integrations-screen">
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} testID="status-connected" />
          <Text style={styles.legendText}>{integrations.filter((i) => i.connected).length} active</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.statusDot, { backgroundColor: '#cbd5e1' }]} testID="status-disconnected" />
          <Text style={styles.legendText}>{integrations.filter((i) => !i.connected).length} available</Text>
        </View>
      </View>

      <View style={styles.list} testID="integrations-list">
        {integrations.map((integration) => (
          <View key={integration.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name={integration.icon} size={24} color="#667eea" style={styles.rowIcon} />
              <Text style={styles.name}>{integration.name}</Text>
              <View
                style={[styles.statusDot, { backgroundColor: integration.connected ? '#22c55e' : '#cbd5e1' }]}
                testID={`status-${integration.id}`}
              />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setConnected(integration.id, true)}
                testID={`connect-${integration.id}`}
              >
                <Text style={styles.actionText}>Connect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setConnected(integration.id, false)}
                testID={`disconnect-${integration.id}`}
              >
                <Text style={styles.actionText}>Disconnect</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setSettingsFor(integration)}
                testID={`settings-${integration.id}`}
              >
                <Ionicons name="settings-outline" size={18} color="#667eea" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <Modal
        visible={settingsFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsFor(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="integration-settings-modal">
            <Text style={styles.modalTitle}>{settingsFor?.name} Settings</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setSettingsFor(null)}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  message: { textAlign: 'center', color: '#667eea', paddingVertical: 12 },
  legend: { flexDirection: 'row', gap: 20, paddingHorizontal: 16, paddingTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 13, color: '#888' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 12 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#eef0ff', borderRadius: 8 },
  actionText: { fontSize: 14, color: '#667eea', fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  primaryButton: { backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
});

export default IntegrationsScreen;
