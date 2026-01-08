import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TranscriptDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Meeting Notes</Text>
          <Text style={styles.meta}>January 4, 2026 • 5:23</Text>
        </View>

        <View style={styles.transcriptionBox}>
          <Text style={styles.transcriptionText}>
            This is a sample transcription. The actual transcription content will appear here after processing your audio recording.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="copy-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#667eea" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            <Text style={[styles.actionText, { color: '#e74c3c' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1 },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  meta: { fontSize: 14, color: '#999' },
  transcriptionBox: { padding: 24 },
  transcriptionText: { fontSize: 16, color: '#333', lineHeight: 24 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 24, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 12, color: '#667eea', marginTop: 4 },
});

export default TranscriptDetailScreen;

