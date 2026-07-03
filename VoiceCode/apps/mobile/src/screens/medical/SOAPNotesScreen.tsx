import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SOAPNotesScreen: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'S' | 'O' | 'A' | 'P'>('S');
  const [isRecording, setIsRecording] = useState(false);
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  const sections = [
    {
      id: 'S',
      label: 'Subjective',
      color: '#007AFF',
      description: 'Patient complaints and history',
    },
    {
      id: 'O',
      label: 'Objective',
      color: '#34C759',
      description: 'Physical exam and test results',
    },
    {
      id: 'A',
      label: 'Assessment',
      color: '#FF9500',
      description: 'Diagnosis and clinical impression',
    },
    { id: 'P', label: 'Plan', color: '#AF52DE', description: 'Treatment and follow-up' },
  ];

  const getCurrentValue = () => {
    switch (activeSection) {
      case 'S':
        return subjective;
      case 'O':
        return objective;
      case 'A':
        return assessment;
      case 'P':
        return plan;
      default:
        return '';
    }
  };

  const setCurrentValue = (value: string) => {
    switch (activeSection) {
      case 'S':
        setSubjective(value);
        break;
      case 'O':
        setObjective(value);
        break;
      case 'A':
        setAssessment(value);
        break;
      case 'P':
        setPlan(value);
        break;
    }
  };

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>SOAP Note</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionTabs}>
        {sections.map(section => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionTab,
              activeSection === section.id && { borderBottomColor: section.color },
            ]}
            onPress={() => setActiveSection(section.id as typeof activeSection)}
          >
            <Text
              style={[
                styles.sectionTabLetter,
                activeSection === section.id && { color: section.color },
              ]}
            >
              {section.id}
            </Text>
            <Text
              style={[
                styles.sectionTabLabel,
                activeSection === section.id && styles.sectionTabLabelActive,
              ]}
            >
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIndicator, { backgroundColor: currentSection?.color }]} />
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{currentSection?.label}</Text>
            <Text style={styles.sectionDescription}>{currentSection?.description}</Text>
          </View>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Ionicons
                name={isRecording ? 'stop-circle' : 'mic-circle'}
                size={44}
                color={isRecording ? '#FF3B30' : currentSection?.color}
              />
            </TouchableOpacity>
            <Text style={styles.voiceHint}>
              {isRecording ? 'Recording... Tap to stop' : 'Tap to dictate'}
            </Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder={`Enter ${currentSection?.label.toLowerCase()} findings...`}
            placeholderTextColor="#999"
            value={getCurrentValue()}
            onChangeText={setCurrentValue}
            multiline
            textAlignVertical="top"
          />
        </View>

        {activeSection === 'S' && (
          <View style={styles.quickTemplates}>
            <Text style={styles.templatesTitle}>Quick Phrases</Text>
            <View style={styles.templateChips}>
              {['Chief complaint:', 'HPI:', 'ROS:', 'PMH:', 'Medications:', 'Allergies:'].map(
                phrase => (
                  <TouchableOpacity
                    key={phrase}
                    style={styles.templateChip}
                    onPress={() =>
                      setSubjective(subjective + (subjective ? '\n' : '') + phrase + ' ')
                    }
                  >
                    <Text style={styles.templateChipText}>{phrase}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        {activeSection === 'O' && (
          <View style={styles.quickTemplates}>
            <Text style={styles.templatesTitle}>Exam Templates</Text>
            <View style={styles.templateChips}>
              {['Vitals:', 'General:', 'HEENT:', 'Lungs:', 'Heart:', 'Abdomen:', 'Neuro:'].map(
                phrase => (
                  <TouchableOpacity
                    key={phrase}
                    style={styles.templateChip}
                    onPress={() => setObjective(objective + (objective ? '\n' : '') + phrase + ' ')}
                  >
                    <Text style={styles.templateChipText}>{phrase}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Completion</Text>
          <View style={styles.progressItems}>
            {sections.map(section => {
              const value =
                section.id === 'S'
                  ? subjective
                  : section.id === 'O'
                    ? objective
                    : section.id === 'A'
                      ? assessment
                      : plan;
              const isComplete = value.length > 10;
              return (
                <View key={section.id} style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressDot,
                      { backgroundColor: isComplete ? section.color : '#E0E0E0' },
                    ]}
                  >
                    {isComplete && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  </View>
                  <Text style={styles.progressLabel}>{section.id}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.previewButton}>
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signButton}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.signButtonText}>Sign Note</Text>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { padding: 8 },
  title: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  saveButton: { paddingHorizontal: 12, paddingVertical: 6 },
  saveButtonText: { fontSize: 15, color: '#007AFF', fontWeight: '500' },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  sectionTabLetter: { fontSize: 20, fontWeight: '700', color: '#999' },
  sectionTabLabel: { fontSize: 11, color: '#999', marginTop: 2 },
  sectionTabLabelActive: { color: '#1A1A1A' },
  content: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  sectionIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  sectionInfo: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  sectionDescription: { fontSize: 13, color: '#666', marginTop: 2 },
  inputSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  inputHeader: { alignItems: 'center', marginBottom: 16 },
  voiceButton: { marginBottom: 8 },
  voiceButtonActive: {},
  voiceHint: { fontSize: 13, color: '#666' },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 150,
  },
  quickTemplates: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  templatesTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  templateChips: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  templateChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  templateChipText: { fontSize: 13, color: '#007AFF' },
  progressSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 24 },
  progressTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  progressItems: { flexDirection: 'row', justifyContent: 'space-around' },
  progressItem: { alignItems: 'center' },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: { fontSize: 12, color: '#666' },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewButton: {
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
  previewButtonText: { fontSize: 15, color: '#007AFF', fontWeight: '500', marginLeft: 6 },
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
  signButtonText: { fontSize: 15, color: '#FFF', fontWeight: '600', marginLeft: 6 },
});

export default SOAPNotesScreen;
