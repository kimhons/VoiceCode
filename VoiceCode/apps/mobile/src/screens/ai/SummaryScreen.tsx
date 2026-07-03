import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

interface SummaryScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params?: { transcriptId?: string } };
}

type SummaryType = 'Brief' | 'Detailed' | 'Bullets';

const SUMMARIES: Record<SummaryType, string> = {
  Brief: 'The team aligned on the Q3 roadmap and agreed to prioritize the mobile release.',
  Detailed:
    'The team reviewed the current quarter progress, discussed blockers on the mobile release, and aligned on prioritizing shipping the collaboration features before the marketing push.',
  Bullets: '- Aligned on Q3 roadmap\n- Prioritized mobile release\n- Assigned follow-up owners',
};

const SummaryScreen: React.FC<SummaryScreenProps> = () => {
  const [type, setType] = useState<SummaryType>('Brief');
  const [summary, setSummary] = useState(SUMMARIES.Brief);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);

  const selectType = (next: SummaryType) => {
    setType(next);
    setSummary(SUMMARIES[next]);
  };

  const copy = () => {
    Clipboard.setStringAsync(summary).catch(() => undefined);
    setCopied(true);
  };

  const share = () => {
    Share.share({ message: summary }).catch(() => undefined);
  };

  const regenerate = () => {
    setGenerating(true);
  };

  return (
    <ScrollView style={styles.container} testID="summary-screen">
      <View style={styles.typeRow}>
        {(['Brief', 'Detailed', 'Bullets'] as SummaryType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeChip, type === t && styles.typeChipActive]}
            onPress={() => selectType(t)}
          >
            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        {editing ? (
          <TextInput
            style={styles.editor}
            testID="summary-editor"
            multiline
            value={summary}
            onChangeText={setSummary}
          />
        ) : (
          <Text style={styles.summaryBody} testID="summary-text">
            {summary}
          </Text>
        )}
        {generating ? <Text style={styles.generatingMsg}>Generating summary…</Text> : null}
        {copied ? <Text style={styles.copiedMsg}>Copied to clipboard</Text> : null}
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton} testID="copy-summary" onPress={copy}>
          <Ionicons name="copy-outline" size={20} color="#667eea" />
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} testID="share-summary" onPress={share}>
          <Ionicons name="share-social-outline" size={20} color="#667eea" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} testID="regenerate" onPress={regenerate}>
          <Ionicons name="refresh-outline" size={20} color="#667eea" />
          <Text style={styles.actionText}>Regenerate</Text>
        </TouchableOpacity>
      </View>

      {editing ? (
        <TouchableOpacity
          style={styles.saveButton}
          testID="save-summary"
          onPress={() => setEditing(false)}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.editButton}
          testID="edit-summary"
          onPress={() => setEditing(true)}
        >
          <Ionicons name="create-outline" size={18} color="#667eea" />
          <Text style={styles.editText}>Edit Summary</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  typeRow: { flexDirection: 'row', padding: 16 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  typeChipActive: { backgroundColor: '#667eea' },
  typeText: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  typeTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    minHeight: 120,
  },
  summaryBody: { fontSize: 16, lineHeight: 24, color: '#1a1a2e' },
  editor: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a2e',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generatingMsg: { color: '#667eea', marginTop: 12 },
  copiedMsg: { color: '#34C759', marginTop: 12 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 12, color: '#667eea', marginTop: 4 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef0ff',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 16,
  },
  editText: { color: '#667eea', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default SummaryScreen;
