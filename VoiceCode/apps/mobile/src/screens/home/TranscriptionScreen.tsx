import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const TranscriptionScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Transcription Result</Text>
        <View style={styles.transcriptionBox}>
          <Text style={styles.transcriptionText}>
            Your transcription will appear here...
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  transcriptionBox: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 16, minHeight: 200 },
  transcriptionText: { fontSize: 16, color: '#666', lineHeight: 24 },
});

export default TranscriptionScreen;

