import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface KeyPoint {
  id: number;
  text: string;
  importance: 'high' | 'medium' | 'low';
}

const INITIAL: KeyPoint[] = [
  { id: 1, text: 'Launch date confirmed for the end of the quarter.', importance: 'high' },
  { id: 2, text: 'Marketing budget increased by fifteen percent.', importance: 'medium' },
  { id: 3, text: 'Follow-up review scheduled with the design team.', importance: 'low' },
];

interface KeyPointsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const KeyPointsScreen: React.FC<KeyPointsScreenProps> = ({ navigation, route }) => {
  const { transcriptId } = route.params;

  const [keyPoints] = useState<KeyPoint[]>(INITIAL);
  const [message, setMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const copyAll = async () => {
    await Clipboard.setStringAsync(keyPoints.map((k) => `• ${k.text}`).join('\n'));
    setMessage('Copied to clipboard');
  };

  const shareAll = () => {
    Share.share({ message: keyPoints.map((k) => `• ${k.text}`).join('\n') }).catch(() => undefined);
  };

  const regenerate = () => setGenerating(true);

  return (
    <ScrollView style={styles.container} testID="key-points-screen">
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={copyAll} testID="copy-key-points">
          <Ionicons name="copy-outline" size={20} color="#667eea" />
          <Text style={styles.toolLabel}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={shareAll} testID="share-key-points">
          <Ionicons name="share-social-outline" size={20} color="#667eea" />
          <Text style={styles.toolLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={regenerate} testID="regenerate">
          <Ionicons name="refresh-outline" size={20} color="#667eea" />
          <Text style={styles.toolLabel}>Regenerate</Text>
        </TouchableOpacity>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      {generating ? <Text style={styles.message}>Generating key points…</Text> : null}

      <View style={styles.list} testID="key-points-list">
        {keyPoints.map((point) => (
          <TouchableOpacity
            key={point.id}
            style={styles.row}
            onPress={() => navigation.navigate('TranscriptDetail', { transcriptId, keyPointId: point.id })}
            testID={`key-point-${point.id}`}
          >
            <View
              style={[styles.importance, { backgroundColor: importanceColor(point.importance) }]}
              testID={`importance-indicator-${point.id}`}
            />
            <Text style={styles.pointText}>{point.text}</Text>
            <Ionicons name="chevron-forward" size={18} color="#bbb" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const importanceColor = (importance: KeyPoint['importance']): string => {
  switch (importance) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    default:
      return '#10b981';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 12 },
  toolButton: { alignItems: 'center' },
  toolLabel: { fontSize: 12, color: '#555', marginTop: 4 },
  message: { textAlign: 'center', color: '#667eea', paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  importance: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  pointText: { flex: 1, fontSize: 15, color: '#1a1a2e', lineHeight: 21 },
});

export default KeyPointsScreen;
