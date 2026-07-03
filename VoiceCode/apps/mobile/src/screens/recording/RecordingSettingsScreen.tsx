import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const RecordingSettingsScreen: React.FC = () => {
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [speakerDiarization, setSpeakerDiarization] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(true);
  const [highQuality, setHighQuality] = useState(false);

  const audioQualityOptions = [
    { id: 'standard', label: 'Standard', description: '64 kbps • ~0.5 MB/min', recommended: false },
    { id: 'high', label: 'High', description: '128 kbps • ~1 MB/min', recommended: true },
    { id: 'ultra', label: 'Ultra', description: '256 kbps • ~2 MB/min', recommended: false },
  ];

  const [selectedQuality, setSelectedQuality] = useState('high');

  const languageOptions = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Recording Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Quality</Text>
          <View style={styles.qualityCard}>
            {audioQualityOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.qualityOption,
                  selectedQuality === option.id && styles.qualityOptionActive,
                ]}
                onPress={() => setSelectedQuality(option.id)}
              >
                <View style={styles.qualityRadio}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedQuality === option.id && styles.radioOuterActive,
                    ]}
                  >
                    {selectedQuality === option.id && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.qualityInfo}>
                  <View style={styles.qualityHeader}>
                    <Text
                      style={[
                        styles.qualityLabel,
                        selectedQuality === option.id && styles.qualityLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {option.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.qualityDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcription</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="text" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Transcribe</Text>
                  <Text style={styles.settingDescription}>Transcribe recordings automatically</Text>
                </View>
              </View>
              <Switch
                value={autoTranscribe}
                onValueChange={setAutoTranscribe}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="people" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Speaker Diarization</Text>
                  <Text style={styles.settingDescription}>Identify different speakers</Text>
                </View>
              </View>
              <Switch
                value={speakerDiarization}
                onValueChange={setSpeakerDiarization}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="language" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingDescription}>Primary transcription language</Text>
                </View>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>
                  {languageOptions.find(l => l.code === selectedLanguage)?.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio Processing</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-mute" size={20} color="#FF3B30" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Noise Reduction</Text>
                  <Text style={styles.settingDescription}>Filter background noise</Text>
                </View>
              </View>
              <Switch
                value={noiseReduction}
                onValueChange={setNoiseReduction}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="options" size={20} color="#34C759" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Audio Enhancement</Text>
                  <Text style={styles.settingDescription}>Advanced audio processing</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="save" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Save</Text>
                  <Text style={styles.settingDescription}>Save recordings automatically</Text>
                </View>
              </View>
              <Switch
                value={autoSave}
                onValueChange={setAutoSave}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload" size={20} color="#5856D6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Cloud Backup</Text>
                  <Text style={styles.settingDescription}>Backup to cloud storage</Text>
                </View>
              </View>
              <Switch
                value={cloudBackup}
                onValueChange={setCloudBackup}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="folder" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Storage Location</Text>
                  <Text style={styles.settingDescription}>Where recordings are saved</Text>
                </View>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.valueText}>Device</Text>
                <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.storageUsage}>
            <View style={styles.usageHeader}>
              <Text style={styles.usageTitle}>Storage Used</Text>
              <Text style={styles.usageValue}>2.4 GB of 10 GB</Text>
            </View>
            <View style={styles.usageBar}>
              <View style={[styles.usageFill, { width: '24%' }]} />
            </View>
            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageText}>Manage Storage</Text>
            </TouchableOpacity>
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
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  qualityCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  qualityOptionActive: { backgroundColor: '#007AFF08' },
  qualityRadio: { marginRight: 12 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: { borderColor: '#007AFF' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF' },
  qualityInfo: { flex: 1 },
  qualityHeader: { flexDirection: 'row', alignItems: 'center' },
  qualityLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  qualityLabelActive: { color: '#007AFF' },
  recommendedBadge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  recommendedText: { fontSize: 10, fontWeight: '600', color: '#34C759' },
  qualityDescription: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  settingValue: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 15, color: '#8E8E93', marginRight: 4 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  storageUsage: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  usageTitle: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  usageValue: { fontSize: 15, color: '#8E8E93' },
  usageBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4 },
  usageFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  manageButton: { marginTop: 14, alignItems: 'center' },
  manageText: { fontSize: 15, color: '#007AFF', fontWeight: '500' },
  bottomPadding: { height: 40 },
});

export default RecordingSettingsScreen;
