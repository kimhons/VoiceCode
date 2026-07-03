import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '@/store';
import { updateSyncSettings, updatePrivacySettings } from '@/store/slices/settingsSlice';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Enable Cloud Sync</Text>
          <Switch
            value={settings.sync.enabled}
            onValueChange={(value) => { dispatch(updateSyncSettings({ enabled: value })); }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>WiFi Only</Text>
          <Switch
            value={settings.sync.wifiOnly}
            onValueChange={(value) => { dispatch(updateSyncSettings({ wifiOnly: value })); }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Save Transcriptions</Text>
          <Switch
            value={settings.privacy.saveTranscriptions}
            onValueChange={(value) => { dispatch(updatePrivacySettings({ saveTranscriptions: value })); }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Share Analytics</Text>
          <Switch
            value={settings.privacy.shareAnalytics}
            onValueChange={(value) => { dispatch(updatePrivacySettings({ shareAnalytics: value })); }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#999', paddingHorizontal: 16, marginBottom: 8 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingText: { fontSize: 16, color: '#333' },
});

export default SettingsScreen;

