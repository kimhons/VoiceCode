import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PrivacySettingsScreen: React.FC = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReporting, setCrashReporting] = useState(true);
  const [personalization, setPersonalization] = useState(false);
  const [locationAccess, setLocationAccess] = useState(false);
  const [microphoneAccess, setMicrophoneAccess] = useState(true);
  const [contactsAccess, setContactsAccess] = useState(false);
  const [dataRetention, setDataRetention] = useState('90');

  const retentionOptions = [
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '180', label: '6 months' },
    { value: '365', label: '1 year' },
    { value: 'forever', label: 'Forever' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.privacyScore}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>85</Text>
            <Text style={styles.scoreLabel}>Privacy Score</Text>
          </View>
          <Text style={styles.scoreDescription}>
            Your privacy settings are configured for high protection
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="analytics" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Usage Analytics</Text>
                  <Text style={styles.settingDesc}>Help improve the app with anonymous data</Text>
                </View>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="bug" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Crash Reporting</Text>
                  <Text style={styles.settingDesc}>Send crash reports to improve stability</Text>
                </View>
              </View>
              <Switch
                value={crashReporting}
                onValueChange={setCrashReporting}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="person" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Personalization</Text>
                  <Text style={styles.settingDesc}>Use data to personalize your experience</Text>
                </View>
              </View>
              <Switch
                value={personalization}
                onValueChange={setPersonalization}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Permissions</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mic" size={20} color="#FF3B30" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Microphone</Text>
                  <Text style={styles.settingDesc}>Required for recording</Text>
                </View>
              </View>
              <Switch
                value={microphoneAccess}
                onValueChange={setMicrophoneAccess}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="location" size={20} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Location</Text>
                  <Text style={styles.settingDesc}>Tag recordings with location</Text>
                </View>
              </View>
              <Switch
                value={locationAccess}
                onValueChange={setLocationAccess}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="people" size={20} color="#5856D6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Contacts</Text>
                  <Text style={styles.settingDesc}>Identify speakers by contact name</Text>
                </View>
              </View>
              <Switch
                value={contactsAccess}
                onValueChange={setContactsAccess}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <View style={styles.retentionCard}>
            <Text style={styles.retentionLabel}>Keep my data for:</Text>
            <View style={styles.retentionOptions}>
              {retentionOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.retentionOption,
                    dataRetention === option.value && styles.retentionOptionActive,
                  ]}
                  onPress={() => setDataRetention(option.value)}
                >
                  <Text
                    style={[
                      styles.retentionText,
                      dataRetention === option.value && styles.retentionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <View style={styles.dataActionsCard}>
            <TouchableOpacity style={styles.dataAction}>
              <View style={styles.dataActionIcon}>
                <Ionicons name="download" size={20} color="#007AFF" />
              </View>
              <View style={styles.dataActionInfo}>
                <Text style={styles.dataActionLabel}>Download My Data</Text>
                <Text style={styles.dataActionDesc}>Get a copy of all your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dataAction}>
              <View style={[styles.dataActionIcon, { backgroundColor: '#FF3B3020' }]}>
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </View>
              <View style={styles.dataActionInfo}>
                <Text style={styles.dataActionLabel}>Delete All Data</Text>
                <Text style={styles.dataActionDesc}>Permanently delete your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="document-text" size={18} color="#007AFF" />
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="shield-checkmark" size={18} color="#007AFF" />
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
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
  privacyScore: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: { fontSize: 32, fontWeight: '700', color: '#34C759' },
  scoreLabel: { fontSize: 10, color: '#34C759', marginTop: -4 },
  scoreDescription: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  retentionCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  retentionLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E', marginBottom: 12 },
  retentionOptions: { flexDirection: 'row', flexWrap: 'wrap' },
  retentionOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  retentionOptionActive: { backgroundColor: '#007AFF' },
  retentionText: { fontSize: 14, color: '#8E8E93' },
  retentionTextActive: { color: '#FFF', fontWeight: '500' },
  dataActionsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  dataAction: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dataActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dataActionInfo: { flex: 1 },
  dataActionLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  dataActionDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  linkText: { fontSize: 15, color: '#007AFF', marginLeft: 10 },
  bottomPadding: { height: 40 },
});

export default PrivacySettingsScreen;
