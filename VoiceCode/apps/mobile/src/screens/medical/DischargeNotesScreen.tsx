import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const DischargeNotesScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [activeSection, setActiveSection] = useState('summary');

  const sections = [
    { id: 'summary', label: 'Summary', icon: 'document-text' },
    { id: 'diagnosis', label: 'Diagnosis', icon: 'medical' },
    { id: 'medications', label: 'Medications', icon: 'medkit' },
    { id: 'instructions', label: 'Instructions', icon: 'list' },
    { id: 'followup', label: 'Follow-up', icon: 'calendar' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Discharge Summary</Text>
        <TouchableOpacity>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.patientBanner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>Jane Doe</Text>
          <Text style={styles.patientDetails}>Admitted: 01/15/2024 • Room 302</Text>
        </View>
      </View>

      <View style={styles.sectionNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sections.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.navItem, activeSection === s.id && styles.navItemActive]}
              onPress={() => setActiveSection(s.id)}
            >
              <Ionicons
                name={s.icon as any}
                size={18}
                color={activeSection === s.id ? '#007AFF' : '#666'}
              />
              <Text style={[styles.navText, activeSection === s.id && styles.navTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.dictationCard}>
          <TouchableOpacity
            style={[styles.dictateButton, isRecording && styles.dictateButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.dictateText}>{isRecording ? 'Recording...' : 'Tap to dictate'}</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Hospital Course Summary</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the hospital course..."
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Discharge Diagnosis</Text>
          <View style={styles.diagnosisItem}>
            <Text style={styles.diagnosisCode}>I10</Text>
            <Text style={styles.diagnosisName}>Essential Hypertension</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Diagnosis</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Discharge Medications</Text>
          <View style={styles.medicationItem}>
            <Text style={styles.medicationName}>Lisinopril 10mg</Text>
            <Text style={styles.medicationSig}>Once daily</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Patient Instructions</Text>
          <View style={styles.instructionsList}>
            {['Diet modifications', 'Activity restrictions', 'Warning signs'].map(item => (
              <TouchableOpacity key={item} style={styles.instructionItem}>
                <Ionicons name="checkbox-outline" size={20} color="#007AFF" />
                <Text style={styles.instructionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Follow-up Appointments</Text>
          <TouchableOpacity style={styles.appointmentCard}>
            <Ionicons name="calendar" size={24} color="#007AFF" />
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentType}>Primary Care Follow-up</Text>
              <Text style={styles.appointmentDate}>Within 7 days</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.previewBtn}>
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.previewBtnText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signBtn}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.signBtnText}>Sign & Discharge</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 17, fontWeight: '600' },
  saveText: { fontSize: 15, color: '#007AFF', fontWeight: '500' },
  patientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  patientDetails: { fontSize: 12, color: '#666', marginTop: 2 },
  sectionNav: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navItemActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  navText: { fontSize: 13, color: '#666', marginLeft: 6 },
  navTextActive: { color: '#007AFF', fontWeight: '500' },
  content: { flex: 1, padding: 16 },
  dictationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  dictateButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dictateButtonActive: { backgroundColor: '#FF3B30' },
  dictateText: { marginTop: 12, fontSize: 14, color: '#666' },
  inputCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 15,
    color: '#1A1A1A',
  },
  diagnosisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  diagnosisCode: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginRight: 8 },
  diagnosisName: { fontSize: 14, color: '#1A1A1A' },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  addButtonText: { fontSize: 14, color: '#007AFF', marginLeft: 6 },
  medicationItem: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 8 },
  medicationName: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  medicationSig: { fontSize: 12, color: '#666', marginTop: 2 },
  instructionsList: {},
  instructionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  instructionText: { fontSize: 14, color: '#1A1A1A', marginLeft: 8 },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  appointmentInfo: { flex: 1, marginLeft: 12 },
  appointmentType: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  appointmentDate: { fontSize: 12, color: '#666', marginTop: 2 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewBtn: {
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
  previewBtnText: { fontSize: 15, color: '#007AFF', fontWeight: '500', marginLeft: 6 },
  signBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  signBtnText: { fontSize: 15, color: '#FFF', fontWeight: '600', marginLeft: 6 },
});

export default DischargeNotesScreen;
