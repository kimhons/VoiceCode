import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LectureNotesScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'transcript' | 'notes' | 'summary'>('transcript');

  const timestamps = [
    { time: '00:00', label: 'Introduction', type: 'topic' },
    { time: '05:23', label: 'Key Concept: Big O Notation', type: 'key_point' },
    { time: '12:45', label: 'Student Question', type: 'qa' },
    { time: '18:30', label: 'Example: Sorting Algorithms', type: 'example' },
    { time: '25:00', label: 'Practice Problem', type: 'exercise' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Lecture Notes</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.lectureInfo}>
        <Text style={styles.lectureName}>Introduction to Data Structures</Text>
        <Text style={styles.lectureMeta}>CS101 • March 15, 2024 • 45 min</Text>
      </View>

      <View style={styles.tabBar}>
        {(['transcript', 'notes', 'summary'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.timelineBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {timestamps.map((ts, i) => (
            <TouchableOpacity key={i} style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor:
                      ts.type === 'key_point'
                        ? '#FF9500'
                        : ts.type === 'qa'
                          ? '#AF52DE'
                          : '#007AFF',
                  },
                ]}
              />
              <Text style={styles.timelineTime}>{ts.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'transcript' && (
          <View style={styles.transcriptView}>
            {timestamps.map((ts, i) => (
              <View key={i} style={styles.transcriptBlock}>
                <View style={styles.transcriptHeader}>
                  <Text style={styles.transcriptTime}>{ts.time}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          ts.type === 'key_point'
                            ? '#FFF3E0'
                            : ts.type === 'qa'
                              ? '#F3E5F5'
                              : '#E3F2FD',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color:
                            ts.type === 'key_point'
                              ? '#FF9500'
                              : ts.type === 'qa'
                                ? '#AF52DE'
                                : '#007AFF',
                        },
                      ]}
                    >
                      {ts.type.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.transcriptLabel}>{ts.label}</Text>
                <Text style={styles.transcriptText}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua.
                </Text>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'notes' && (
          <View style={styles.notesView}>
            <View style={styles.noteCard}>
              <Ionicons name="bulb" size={20} color="#FF9500" />
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>Key Point</Text>
                <Text style={styles.noteText}>Big O Notation describes algorithm efficiency</Text>
              </View>
            </View>
            <View style={styles.noteCard}>
              <Ionicons name="help-circle" size={20} color="#AF52DE" />
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>Question Answered</Text>
                <Text style={styles.noteText}>Why is O(n log n) better than O(n²)?</Text>
              </View>
            </View>
            <View style={styles.noteCard}>
              <Ionicons name="code-slash" size={20} color="#007AFF" />
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>Code Example</Text>
                <Text style={styles.noteText}>QuickSort implementation discussed</Text>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'summary' && (
          <View style={styles.summaryView}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>AI-Generated Summary</Text>
              <Text style={styles.summaryText}>
                This lecture covered fundamental concepts of data structures, focusing on Big O
                notation for algorithm analysis. Key topics included time complexity, space
                complexity, and common sorting algorithms. Students were introduced to practical
                examples of when to use different data structures.
              </Text>
            </View>
            <View style={styles.keyPointsList}>
              <Text style={styles.listTitle}>Key Takeaways</Text>
              {[
                'Big O notation basics',
                'Time vs Space complexity',
                'Sorting algorithm comparison',
                'Practice problems assigned',
              ].map((point, i) => (
                <View key={i} style={styles.keyPointItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="play-circle" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="school" size={24} color="#007AFF" />
          <Text style={styles.actionText}>Quiz</Text>
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
  title: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  lectureInfo: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lectureName: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  lectureMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  timelineBar: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  timelineItem: { alignItems: 'center', marginRight: 24 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  timelineTime: { fontSize: 11, color: '#666' },
  content: { flex: 1 },
  transcriptView: { padding: 16 },
  transcriptBlock: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12 },
  transcriptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  transcriptTime: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  transcriptLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  transcriptText: { fontSize: 14, color: '#333', lineHeight: 20 },
  notesView: { padding: 16 },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteContent: { flex: 1, marginLeft: 12 },
  noteTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 4 },
  noteText: { fontSize: 15, color: '#1A1A1A' },
  summaryView: { padding: 16 },
  summaryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  summaryText: { fontSize: 14, color: '#333', lineHeight: 22 },
  keyPointsList: { backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  keyPointItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  keyPointText: { fontSize: 14, color: '#1A1A1A', marginLeft: 8 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 11, color: '#666', marginTop: 4 },
});

export default LectureNotesScreen;
