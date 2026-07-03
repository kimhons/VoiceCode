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

interface ReferralField {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  voiceEnabled?: boolean;
}

const ReferralLetterScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeLabResults, setIncludeLabResults] = useState(false);
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'emergent'>('routine');

  const [fields, setFields] = useState<ReferralField[]>([
    {
      id: 'referTo',
      label: 'Refer To',
      value: '',
      placeholder: 'Specialist name or specialty',
      voiceEnabled: true,
    },
    { id: 'facility', label: 'Facility', value: '', placeholder: 'Hospital or clinic name' },
    {
      id: 'reason',
      label: 'Reason for Referral',
      value: '',
      placeholder: 'Primary reason for this referral...',
      multiline: true,
      voiceEnabled: true,
    },
    {
      id: 'clinicalSummary',
      label: 'Clinical Summary',
      value: '',
      placeholder: 'Relevant clinical findings...',
      multiline: true,
      voiceEnabled: true,
    },
    {
      id: 'diagnosis',
      label: 'Working Diagnosis',
      value: '',
      placeholder: 'Current diagnosis or suspected condition',
      voiceEnabled: true,
    },
    {
      id: 'questionsFor',
      label: 'Questions for Specialist',
      value: '',
      placeholder: 'Specific questions you would like addressed...',
      multiline: true,
      voiceEnabled: true,
    },
  ]);

  const updateField = (id: string, value: string) => {
    setFields(prev => prev.map(f => (f.id === id ? { ...f, value } : f)));
  };

  const specialties = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Gastroenterology',
    'Pulmonology',
    'Endocrinology',
    'Rheumatology',
    'Oncology',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Referral Letter</Text>
        <TouchableOpacity style={styles.previewButton}>
          <Ionicons name="eye-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.urgencySection}>
          <Text style={styles.sectionLabel}>Urgency Level</Text>
          <View style={styles.urgencyOptions}>
            {(['routine', 'urgent', 'emergent'] as const).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgencyOption,
                  urgency === level && styles.urgencyOptionActive,
                  urgency === level && level === 'urgent' && styles.urgencyOptionUrgent,
                  urgency === level && level === 'emergent' && styles.urgencyOptionEmergent,
                ]}
                onPress={() => setUrgency(level)}
              >
                <Ionicons
                  name={
                    level === 'routine'
                      ? 'time-outline'
                      : level === 'urgent'
                        ? 'alert-circle'
                        : 'warning'
                  }
                  size={18}
                  color={urgency === level ? '#FFF' : '#666'}
                />
                <Text style={[styles.urgencyText, urgency === level && styles.urgencyTextActive]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.quickSpecialties}>
          <Text style={styles.sectionLabel}>Quick Select Specialty</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesScroll}
          >
            {specialties.map(specialty => (
              <TouchableOpacity
                key={specialty}
                style={styles.specialtyChip}
                onPress={() => updateField('referTo', specialty)}
              >
                <Text style={styles.specialtyChipText}>{specialty}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formSection}>
          {fields.map(field => (
            <View key={field.id} style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {field.voiceEnabled && (
                  <TouchableOpacity
                    style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                    onPress={() => setIsRecording(!isRecording)}
                  >
                    <Ionicons name="mic" size={18} color={isRecording ? '#FFF' : '#34C759'} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.fieldInput, field.multiline && styles.fieldInputMultiline]}
                value={field.value}
                onChangeText={text => updateField(field.id, text)}
                placeholder={field.placeholder}
                placeholderTextColor="#999"
                multiline={field.multiline}
                textAlignVertical={field.multiline ? 'top' : 'center'}
              />
            </View>
          ))}
        </View>

        <View style={styles.attachmentsSection}>
          <Text style={styles.sectionLabel}>Include Attachments</Text>
          <View style={styles.attachmentOptions}>
            <View style={styles.attachmentRow}>
              <View style={styles.attachmentInfo}>
                <Ionicons name="document-text" size={20} color="#007AFF" />
                <Text style={styles.attachmentLabel}>Medical History</Text>
              </View>
              <Switch
                value={includeHistory}
                onValueChange={setIncludeHistory}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.attachmentRow}>
              <View style={styles.attachmentInfo}>
                <Ionicons name="medical" size={20} color="#FF9500" />
                <Text style={styles.attachmentLabel}>Current Medications</Text>
              </View>
              <Switch
                value={includeMedications}
                onValueChange={setIncludeMedications}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.attachmentRow}>
              <View style={styles.attachmentInfo}>
                <Ionicons name="flask" size={20} color="#34C759" />
                <Text style={styles.attachmentLabel}>Recent Lab Results</Text>
              </View>
              <Switch
                value={includeLabResults}
                onValueChange={setIncludeLabResults}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.aiSection}>
          <TouchableOpacity style={styles.aiGenerateButton}>
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.aiGenerateText}>Generate with AI</Text>
          </TouchableOpacity>
          <Text style={styles.aiHint}>AI will draft the referral based on patient encounter</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveDraftButton}>
          <Ionicons name="save-outline" size={20} color="#007AFF" />
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#FFF" />
          <Text style={styles.sendText}>Send Referral</Text>
        </TouchableOpacity>
      </View>
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
  previewButton: { padding: 4 },
  content: { flex: 1 },
  urgencySection: { padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 10 },
  urgencyOptions: { flexDirection: 'row' },
  urgencyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  urgencyOptionActive: { backgroundColor: '#34C759' },
  urgencyOptionUrgent: { backgroundColor: '#FF9500' },
  urgencyOptionEmergent: { backgroundColor: '#FF3B30' },
  urgencyText: { fontSize: 14, fontWeight: '500', color: '#666', marginLeft: 6 },
  urgencyTextActive: { color: '#FFF' },
  quickSpecialties: { padding: 16, backgroundColor: '#FFF', marginBottom: 8 },
  specialtiesScroll: { paddingRight: 16 },
  specialtyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 8,
  },
  specialtyChipText: { fontSize: 13, color: '#666' },
  formSection: { backgroundColor: '#FFF', padding: 16 },
  fieldContainer: { marginBottom: 20 },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: { backgroundColor: '#34C759' },
  fieldInput: {
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  fieldInputMultiline: { minHeight: 100, paddingTop: 12 },
  attachmentsSection: { padding: 16, backgroundColor: '#FFF', marginTop: 8 },
  attachmentOptions: {},
  attachmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  attachmentInfo: { flexDirection: 'row', alignItems: 'center' },
  attachmentLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  aiSection: { padding: 16 },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AF52DE',
    paddingVertical: 14,
    borderRadius: 12,
  },
  aiGenerateText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  aiHint: { fontSize: 12, color: '#8E8E93', textAlign: 'center', marginTop: 8 },
  bottomPadding: { height: 100 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveDraftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginRight: 8,
  },
  saveDraftText: { fontSize: 15, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  sendText: { fontSize: 15, fontWeight: '600', color: '#FFF', marginLeft: 6 },
});

export default ReferralLetterScreen;
