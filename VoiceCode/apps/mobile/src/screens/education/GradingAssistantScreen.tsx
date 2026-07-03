import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Assignment {
  id: string;
  studentName: string;
  submissionDate: Date;
  status: 'pending' | 'graded' | 'reviewed';
  grade?: string;
}

const GradingAssistantScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [assignments] = useState<Assignment[]>([
    { id: '1', studentName: 'Alice Johnson', submissionDate: new Date(), status: 'pending' },
    { id: '2', studentName: 'Bob Smith', submissionDate: new Date(), status: 'pending' },
    {
      id: '3',
      studentName: 'Carol Davis',
      submissionDate: new Date(Date.now() - 86400000),
      status: 'graded',
      grade: 'A-',
    },
    {
      id: '4',
      studentName: 'David Wilson',
      submissionDate: new Date(Date.now() - 86400000),
      status: 'reviewed',
      grade: 'B+',
    },
  ]);

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'graded':
        return '#34C759';
      case 'reviewed':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grading Assistant</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {assignments.filter(a => a.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {assignments.filter(a => a.status === 'graded').length}
          </Text>
          <Text style={styles.statLabel}>Graded</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{assignments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.voiceGradingCard}>
          <Text style={styles.cardTitle}>Voice Grading</Text>
          <Text style={styles.cardDescription}>Dictate feedback and grades for faster grading</Text>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.voiceHint}>
            {isRecording ? 'Recording feedback...' : 'Tap to start'}
          </Text>
        </View>

        <View style={styles.quickFeedback}>
          <Text style={styles.sectionTitle}>Quick Feedback</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              'Excellent work!',
              'Good effort',
              'Needs improvement',
              'See comments',
              'Resubmit',
            ].map(phrase => (
              <TouchableOpacity key={phrase} style={styles.feedbackChip}>
                <Text style={styles.feedbackChipText}>{phrase}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.assignmentsSection}>
          <Text style={styles.sectionTitle}>Submissions</Text>
          {assignments.map(assignment => (
            <TouchableOpacity
              key={assignment.id}
              style={[
                styles.assignmentCard,
                selectedAssignment === assignment.id && styles.assignmentCardSelected,
              ]}
              onPress={() => setSelectedAssignment(assignment.id)}
            >
              <View style={styles.studentAvatar}>
                <Text style={styles.avatarText}>
                  {assignment.studentName
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </Text>
              </View>
              <View style={styles.assignmentInfo}>
                <Text style={styles.studentName}>{assignment.studentName}</Text>
                <Text style={styles.submissionDate}>
                  Submitted {assignment.submissionDate.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.gradeSection}>
                {assignment.grade ? (
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeText}>{assignment.grade}</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(assignment.status)}20` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(assignment.status) }]}>
                      {assignment.status}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedAssignment && (
          <View style={styles.gradingPanel}>
            <Text style={styles.sectionTitle}>Grade Assignment</Text>
            <View style={styles.gradeInput}>
              <Text style={styles.gradeInputLabel}>Grade</Text>
              <View style={styles.gradeOptions}>
                {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'].map(grade => (
                  <TouchableOpacity key={grade} style={styles.gradeOption}>
                    <Text style={styles.gradeOptionText}>{grade}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.feedbackInput}>
              <Text style={styles.gradeInputLabel}>Feedback</Text>
              <TextInput
                style={styles.feedbackTextInput}
                placeholder="Enter feedback or use voice..."
                placeholderTextColor="#999"
                multiline
              />
            </View>
            <TouchableOpacity style={styles.submitGradeButton}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitGradeText}>Submit Grade</Text>
            </TouchableOpacity>
          </View>
        )}
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
  filterButton: { padding: 8 },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '600', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  voiceGradingCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  cardDescription: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: { backgroundColor: '#FF3B30' },
  voiceHint: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  quickFeedback: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  feedbackChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  feedbackChipText: { fontSize: 13, color: '#1A1A1A' },
  assignmentsSection: { marginBottom: 16 },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  assignmentCardSelected: { borderWidth: 2, borderColor: '#007AFF' },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  assignmentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  submissionDate: { fontSize: 12, color: '#666', marginTop: 2 },
  gradeSection: {},
  gradeBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  gradingPanel: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 24 },
  gradeInput: { marginBottom: 16 },
  gradeInputLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  gradeOptions: { flexDirection: 'row', flexWrap: 'wrap' },
  gradeOption: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  gradeOptionText: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  feedbackInput: { marginBottom: 16 },
  feedbackTextInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 80,
  },
  submitGradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitGradeText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default GradingAssistantScreen;
