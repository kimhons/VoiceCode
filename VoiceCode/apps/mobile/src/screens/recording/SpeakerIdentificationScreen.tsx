import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Speaker {
  id: string;
  name: string;
  color: string;
  segmentCount: number;
  speakingTime: number;
  isVerified: boolean;
}

const SpeakerIdentificationScreen: React.FC = () => {
  const [autoIdentify, setAutoIdentify] = useState(true);
  const [voicePrint, setVoicePrint] = useState(true);
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [speakerName, setSpeakerName] = useState('');

  const [speakers, setSpeakers] = useState<Speaker[]>([
    {
      id: '1',
      name: 'Dr. Sarah Chen',
      color: '#007AFF',
      segmentCount: 45,
      speakingTime: 1240,
      isVerified: true,
    },
    {
      id: '2',
      name: 'Patient',
      color: '#34C759',
      segmentCount: 38,
      speakingTime: 890,
      isVerified: false,
    },
    {
      id: '3',
      name: 'Nurse Williams',
      color: '#FF9500',
      segmentCount: 12,
      speakingTime: 320,
      isVerified: true,
    },
    {
      id: '4',
      name: 'Unknown Speaker',
      color: '#8E8E93',
      segmentCount: 5,
      speakingTime: 85,
      isVerified: false,
    },
  ]);

  const colorOptions = [
    '#007AFF',
    '#34C759',
    '#FF9500',
    '#FF3B30',
    '#AF52DE',
    '#5856D6',
    '#00C7BE',
    '#FF2D55',
  ];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTotalTime = (): number => speakers.reduce((sum, s) => sum + s.speakingTime, 0);

  const startEditing = (speaker: Speaker) => {
    setEditingSpeaker(speaker.id);
    setSpeakerName(speaker.name);
  };

  const saveEdit = () => {
    if (editingSpeaker) {
      setSpeakers(prev =>
        prev.map(s => (s.id === editingSpeaker ? { ...s, name: speakerName } : s))
      );
      setEditingSpeaker(null);
      setSpeakerName('');
    }
  };

  const mergeSpeakers = (sourceId: string, targetId: string) => {
    setSpeakers(prev => {
      const source = prev.find(s => s.id === sourceId);
      const target = prev.find(s => s.id === targetId);
      if (!source || !target) return prev;

      return prev
        .filter(s => s.id !== sourceId)
        .map(s =>
          s.id === targetId
            ? {
                ...s,
                segmentCount: s.segmentCount + source.segmentCount,
                speakingTime: s.speakingTime + source.speakingTime,
              }
            : s
        );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Speaker Identification</Text>
        <TouchableOpacity style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.summaryValue}>{speakers.length}</Text>
              <Text style={styles.summaryLabel}>Speakers</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={24} color="#34C759" />
              <Text style={styles.summaryValue}>{formatTime(getTotalTime())}</Text>
              <Text style={styles.summaryLabel}>Total Speaking</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={24} color="#FF9500" />
              <Text style={styles.summaryValue}>{speakers.filter(s => s.isVerified).length}</Text>
              <Text style={styles.summaryLabel}>Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="mic" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>Auto-Identify Speakers</Text>
              </View>
              <Switch
                value={autoIdentify}
                onValueChange={setAutoIdentify}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print" size={20} color="#AF52DE" />
                <Text style={styles.settingLabel}>Voice Print Recognition</Text>
              </View>
              <Switch
                value={voicePrint}
                onValueChange={setVoicePrint}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Identified Speakers</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {speakers.map(speaker => (
            <View key={speaker.id} style={styles.speakerCard}>
              {editingSpeaker === speaker.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={speakerName}
                    onChangeText={setSpeakerName}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.saveEditButton} onPress={saveEdit}>
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={() => setEditingSpeaker(null)}
                  >
                    <Ionicons name="close" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.speakerHeader}>
                    <View style={[styles.speakerAvatar, { backgroundColor: speaker.color }]}>
                      <Text style={styles.avatarText}>{speaker.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.speakerInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.speakerName}>{speaker.name}</Text>
                        {speaker.isVerified && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#34C759"
                            style={styles.verifiedIcon}
                          />
                        )}
                      </View>
                      <View style={styles.speakerMeta}>
                        <Text style={styles.metaText}>{speaker.segmentCount} segments</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{formatTime(speaker.speakingTime)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => startEditing(speaker)}
                    >
                      <Ionicons name="create-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.speakerProgress}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(speaker.speakingTime / getTotalTime()) * 100}%`,
                          backgroundColor: speaker.color,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.colorPicker}>
                    <Text style={styles.colorLabel}>Color:</Text>
                    <View style={styles.colorOptions}>
                      {colorOptions.map(color => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            speaker.color === color && styles.colorOptionSelected,
                          ]}
                        />
                      ))}
                    </View>
                  </View>

                  <View style={styles.speakerActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="headset" size={16} color="#007AFF" />
                      <Text style={styles.actionText}>Listen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="git-merge" size={16} color="#FF9500" />
                      <Text style={styles.actionText}>Merge</Text>
                    </TouchableOpacity>
                    {!speaker.isVerified && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                        <Text style={styles.actionText}>Verify</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.trainVoiceButton}>
            <Ionicons name="mic-circle" size={24} color="#FFF" />
            <View style={styles.trainTextContainer}>
              <Text style={styles.trainTitle}>Train Voice Recognition</Text>
              <Text style={styles.trainDescription}>
                Improve accuracy by recording voice samples
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
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
  doneButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  doneButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  content: { flex: 1 },
  summaryCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 14, padding: 16 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#E5E5EA' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginTop: 8 },
  summaryLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center' },
  addButtonText: { fontSize: 15, color: '#007AFF', marginLeft: 4 },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center' },
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  speakerCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  editContainer: { flexDirection: 'row', alignItems: 'center' },
  editInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1C1C1E',
  },
  saveEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelEditButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  speakerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  speakerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  speakerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  speakerName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  verifiedIcon: { marginLeft: 6 },
  speakerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 13, color: '#8E8E93' },
  metaDot: { fontSize: 13, color: '#8E8E93', marginHorizontal: 6 },
  editButton: { padding: 8 },
  speakerProgress: { height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 3 },
  colorPicker: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  colorLabel: { fontSize: 13, color: '#8E8E93', marginRight: 10 },
  colorOptions: { flexDirection: 'row' },
  colorOption: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  colorOptionSelected: { borderWidth: 2, borderColor: '#1C1C1E' },
  speakerActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  actionText: { fontSize: 13, color: '#007AFF', marginLeft: 4 },
  trainVoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    borderRadius: 14,
    padding: 16,
  },
  trainTextContainer: { flex: 1, marginLeft: 12 },
  trainTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  trainDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  bottomPadding: { height: 40 },
});

export default SpeakerIdentificationScreen;
