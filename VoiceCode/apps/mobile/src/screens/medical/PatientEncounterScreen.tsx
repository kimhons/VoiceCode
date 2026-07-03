import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PatientEncounterScreen: React.FC = () => {
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('vitals');

  const sections = [
    { id: 'vitals', label: 'Vitals', icon: 'heart' },
    { id: 'history', label: 'History', icon: 'time' },
    { id: 'exam', label: 'Physical Exam', icon: 'body' },
    { id: 'assessment', label: 'Assessment', icon: 'clipboard' },
    { id: 'plan', label: 'Plan', icon: 'list' },
  ];

  const vitals = [
    { label: 'Blood Pressure', value: '120/80', unit: 'mmHg' },
    { label: 'Heart Rate', value: '72', unit: 'bpm' },
    { label: 'Temperature', value: '98.6', unit: '°F' },
    { label: 'Respiratory Rate', value: '16', unit: '/min' },
    { label: 'SpO2', value: '98', unit: '%' },
    { label: 'Weight', value: '165', unit: 'lbs' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Patient Encounter</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.patientBanner}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientInitials}>JS</Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>John Smith</Text>
          <Text style={styles.patientDetails}>DOB: 03/15/1965 • Male • MRN: 12345</Text>
        </View>
        <View style={styles.allergyBadge}>
          <Ionicons name="warning" size={12} color="#FF3B30" />
          <Text style={styles.allergyText}>Allergies</Text>
        </View>
      </View>

      <View style={styles.sectionTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sections.map(section => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionTab, activeSection === section.id && styles.sectionTabActive]}
              onPress={() => setActiveSection(section.id)}
            >
              <Ionicons
                name={section.icon as any}
                size={18}
                color={activeSection === section.id ? '#007AFF' : '#666'}
              />
              <Text
                style={[
                  styles.sectionTabText,
                  activeSection === section.id && styles.sectionTabTextActive,
                ]}
              >
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.chiefComplaintSection}>
          <Text style={styles.fieldLabel}>Chief Complaint</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter chief complaint..."
              placeholderTextColor="#999"
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
              multiline
            />
            <TouchableOpacity
              style={[styles.micButton, isRecording && styles.micButtonActive]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={22}
                color={isRecording ? '#FF3B30' : '#007AFF'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {activeSection === 'vitals' && (
          <View style={styles.vitalsSection}>
            <View style={styles.vitalsHeader}>
              <Text style={styles.sectionTitle}>Vital Signs</Text>
              <TouchableOpacity style={styles.addVitalButton}>
                <Ionicons name="add" size={18} color="#007AFF" />
                <Text style={styles.addVitalText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.vitalsGrid}>
              {vitals.map((vital, index) => (
                <TouchableOpacity key={vital.label} style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>{vital.label}</Text>
                  <Text style={styles.vitalValue}>{vital.value}</Text>
                  <Text style={styles.vitalUnit}>{vital.unit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeSection === 'history' && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>History of Present Illness</Text>
            <View style={styles.voiceInputCard}>
              <TouchableOpacity
                style={[styles.voiceInputButton, isRecording && styles.voiceInputButtonActive]}
                onPress={() => setIsRecording(!isRecording)}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'mic-circle'}
                  size={48}
                  color={isRecording ? '#FF3B30' : '#007AFF'}
                />
              </TouchableOpacity>
              <Text style={styles.voiceInputText}>
                {isRecording ? 'Recording... Tap to stop' : 'Tap to dictate HPI'}
              </Text>
            </View>

            <View style={styles.historyTemplates}>
              <Text style={styles.templateLabel}>Quick Templates</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['Chest Pain', 'Shortness of Breath', 'Abdominal Pain', 'Headache'].map(
                  template => (
                    <TouchableOpacity key={template} style={styles.templateChip}>
                      <Text style={styles.templateChipText}>{template}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {activeSection === 'exam' && (
          <View style={styles.examSection}>
            <Text style={styles.sectionTitle}>Physical Examination</Text>
            {['General', 'HEENT', 'Cardiovascular', 'Respiratory', 'Abdomen', 'Neurological'].map(
              system => (
                <TouchableOpacity key={system} style={styles.examSystem}>
                  <View style={styles.examSystemHeader}>
                    <Text style={styles.examSystemName}>{system}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </View>
                  <Text style={styles.examSystemStatus}>Tap to document findings</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}

        {activeSection === 'assessment' && (
          <View style={styles.assessmentSection}>
            <Text style={styles.sectionTitle}>Assessment & Diagnosis</Text>
            <View style={styles.diagnosisInput}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.diagnosisTextInput}
                placeholder="Search ICD-10 codes or diagnoses..."
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.diagnosisList}>
              <Text style={styles.diagnosisListLabel}>Current Diagnoses</Text>
              <View style={styles.diagnosisItem}>
                <View style={styles.diagnosisInfo}>
                  <Text style={styles.diagnosisCode}>J06.9</Text>
                  <Text style={styles.diagnosisName}>Acute upper respiratory infection</Text>
                </View>
                <TouchableOpacity>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeSection === 'plan' && (
          <View style={styles.planSection}>
            <Text style={styles.sectionTitle}>Treatment Plan</Text>
            {['Medications', 'Lab Orders', 'Imaging', 'Referrals', 'Follow-up'].map(category => (
              <TouchableOpacity key={category} style={styles.planCategory}>
                <View style={styles.planCategoryHeader}>
                  <Text style={styles.planCategoryName}>{category}</Text>
                  <TouchableOpacity style={styles.addOrderButton}>
                    <Ionicons name="add" size={18} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.draftButton}>
          <Ionicons name="save-outline" size={20} color="#007AFF" />
          <Text style={styles.draftButtonText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signButton}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.signButtonText}>Sign & Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  patientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  patientDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  allergyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  allergyText: {
    fontSize: 11,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '500',
  },
  sectionTabs: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  sectionTabText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  sectionTabTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  chiefComplaintSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 60,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  micButtonActive: {
    backgroundColor: '#FFEBEE',
  },
  vitalsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  vitalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addVitalButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addVitalText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  vitalCard: {
    width: '31%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    margin: '1%',
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  vitalUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  historySection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  voiceInputCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  voiceInputButton: {
    marginBottom: 12,
  },
  voiceInputButtonActive: {},
  voiceInputText: {
    fontSize: 14,
    color: '#666',
  },
  historyTemplates: {
    marginTop: 16,
  },
  templateLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  templateChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  templateChipText: {
    fontSize: 13,
    color: '#007AFF',
  },
  examSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  examSystem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  examSystemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examSystemName: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  examSystemStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  assessmentSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  diagnosisInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  diagnosisTextInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1A1A1A',
  },
  diagnosisList: {
    marginTop: 16,
  },
  diagnosisListLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  diagnosisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  diagnosisInfo: {
    flex: 1,
  },
  diagnosisCode: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  diagnosisName: {
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 2,
  },
  planSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  planCategory: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  planCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCategoryName: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  addOrderButton: {
    padding: 4,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  draftButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
  },
  draftButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 6,
  },
  signButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  signButtonText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default PatientEncounterScreen;
