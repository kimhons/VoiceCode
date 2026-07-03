import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const StudyGuideGeneratorScreen: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const recentGuides = [
    { id: '1', title: 'Data Structures Overview', course: 'CS101', date: 'Today' },
    { id: '2', title: 'Calculus Fundamentals', course: 'MATH201', date: 'Yesterday' },
    { id: '3', title: 'Literary Analysis Guide', course: 'ENG102', date: '3 days ago' },
  ];

  const guideTypes = [
    'Summary',
    'Flashcards',
    'Practice Questions',
    'Key Concepts',
    'Timeline',
    'Comparison Chart',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Guide Generator</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Topic or Lecture</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter topic or select from lectures..."
            placeholderTextColor="#999"
            value={topic}
            onChangeText={setTopic}
          />
          <TouchableOpacity style={styles.voiceInputButton}>
            <Ionicons name="mic" size={20} color="#007AFF" />
            <Text style={styles.voiceInputText}>Dictate topic</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.typeSection}>
          <Text style={styles.label}>Guide Type</Text>
          <View style={styles.typeGrid}>
            {guideTypes.map(type => (
              <TouchableOpacity key={type} style={styles.typeChip}>
                <Text style={styles.typeText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={() => setIsGenerating(true)}>
          <Ionicons name="sparkles" size={20} color="#FFF" />
          <Text style={styles.generateButtonText}>Generate Study Guide</Text>
        </TouchableOpacity>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Guides</Text>
          {recentGuides.map(guide => (
            <TouchableOpacity key={guide.id} style={styles.guideCard}>
              <Ionicons name="document-text" size={24} color="#007AFF" />
              <View style={styles.guideInfo}>
                <Text style={styles.guideTitle}>{guide.title}</Text>
                <Text style={styles.guideMeta}>
                  {guide.course} • {guide.date}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  content: { flex: 1, padding: 16 },
  inputSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  voiceInputButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  voiceInputText: { fontSize: 14, color: '#007AFF', marginLeft: 6 },
  typeSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  typeChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: { fontSize: 13, color: '#007AFF' },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  generateButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  recentSection: {},
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  guideInfo: { flex: 1, marginLeft: 12 },
  guideTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  guideMeta: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default StudyGuideGeneratorScreen;
