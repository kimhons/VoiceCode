import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const QuizGeneratorScreen: React.FC = () => {
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const questionTypes = [
    { id: 'mc', label: 'Multiple Choice', icon: 'list', selected: true },
    { id: 'tf', label: 'True/False', icon: 'checkmark-circle', selected: true },
    { id: 'short', label: 'Short Answer', icon: 'create', selected: false },
    { id: 'essay', label: 'Essay', icon: 'document-text', selected: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Generator</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Source Material</Text>
          <TouchableOpacity style={styles.sourceButton}>
            <Ionicons name="document-attach" size={24} color="#007AFF" />
            <Text style={styles.sourceButtonText}>Select lecture or upload content</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.label}>Number of Questions</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setQuestionCount(Math.max(5, questionCount - 5))}
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{questionCount}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setQuestionCount(Math.min(50, questionCount + 5))}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultyRow}>
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.difficultyButton, difficulty === d && styles.difficultyButtonActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text
                  style={[styles.difficultyText, difficulty === d && styles.difficultyTextActive]}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.label}>Question Types</Text>
          {questionTypes.map(type => (
            <TouchableOpacity key={type.id} style={styles.typeRow}>
              <Ionicons name={type.icon as any} size={20} color="#007AFF" />
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Ionicons
                name={type.selected ? 'checkbox' : 'square-outline'}
                size={24}
                color={type.selected ? '#34C759' : '#999'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.generateButton}>
          <Ionicons name="sparkles" size={20} color="#FFF" />
          <Text style={styles.generateButtonText}>Generate Quiz</Text>
        </TouchableOpacity>
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
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  sourceButtonText: { fontSize: 14, color: '#666', marginLeft: 12 },
  configSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: { fontSize: 32, fontWeight: '600', color: '#1A1A1A', marginHorizontal: 24 },
  difficultyRow: { flexDirection: 'row' },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  difficultyButtonActive: { backgroundColor: '#007AFF' },
  difficultyText: { fontSize: 14, color: '#666' },
  difficultyTextActive: { color: '#FFF', fontWeight: '600' },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  typeLabel: { flex: 1, fontSize: 15, color: '#1A1A1A', marginLeft: 12 },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#AF52DE',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  generateButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default QuizGeneratorScreen;
