import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const QuickCaptureScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [captureType, setCaptureType] = useState<'voice' | 'photo' | 'text'>('voice');

  const recentCaptures = [
    {
      id: '1',
      type: 'voice',
      content: 'Remember to call John about the project',
      time: '2 min ago',
    },
    { id: '2', type: 'photo', content: 'Screenshot of design mockup', time: '15 min ago' },
    { id: '3', type: 'voice', content: 'Meeting notes from standup', time: '1 hour ago' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Capture</Text>
      </View>

      <View style={styles.captureTypes}>
        {(['voice', 'photo', 'text'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeButton, captureType === type && styles.typeButtonActive]}
            onPress={() => setCaptureType(type)}
          >
            <Ionicons
              name={type === 'voice' ? 'mic' : type === 'photo' ? 'camera' : 'create'}
              size={24}
              color={captureType === type ? '#FFF' : '#007AFF'}
            />
            <Text style={[styles.typeText, captureType === type && styles.typeTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.captureArea}>
        <TouchableOpacity
          style={[styles.captureButton, isRecording && styles.captureButtonActive]}
          onPress={() => setIsRecording(!isRecording)}
        >
          <Ionicons
            name={
              captureType === 'voice'
                ? isRecording
                  ? 'stop'
                  : 'mic'
                : captureType === 'photo'
                  ? 'camera'
                  : 'create'
            }
            size={48}
            color="#FFF"
          />
        </TouchableOpacity>
        <Text style={styles.captureHint}>
          {captureType === 'voice'
            ? isRecording
              ? 'Tap to stop'
              : 'Tap to record'
            : captureType === 'photo'
              ? 'Tap to capture'
              : 'Tap to write'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Recent Captures</Text>
        {recentCaptures.map(capture => (
          <TouchableOpacity key={capture.id} style={styles.captureCard}>
            <View style={styles.captureIcon}>
              <Ionicons
                name={
                  capture.type === 'voice'
                    ? 'mic'
                    : capture.type === 'photo'
                      ? 'image'
                      : 'document-text'
                }
                size={20}
                color="#007AFF"
              />
            </View>
            <View style={styles.captureInfo}>
              <Text style={styles.captureContent} numberOfLines={1}>
                {capture.content}
              </Text>
              <Text style={styles.captureTime}>{capture.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
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
  captureTypes: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
  },
  typeButtonActive: { backgroundColor: '#007AFF' },
  typeText: { fontSize: 12, color: '#007AFF', marginTop: 4 },
  typeTextActive: { color: '#FFF' },
  captureArea: { backgroundColor: '#FFF', padding: 48, alignItems: 'center', marginBottom: 16 },
  captureButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonActive: { backgroundColor: '#FF3B30' },
  captureHint: { fontSize: 14, color: '#666', marginTop: 16 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  captureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  captureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  captureInfo: { flex: 1 },
  captureContent: { fontSize: 14, color: '#1A1A1A' },
  captureTime: { fontSize: 12, color: '#666', marginTop: 2 },
});

export default QuickCaptureScreen;
