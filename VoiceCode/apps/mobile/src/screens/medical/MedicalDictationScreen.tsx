import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface DictationSession {
  id: string;
  patientId?: string;
  noteType: 'progress' | 'soap' | 'discharge' | 'consultation' | 'operative';
  content: string;
  timestamp: Date;
  duration: number;
  status: 'recording' | 'paused' | 'completed' | 'reviewed';
}

const MedicalDictationScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [noteType, setNoteType] = useState<DictationSession['noteType']>('progress');
  const [transcription, setTranscription] = useState('');
  const [duration, setDuration] = useState(0);

  const noteTypes = [
    { id: 'progress', label: 'Progress Note', icon: 'document-text' },
    { id: 'soap', label: 'SOAP Note', icon: 'list' },
    { id: 'discharge', label: 'Discharge', icon: 'exit' },
    { id: 'consultation', label: 'Consultation', icon: 'people' },
    { id: 'operative', label: 'Operative', icon: 'medical' },
  ];

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsPaused(!isPaused);
    } else {
      setIsRecording(true);
      setIsPaused(false);
      // Simulate dictation
      setTranscription('Patient presents with chief complaint of...');
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Dictation</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.hipaaBar}>
        <Ionicons name="shield-checkmark" size={16} color="#34C759" />
        <Text style={styles.hipaaText}>HIPAA Compliant • Encrypted</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.noteTypeSection}>
          <Text style={styles.sectionTitle}>Note Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {noteTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.noteTypeButton, noteType === type.id && styles.noteTypeButtonActive]}
                onPress={() => setNoteType(type.id as DictationSession['noteType'])}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={noteType === type.id ? '#FFF' : '#007AFF'}
                />
                <Text
                  style={[styles.noteTypeText, noteType === type.id && styles.noteTypeTextActive]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.patientSection}>
          <Text style={styles.sectionTitle}>Patient Information (Optional)</Text>
          <View style={styles.patientInputRow}>
            <TextInput
              style={styles.patientInput}
              placeholder="Patient ID or Name"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.scanButton}>
              <Ionicons name="scan" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recordingSection}>
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={[
                styles.mainRecordButton,
                isRecording && !isPaused && styles.mainRecordButtonActive,
              ]}
              onPress={toggleRecording}
            >
              <Ionicons name={isRecording && !isPaused ? 'pause' : 'mic'} size={40} color="#FFF" />
            </TouchableOpacity>
            {isRecording && (
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Ionicons name="stop" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          {isRecording && (
            <View style={styles.recordingStatus}>
              <View style={[styles.recordingDot, isPaused && styles.recordingDotPaused]} />
              <Text style={styles.recordingTime}>{formatDuration(duration)}</Text>
              <Text style={styles.recordingLabel}>{isPaused ? 'Paused' : 'Recording...'}</Text>
            </View>
          )}
        </View>

        <View style={styles.transcriptionSection}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.sectionTitle}>Transcription</Text>
            <TouchableOpacity>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transcriptionBox}>
            {transcription ? (
              <Text style={styles.transcriptionText}>{transcription}</Text>
            ) : (
              <Text style={styles.transcriptionPlaceholder}>
                Start dictating to see transcription here...
              </Text>
            )}
          </View>
        </View>

        <View style={styles.quickPhrases}>
          <Text style={styles.sectionTitle}>Quick Phrases</Text>
          <View style={styles.phrasesGrid}>
            {[
              'No acute distress',
              'Vital signs stable',
              'Follow up in 2 weeks',
              'Continue current medications',
              'Labs pending',
              'Patient educated',
            ].map(phrase => (
              <TouchableOpacity key={phrase} style={styles.phraseButton}>
                <Text style={styles.phraseText}>{phrase}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryAction}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.primaryActionText}>Save & Sign</Text>
          </TouchableOpacity>
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryAction}>
              <Ionicons name="document-text-outline" size={18} color="#007AFF" />
              <Text style={styles.secondaryActionText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <Ionicons name="copy-outline" size={18} color="#007AFF" />
              <Text style={styles.secondaryActionText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <Ionicons name="share-outline" size={18} color="#007AFF" />
              <Text style={styles.secondaryActionText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  settingsButton: {
    padding: 8,
  },
  hipaaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
  },
  hipaaText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 6,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  noteTypeSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  noteTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 10,
  },
  noteTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  noteTypeText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 6,
  },
  noteTypeTextActive: {
    color: '#FFF',
  },
  patientSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  patientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  recordingSection: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainRecordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainRecordButtonActive: {
    backgroundColor: '#FF9500',
  },
  stopButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  recordingDotPaused: {
    backgroundColor: '#FF9500',
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginHorizontal: 12,
  },
  recordingLabel: {
    fontSize: 14,
    color: '#666',
  },
  transcriptionSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    fontSize: 14,
    color: '#007AFF',
  },
  transcriptionBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
  },
  transcriptionText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  transcriptionPlaceholder: {
    fontSize: 15,
    color: '#999',
    fontStyle: 'italic',
  },
  quickPhrases: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  phraseButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  phraseText: {
    fontSize: 13,
    color: '#007AFF',
  },
  actionsSection: {
    padding: 16,
    marginBottom: 24,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
});

export default MedicalDictationScreen;
