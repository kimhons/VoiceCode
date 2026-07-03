import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const StudentFeedbackScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'verbal' | 'written'>('verbal');

  const students = [
    { id: '1', name: 'Alice Johnson', avatar: 'AJ', lastFeedback: '2 days ago' },
    { id: '2', name: 'Bob Smith', avatar: 'BS', lastFeedback: '1 week ago' },
    { id: '3', name: 'Carol Davis', avatar: 'CD', lastFeedback: 'Never' },
  ];

  const feedbackTemplates = [
    'Great improvement!',
    'Needs more practice',
    'Excellent work',
    'See me after class',
    'Keep it up!',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Feedback</Text>
        <TouchableOpacity>
          <Ionicons name="people" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, feedbackType === 'verbal' && styles.toggleButtonActive]}
          onPress={() => setFeedbackType('verbal')}
        >
          <Ionicons name="mic" size={18} color={feedbackType === 'verbal' ? '#FFF' : '#007AFF'} />
          <Text style={[styles.toggleText, feedbackType === 'verbal' && styles.toggleTextActive]}>
            Voice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, feedbackType === 'written' && styles.toggleButtonActive]}
          onPress={() => setFeedbackType('written')}
        >
          <Ionicons
            name="create"
            size={18}
            color={feedbackType === 'written' ? '#FFF' : '#007AFF'}
          />
          <Text style={[styles.toggleText, feedbackType === 'written' && styles.toggleTextActive]}>
            Written
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.studentsSection}>
          <Text style={styles.sectionTitle}>Select Student</Text>
          {students.map(student => (
            <TouchableOpacity key={student.id} style={styles.studentCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{student.avatar}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.lastFeedback}>Last feedback: {student.lastFeedback}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {feedbackType === 'verbal' && (
          <View style={styles.voiceSection}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.recordHint}>
              {isRecording ? 'Recording feedback...' : 'Tap to record feedback'}
            </Text>
          </View>
        )}

        {feedbackType === 'written' && (
          <View style={styles.writtenSection}>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Type your feedback..."
              placeholderTextColor="#999"
              multiline
            />
          </View>
        )}

        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>Quick Feedback</Text>
          <View style={styles.templateGrid}>
            {feedbackTemplates.map(template => (
              <TouchableOpacity key={template} style={styles.templateChip}>
                <Text style={styles.templateText}>{template}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#FFF" />
          <Text style={styles.sendButtonText}>Send Feedback</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginHorizontal: 4,
  },
  toggleButtonActive: { backgroundColor: '#007AFF' },
  toggleText: { fontSize: 14, color: '#007AFF', marginLeft: 6 },
  toggleTextActive: { color: '#FFF' },
  content: { flex: 1, padding: 16 },
  studentsSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  lastFeedback: { fontSize: 12, color: '#666', marginTop: 2 },
  voiceSection: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: { backgroundColor: '#FF3B30' },
  recordHint: { fontSize: 14, color: '#666', marginTop: 16 },
  writtenSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  feedbackInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    color: '#1A1A1A',
  },
  templatesSection: { marginBottom: 16 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  templateChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  templateText: { fontSize: 13, color: '#1A1A1A' },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  sendButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default StudentFeedbackScreen;
