import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const VoiceJournalScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'calm', emoji: '😌', label: 'Calm' },
    { id: 'anxious', emoji: '😰', label: 'Anxious' },
    { id: 'sad', emoji: '😢', label: 'Sad' },
    { id: 'energetic', emoji: '⚡', label: 'Energetic' },
  ];

  const entries = [
    {
      id: '1',
      date: 'Today',
      time: '8:30 AM',
      mood: '😊',
      preview: 'Feeling grateful for the morning sunshine...',
      duration: '2:15',
    },
    {
      id: '2',
      date: 'Yesterday',
      time: '9:00 PM',
      mood: '😌',
      preview: 'Reflecting on a productive day at work...',
      duration: '3:45',
    },
    {
      id: '3',
      date: '3 days ago',
      time: '7:00 AM',
      mood: '⚡',
      preview: 'Ready to tackle the new project...',
      duration: '1:30',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Journal</Text>
        <TouchableOpacity>
          <Ionicons name="calendar-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.moodSection}>
          <Text style={styles.label}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {moods.map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[styles.moodButton, selectedMood === mood.id && styles.moodButtonSelected]}
                onPress={() => setSelectedMood(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.recordSection}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={36} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {isRecording ? 'Recording your thoughts...' : 'Tap to start journaling'}
          </Text>
          {isRecording && <Text style={styles.recordingTime}>00:00:32</Text>}
        </View>

        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}>Today&apos;s Prompt</Text>
          <View style={styles.promptCard}>
            <Ionicons name="bulb" size={24} color="#FF9500" />
            <Text style={styles.promptText}>What are three things you&apos;re grateful for today?</Text>
          </View>
          <TouchableOpacity style={styles.newPromptButton}>
            <Ionicons name="refresh" size={16} color="#007AFF" />
            <Text style={styles.newPromptText}>New prompt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {entries.map(entry => (
            <TouchableOpacity key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryMood}>{entry.mood}</Text>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                  <Text style={styles.entryTime}>{entry.time}</Text>
                </View>
                <Text style={styles.entryDuration}>{entry.duration}</Text>
              </View>
              <Text style={styles.entryPreview}>{entry.preview}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12m</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>😊</Text>
              <Text style={styles.statLabel}>Top Mood</Text>
            </View>
          </View>
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
  moodSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  moodGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: { alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#F5F5F5' },
  moodButtonSelected: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#007AFF' },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  recordSection: { backgroundColor: '#FFF', padding: 32, alignItems: 'center', marginBottom: 8 },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#AF52DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: { backgroundColor: '#FF3B30' },
  recordHint: { fontSize: 14, color: '#666', marginTop: 16 },
  recordingTime: { fontSize: 24, fontWeight: '300', color: '#1A1A1A', marginTop: 8 },
  promptSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  promptLabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
  },
  promptText: { flex: 1, fontSize: 15, color: '#1A1A1A', marginLeft: 12, lineHeight: 22 },
  newPromptButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  newPromptText: { fontSize: 14, color: '#007AFF', marginLeft: 4 },
  entriesSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  entryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  entryMood: { fontSize: 24, marginRight: 12 },
  entryMeta: { flex: 1 },
  entryDate: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  entryTime: { fontSize: 12, color: '#666' },
  entryDuration: { fontSize: 12, color: '#007AFF' },
  entryPreview: { fontSize: 14, color: '#666', lineHeight: 20 },
  statsSection: { padding: 16, marginBottom: 24 },
  statsGrid: { flexDirection: 'row' },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: { fontSize: 24, fontWeight: '600', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
});

export default VoiceJournalScreen;
