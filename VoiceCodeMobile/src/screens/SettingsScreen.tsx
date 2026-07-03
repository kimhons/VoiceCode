/**
 * VoiceFlow Pro - Settings Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, setLanguage, setAutoTranscribe, setDarkMode, setAudioQuality } from '../store';

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
];

const audioQualities = [
  { value: 'low', label: 'Low (32 kbps)', description: 'Smallest file size' },
  { value: 'medium', label: 'Medium (128 kbps)', description: 'Balanced' },
  { value: 'high', label: 'High (320 kbps)', description: 'Best quality' },
];

export default function SettingsScreen() {
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const currentLanguage = languages.find(l => l.code === settings.language)?.name || settings.language;
  const currentQuality = audioQualities.find(q => q.value === settings.audioQuality)?.label || settings.audioQuality;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recording</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingValue}>{currentLanguage}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="musical-notes-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Audio Quality</Text>
                <Text style={styles.settingValue}>{currentQuality}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto-Transcribe</Text>
                <Text style={styles.settingDescription}>Automatically transcribe recordings</Text>
              </View>
            </View>
            <Switch
              value={settings.autoTranscribe}
              onValueChange={(value) => { dispatch(setAutoTranscribe(value)); }}
              trackColor={{ false: '#e9ecef', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Use dark theme</Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => { dispatch(setDarkMode(value)); }}
              trackColor={{ false: '#e9ecef', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="folder-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Storage Used</Text>
                <Text style={styles.settingValue}>128 MB of 5 GB</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: '#FF3B30' }]}>Clear Cache</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingValue}>1.0.0 (Build 1)</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { width: 40 },
  title: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginTop: 24, marginBottom: 8, marginHorizontal: 16, textTransform: 'uppercase' },
  section: { backgroundColor: '#fff' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 16, color: '#333' },
  settingValue: { fontSize: 14, color: '#666', marginTop: 2 },
  settingDescription: { fontSize: 12, color: '#999', marginTop: 2 },
});

