import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LectureRecordingScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [lectureTitle, setLectureTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('CS101');

  const courses = ['CS101', 'MATH201', 'ENG102', 'PHYS301'];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lecture Recording</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Lecture Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Introduction to Algorithms"
            placeholderTextColor="#999"
            value={lectureTitle}
            onChangeText={setLectureTitle}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Course</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {courses.map(course => (
              <TouchableOpacity
                key={course}
                style={[styles.courseChip, selectedCourse === course && styles.courseChipActive]}
                onPress={() => setSelectedCourse(course)}
              >
                <Text
                  style={[
                    styles.courseChipText,
                    selectedCourse === course && styles.courseChipTextActive,
                  ]}
                >
                  {course}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.recordingSection}>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{formatTime(duration)}</Text>
            {isRecording && <View style={styles.recordingIndicator} />}
          </View>

          <View style={styles.waveform}>
            {[...Array(20)].map((_, i) => (
              <View key={i} style={[styles.waveformBar, { height: 10 + Math.random() * 30 }]} />
            ))}
          </View>

          <View style={styles.recordingControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="bookmark-outline" size={24} color="#007AFF" />
              <Text style={styles.controlLabel}>Bookmark</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainRecordButton, isRecording && styles.mainRecordButtonActive]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Ionicons name={isRecording ? 'pause' : 'mic'} size={36} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="flag-outline" size={24} color="#007AFF" />
              <Text style={styles.controlLabel}>Mark Topic</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Recording Features</Text>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Ionicons name="text" size={24} color="#34C759" />
              <Text style={styles.featureLabel}>Live Transcription</Text>
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>ON</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.featureLabel}>Speaker ID</Text>
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>ON</Text>
              </View>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Ionicons name="bulb" size={24} color="#FF9500" />
              <Text style={styles.featureLabel}>Key Points</Text>
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>AUTO</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="help-circle" size={24} color="#AF52DE" />
              <Text style={styles.featureLabel}>Q&A Detection</Text>
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>ON</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Lectures</Text>
          {['Data Structures - Trees', 'Algorithm Analysis', 'Sorting Algorithms'].map(
            (lecture, i) => (
              <TouchableOpacity key={lecture} style={styles.lectureItem}>
                <Ionicons name="play-circle" size={24} color="#007AFF" />
                <View style={styles.lectureInfo}>
                  <Text style={styles.lectureTitle}>{lecture}</Text>
                  <Text style={styles.lectureMeta}>
                    {selectedCourse} • {45 + i * 10} min
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            )
          )}
        </View>
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
  content: { flex: 1 },
  inputSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  courseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  courseChipActive: { backgroundColor: '#007AFF' },
  courseChipText: { fontSize: 14, color: '#666' },
  courseChipTextActive: { color: '#FFF', fontWeight: '500' },
  recordingSection: { backgroundColor: '#FFF', padding: 24, alignItems: 'center', marginBottom: 8 },
  timerDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  timerText: { fontSize: 48, fontWeight: '300', color: '#1A1A1A', fontVariant: ['tabular-nums'] },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginLeft: 12,
  },
  waveform: { flexDirection: 'row', alignItems: 'center', height: 50, marginBottom: 24 },
  waveformBar: {
    width: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 2,
    borderRadius: 2,
    opacity: 0.6,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  controlButton: { alignItems: 'center', padding: 12 },
  controlLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  mainRecordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainRecordButtonActive: { backgroundColor: '#FF3B30' },
  featuresSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  featureRow: { flexDirection: 'row', marginBottom: 12 },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  featureLabel: { flex: 1, fontSize: 12, color: '#1A1A1A', marginLeft: 8 },
  featureBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featureBadgeText: { fontSize: 10, color: '#34C759', fontWeight: '600' },
  recentSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 24 },
  lectureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lectureInfo: { flex: 1, marginLeft: 12 },
  lectureTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  lectureMeta: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default LectureRecordingScreen;
