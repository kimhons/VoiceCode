import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '@/store';
import { updateSyncSettings, updatePrivacySettings } from '@/store/slices/settingsSlice';

interface SettingsScreenNavigation {
  navigate: (screen: string, params?: object) => void;
  goBack: () => void;
}

interface SettingsScreenProps {
  navigation?: SettingsScreenNavigation;
}

const CACHE_KEYS = ['cache_transcripts', 'cache_audio', 'cache_thumbnails'];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  const [highQuality, setHighQuality] = useState(false);
  const [audioFormat, setAudioFormat] = useState('m4a');
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [transcriptionComplete, setTranscriptionComplete] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [showFontOptions, setShowFontOptions] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);

  const selectAudioFormat = (format: string) => {
    setAudioFormat(format);
    setShowFormatOptions(false);
    AsyncStorage.setItem('audio_format', format);
  };

  const selectFontSize = (size: string) => {
    setFontSize(size);
    setShowFontOptions(false);
    AsyncStorage.setItem('font_size', size);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    navigation?.navigate('Login');
  };

  const clearCache = () => {
    setShowClearCacheConfirm(false);
    AsyncStorage.multiRemove(CACHE_KEYS);
  };

  return (
    <ScrollView testID="settings-screen" style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity testID="edit-profile" style={styles.settingItem} onPress={() => navigation?.navigate('EditProfile')}>
          <Text style={styles.settingText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="logout-button" style={styles.settingItem} onPress={() => { setShowLogoutConfirm(true); }}>
          <Text style={styles.settingText}>Log Out</Text>
        </TouchableOpacity>
        {showLogoutConfirm && (
          <TouchableOpacity testID="confirm-logout" style={styles.confirmButton} onPress={confirmLogout}>
            <Text style={styles.confirmText}>Yes, Log Out</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recording</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>High Quality Audio</Text>
          <Switch
            testID="high-quality-toggle"
            value={highQuality}
            onValueChange={(value) => {
              setHighQuality(value);
              AsyncStorage.setItem('recording_quality', value ? 'high' : 'standard');
            }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
        <TouchableOpacity testID="audio-format-picker" style={styles.settingItem} onPress={() => { setShowFormatOptions(true); }}>
          <Text style={styles.settingText}>Audio Format</Text>
          <Text style={styles.settingValue}>{audioFormat.toUpperCase()}</Text>
        </TouchableOpacity>
        {showFormatOptions && (
          <View style={styles.optionsGroup}>
            <TouchableOpacity style={styles.option} onPress={() => { selectAudioFormat('m4a'); }}>
              <Text style={styles.settingText}>M4A</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => { selectAudioFormat('wav'); }}>
              <Text style={styles.settingText}>WAV</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Push Notification</Text>
          <Switch
            testID="push-notifications-toggle"
            value={pushNotifications}
            onValueChange={(value) => {
              setPushNotifications(value);
              AsyncStorage.setItem('push_notifications', String(value));
            }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Transcription Complete</Text>
          <Switch
            testID="transcription-complete-toggle"
            value={transcriptionComplete}
            onValueChange={(value) => {
              setTranscriptionComplete(value);
              AsyncStorage.setItem('transcription_complete', String(value));
            }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Dark Mode</Text>
          <Switch
            testID="dark-mode-toggle"
            value={darkMode}
            onValueChange={(value) => {
              setDarkMode(value);
              AsyncStorage.setItem('theme', value ? 'dark' : 'light');
            }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
        <TouchableOpacity testID="font-size-picker" style={styles.settingItem} onPress={() => { setShowFontOptions(true); }}>
          <Text style={styles.settingText}>Font Size</Text>
          <Text style={styles.settingValue}>{fontSize}</Text>
        </TouchableOpacity>
        {showFontOptions && (
          <View style={styles.optionsGroup}>
            <TouchableOpacity style={styles.option} onPress={() => { selectFontSize('small'); }}>
              <Text style={styles.settingText}>Small</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => { selectFontSize('medium'); }}>
              <Text style={styles.settingText}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => { selectFontSize('large'); }}>
              <Text style={styles.settingText}>Large</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Used</Text>
        <Text style={styles.settingValue}>12.4 MB</Text>
        <TouchableOpacity testID="clear-cache" style={styles.settingItem} onPress={() => { setShowClearCacheConfirm(true); }}>
          <Text style={styles.settingText}>Clear Cache</Text>
        </TouchableOpacity>
        {showClearCacheConfirm && (
          <TouchableOpacity testID="confirm-clear-cache" style={styles.confirmButton} onPress={clearCache}>
            <Text style={styles.confirmText}>Yes, Clear</Text>
          </TouchableOpacity>
        )}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Auto-delete old files</Text>
          <Switch
            testID="auto-delete-toggle"
            value={autoDelete}
            onValueChange={(value) => {
              setAutoDelete(value);
              AsyncStorage.setItem('auto_delete', String(value));
            }}
            trackColor={{ false: '#ccc', true: '#667eea' }}
          />
        </View>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.settingValue}>Version 1.0.0</Text>
        <TouchableOpacity testID="privacy-policy" style={styles.settingItem} onPress={() => navigation?.navigate('WebView', { url: 'https://voicecode.app/privacy' })}>
          <Text style={styles.settingText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="terms-of-service" style={styles.settingItem} onPress={() => navigation?.navigate('WebView', { url: 'https://voicecode.app/terms' })}>
          <Text style={styles.settingText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#999', paddingHorizontal: 16, marginBottom: 8 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingText: { fontSize: 16, color: '#333' },
  settingValue: { fontSize: 14, color: '#667eea', paddingHorizontal: 16 },
  optionsGroup: { backgroundColor: '#f7f7f7' },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  confirmButton: { padding: 16, backgroundColor: '#667eea', alignItems: 'center' },
  confirmText: { fontSize: 16, color: '#ffffff', fontWeight: '600' },
});

export default SettingsScreen;
