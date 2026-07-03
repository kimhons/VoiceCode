import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface PatientInfo {
  name: string;
  dob: string;
  mrn: string;
  lastVisit: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
}

interface UpcomingAppointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  duration: number;
  isReviewed: boolean;
}

const PreConsultReviewScreen: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>({
    name: 'John Smith',
    dob: '1965-03-15',
    mrn: 'MRN-2024-001234',
    lastVisit: '2025-12-15',
    allergies: ['Penicillin', 'Sulfa drugs'],
    medications: ['Lisinopril 10mg daily', 'Metformin 500mg BID', 'Atorvastatin 20mg daily'],
    conditions: ['Type 2 Diabetes', 'Hypertension', 'Hyperlipidemia'],
  });

  const [notes, setNotes] = useState('');

  const upcomingAppointments: UpcomingAppointment[] = [
    {
      id: '1',
      patientName: 'John Smith',
      time: '9:00 AM',
      type: 'Follow-up',
      duration: 20,
      isReviewed: true,
    },
    {
      id: '2',
      patientName: 'Maria Garcia',
      time: '9:30 AM',
      type: 'New Patient',
      duration: 40,
      isReviewed: false,
    },
    {
      id: '3',
      patientName: 'Robert Johnson',
      time: '10:15 AM',
      type: 'Annual Physical',
      duration: 45,
      isReviewed: false,
    },
    {
      id: '4',
      patientName: 'Emily Chen',
      time: '11:00 AM',
      type: 'Follow-up',
      duration: 20,
      isReviewed: false,
    },
  ];

  const recentLabs = [
    { name: 'HbA1c', value: '7.2%', date: '2025-12-10', status: 'elevated' },
    { name: 'LDL Cholesterol', value: '110 mg/dL', date: '2025-12-10', status: 'normal' },
    { name: 'Creatinine', value: '1.1 mg/dL', date: '2025-12-10', status: 'normal' },
    { name: 'eGFR', value: '78 mL/min', date: '2025-12-10', status: 'normal' },
  ];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'elevated':
        return '#FF9500';
      case 'critical':
        return '#FF3B30';
      default:
        return '#34C759';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Pre-Consult Review</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scheduleScroll}
        >
          {upcomingAppointments.map(apt => (
            <TouchableOpacity
              key={apt.id}
              style={[
                styles.appointmentChip,
                apt.patientName === selectedPatient?.name && styles.appointmentChipActive,
              ]}
              onPress={() => setSelectedPatient({ ...selectedPatient!, name: apt.patientName })}
            >
              <Text
                style={[
                  styles.appointmentTime,
                  apt.patientName === selectedPatient?.name && styles.appointmentTimeActive,
                ]}
              >
                {apt.time}
              </Text>
              <Text
                style={[
                  styles.appointmentName,
                  apt.patientName === selectedPatient?.name && styles.appointmentNameActive,
                ]}
                numberOfLines={1}
              >
                {apt.patientName}
              </Text>
              {apt.isReviewed && <View style={styles.reviewedDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedPatient && (
          <>
            <View style={styles.patientHeader}>
              <View style={styles.patientAvatar}>
                <Text style={styles.avatarText}>
                  {selectedPatient.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{selectedPatient.name}</Text>
                <Text style={styles.patientMeta}>
                  DOB: {selectedPatient.dob} • MRN: {selectedPatient.mrn}
                </Text>
                <Text style={styles.lastVisit}>Last visit: {selectedPatient.lastVisit}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning" size={20} color="#FF3B30" />
                <Text style={styles.sectionTitle}>Allergies</Text>
              </View>
              <View style={styles.tagContainer}>
                {selectedPatient.allergies.map((allergy, idx) => (
                  <View key={idx} style={styles.allergyTag}>
                    <Text style={styles.allergyText}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="medical" size={20} color="#007AFF" />
                <Text style={styles.sectionTitle}>Active Conditions</Text>
              </View>
              <View style={styles.conditionsList}>
                {selectedPatient.conditions.map((condition, idx) => (
                  <View key={idx} style={styles.conditionItem}>
                    <View style={styles.conditionDot} />
                    <Text style={styles.conditionText}>{condition}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="medkit" size={20} color="#34C759" />
                <Text style={styles.sectionTitle}>Current Medications</Text>
              </View>
              <View style={styles.medicationsList}>
                {selectedPatient.medications.map((med, idx) => (
                  <View key={idx} style={styles.medicationItem}>
                    <Ionicons name="ellipse" size={8} color="#34C759" />
                    <Text style={styles.medicationText}>{med}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flask" size={20} color="#FF9500" />
                <Text style={styles.sectionTitle}>Recent Lab Results</Text>
              </View>
              <View style={styles.labsGrid}>
                {recentLabs.map((lab, idx) => (
                  <View key={idx} style={styles.labCard}>
                    <Text style={styles.labName}>{lab.name}</Text>
                    <Text style={[styles.labValue, { color: getStatusColor(lab.status) }]}>
                      {lab.value}
                    </Text>
                    <Text style={styles.labDate}>{lab.date}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#5856D6" />
                <Text style={styles.sectionTitle}>Pre-Visit Notes</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes for this visit..."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.startConsultButton}>
                <Ionicons name="mic" size={22} color="#FFF" />
                <Text style={styles.startConsultText}>Start Consult</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.markReviewedButton}>
                <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                <Text style={styles.markReviewedText}>Mark Reviewed</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

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
  refreshButton: { padding: 4 },
  scheduleBar: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  scheduleScroll: { paddingHorizontal: 16 },
  appointmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginRight: 10,
    minWidth: 100,
    position: 'relative',
  },
  appointmentChipActive: { backgroundColor: '#007AFF' },
  appointmentTime: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  appointmentTimeActive: { color: 'rgba(255,255,255,0.8)' },
  appointmentName: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginTop: 2 },
  appointmentNameActive: { color: '#FFF' },
  reviewedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  content: { flex: 1 },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: '600', color: '#FFF' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 20, fontWeight: '600', color: '#1C1C1E' },
  patientMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  lastVisit: { fontSize: 13, color: '#007AFF', marginTop: 4 },
  section: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginLeft: 8 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  allergyTag: {
    backgroundColor: '#FF3B3020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  allergyText: { fontSize: 13, fontWeight: '500', color: '#FF3B30' },
  conditionsList: {},
  conditionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 10,
  },
  conditionText: { fontSize: 15, color: '#1C1C1E' },
  medicationsList: {},
  medicationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  medicationText: { fontSize: 14, color: '#1C1C1E', marginLeft: 8 },
  labsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  labCard: {
    width: '48%',
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 12,
    margin: '1%',
  },
  labName: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  labValue: { fontSize: 18, fontWeight: '600' },
  labDate: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  notesInput: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1C1C1E',
    minHeight: 100,
  },
  actionButtons: { flexDirection: 'row', padding: 16 },
  startConsultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  startConsultText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  markReviewedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  markReviewedText: { fontSize: 16, fontWeight: '600', color: '#34C759', marginLeft: 8 },
  bottomPadding: { height: 40 },
});

export default PreConsultReviewScreen;
