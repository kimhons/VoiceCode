import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ContentCreationScreen: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [contentType, setContentType] = useState<'blog' | 'social' | 'email' | 'script'>('blog');

  const contentTypes = [
    { id: 'blog', label: 'Blog Post', icon: 'document-text' },
    { id: 'social', label: 'Social Media', icon: 'share-social' },
    { id: 'email', label: 'Email', icon: 'mail' },
    { id: 'script', label: 'Script', icon: 'videocam' },
  ];

  const templates = [
    { id: '1', name: 'Product Review', type: 'blog' },
    { id: '2', name: 'How-To Guide', type: 'blog' },
    { id: '3', name: 'Instagram Caption', type: 'social' },
    { id: '4', name: 'Newsletter', type: 'email' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Content Creation</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.typeSection}>
          <Text style={styles.label}>Content Type</Text>
          <View style={styles.typeGrid}>
            {contentTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, contentType === type.id && styles.typeCardActive]}
                onPress={() => setContentType(type.id as typeof contentType)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={contentType === type.id ? '#FFF' : '#007AFF'}
                />
                <Text style={[styles.typeLabel, contentType === type.id && styles.typeLabelActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.voiceSection}>
          <Text style={styles.label}>Voice to Content</Text>
          <View style={styles.voiceCard}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
              onPress={() => setIsRecording(!isRecording)}
            >
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.voiceHint}>
              {isRecording ? 'Recording your ideas...' : 'Speak your content ideas'}
            </Text>
          </View>
        </View>

        <View style={styles.templatesSection}>
          <Text style={styles.label}>Templates</Text>
          {templates
            .filter(t => t.type === contentType || contentType === 'blog')
            .map(template => (
              <TouchableOpacity key={template.id} style={styles.templateCard}>
                <Ionicons name="document" size={20} color="#007AFF" />
                <Text style={styles.templateName}>{template.name}</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
        </View>

        <View style={styles.aiSection}>
          <Text style={styles.label}>AI Assistance</Text>
          <View style={styles.aiOptions}>
            <TouchableOpacity style={styles.aiOption}>
              <Ionicons name="sparkles" size={20} color="#AF52DE" />
              <Text style={styles.aiOptionText}>Generate Outline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiOption}>
              <Ionicons name="color-wand" size={20} color="#AF52DE" />
              <Text style={styles.aiOptionText}>Improve Tone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiOption}>
              <Ionicons name="resize" size={20} color="#AF52DE" />
              <Text style={styles.aiOptionText}>Expand Ideas</Text>
            </TouchableOpacity>
          </View>
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
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  typeSection: { marginBottom: 24 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: '1%',
  },
  typeCardActive: { backgroundColor: '#007AFF' },
  typeLabel: { fontSize: 13, color: '#1A1A1A', marginTop: 8 },
  typeLabelActive: { color: '#FFF' },
  voiceSection: { marginBottom: 24 },
  voiceCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, alignItems: 'center' },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: { backgroundColor: '#FF3B30' },
  voiceHint: { fontSize: 14, color: '#666', marginTop: 16 },
  templatesSection: { marginBottom: 24 },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  templateName: { flex: 1, fontSize: 15, color: '#1A1A1A', marginLeft: 12 },
  aiSection: { marginBottom: 32 },
  aiOptions: { backgroundColor: '#FFF', borderRadius: 12, padding: 8 },
  aiOption: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  aiOptionText: { fontSize: 15, color: '#1A1A1A', marginLeft: 12 },
});

export default ContentCreationScreen;
