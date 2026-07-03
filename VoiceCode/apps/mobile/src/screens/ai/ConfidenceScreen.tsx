import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfidenceWord {
  id: string;
  word: string;
  confidence: number;
  position: number;
}

interface ConfidenceScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const LOW_CONFIDENCE_WORDS: ConfidenceWord[] = [
  { id: '1', word: 'asynchronous', confidence: 0.42, position: 128 },
  { id: '2', word: 'idempotent', confidence: 0.51, position: 340 },
  { id: '3', word: 'kubernetes', confidence: 0.58, position: 512 },
];

const AVERAGE_CONFIDENCE = 0.87;

const ConfidenceScreen: React.FC<ConfidenceScreenProps> = ({ navigation, route }) => {
  const { transcriptId } = route.params;
  const [threshold, setThreshold] = useState(0.6);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correction, setCorrection] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const visibleWords = LOW_CONFIDENCE_WORDS.filter((w) => w.confidence < threshold);

  return (
    <ScrollView style={styles.container} testID="confidence-screen">
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Average confidence</Text>
        <Text style={styles.summaryValue} testID="average-confidence">
          {Math.round(AVERAGE_CONFIDENCE * 100)}%
        </Text>
      </View>

      <View style={styles.chart} testID="confidence-chart">
        {[0.9, 0.75, 0.5, 0.82, 0.68, 0.95].map((v, i) => (
          <View key={i} style={[styles.bar, { height: 8 + v * 80 }]} />
        ))}
      </View>

      <View style={styles.thresholdRow}>
        <Text style={styles.thresholdLabel}>Threshold {Math.round(threshold * 100)}%</Text>
        <View
          style={styles.slider}
          {...({ testID: 'threshold-slider', onValueChange: (v: number) => setThreshold(v) } as unknown as ViewProps)}
        >
          <View style={[styles.sliderFill, { width: `${threshold * 100}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Low confidence words</Text>
      <View style={styles.list} testID="low-confidence-list">
        {visibleWords.map((w) => (
          <View key={w.id} style={styles.wordRow}>
            <TouchableOpacity
              style={styles.wordBody}
              onPress={() => navigation.navigate('TranscriptDetail', { transcriptId, position: w.position })}
              testID={`low-confidence-word-${w.id}`}
            >
              <Text style={styles.word}>{w.word}</Text>
              <Text style={styles.wordMeta}>{Math.round(w.confidence * 100)}% confident</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCorrectingId(w.id)} testID={`correct-word-${w.id}`}>
              <Ionicons name="create-outline" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {correctingId ? (
        <View style={styles.correction}>
          <TextInput
            style={styles.correctionInput}
            testID="correction-input"
            value={correction}
            onChangeText={setCorrection}
            placeholder="Corrected word"
          />
        </View>
      ) : null}

      <TouchableOpacity style={styles.exportButton} onPress={() => setStatus('Report exported')} testID="export-report">
        <Ionicons name="download-outline" size={18} color="#fff" />
        <Text style={styles.exportText}>Export report</Text>
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  summary: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff' },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 40, fontWeight: '700', color: '#22c55e', marginTop: 4 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  bar: { width: 28, backgroundColor: '#667eea', borderRadius: 4 },
  thresholdRow: { padding: 16, backgroundColor: '#fff', marginTop: 12 },
  thresholdLabel: { fontSize: 14, color: '#1a1a2e', marginBottom: 8 },
  slider: { height: 8, borderRadius: 4, backgroundColor: '#e5e5ea', overflow: 'hidden' },
  sliderFill: { height: 8, backgroundColor: '#667eea' },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  list: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  wordBody: { flex: 1 },
  word: { fontSize: 16, color: '#1a1a2e' },
  wordMeta: { fontSize: 12, color: '#e5484d', marginTop: 2 },
  correction: { backgroundColor: '#fff', padding: 16 },
  correctionInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exportText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  status: { textAlign: 'center', color: '#667eea', paddingBottom: 16 },
});

export default ConfidenceScreen;
