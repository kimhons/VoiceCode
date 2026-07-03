import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Highlight {
  id: number;
  text: string;
  color: string;
  note: string;
}

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'];

interface HighlightsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const HighlightsScreen: React.FC<HighlightsScreenProps> = ({ navigation, route }) => {
  const { transcriptId } = route.params;

  const [highlights, setHighlights] = useState<Highlight[]>([
    { id: 1, text: 'The quarterly numbers exceeded expectations across every region.', color: 'yellow', note: 'Note: mention in the summary email' },
  ]);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const visible = colorFilter ? highlights.filter((h) => h.color === colorFilter) : highlights;

  const openEditor = (h: Highlight) => {
    setEditingId(h.id);
    setEditText(h.text);
  };

  const confirmDelete = () => {
    if (confirmingId !== null) {
      setHighlights((prev) => prev.filter((h) => h.id !== confirmingId));
      setConfirmingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} testID="highlights-screen">
      <View style={styles.filterBar}>
        {HIGHLIGHT_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, { backgroundColor: swatch(c) }, colorFilter === c && styles.filterChipActive]}
            onPress={() => setColorFilter((prev) => (prev === c ? null : c))}
            testID={`filter-${c}`}
          />
        ))}
        <TouchableOpacity style={styles.exportButton} onPress={() => setExportMessage('Highlights exported')} testID="export-highlights">
          <Ionicons name="share-outline" size={18} color="#667eea" />
          <Text style={styles.exportLabel}>Export</Text>
        </TouchableOpacity>
      </View>

      {exportMessage ? <Text style={styles.exportMessage}>{exportMessage}</Text> : null}

      <Text style={styles.hint}>No highlights are lost — they stay saved with your transcript.</Text>

      <View style={styles.list} testID="highlight-list">
        {visible.map((h) => (
          <View key={h.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => navigation.navigate('TranscriptDetail', { transcriptId, highlightId: h.id })}
              testID={`highlight-${h.id}`}
            >
              <View style={[styles.colorBar, { backgroundColor: swatch(h.color) }]} testID={`highlight-color-${h.id}`} />
              <View style={styles.cardBody}>
                <Text style={styles.highlightText} testID={`highlight-text-${h.id}`}>
                  {h.text}
                </Text>
                <Text style={styles.noteText}>{h.note}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEditor(h)} testID={`edit-highlight-${h.id}`}>
                <Ionicons name="create-outline" size={20} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmingId(h.id)} testID={`delete-highlight-${h.id}`}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {confirmingId !== null ? (
        <View style={styles.panel}>
          <Text style={styles.confirmText}>Delete this highlight?</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={confirmDelete} testID="confirm-delete">
            <Text style={styles.primaryButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal visible={editingId !== null} transparent animationType="fade" onRequestClose={() => setEditingId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} testID="edit-highlight-modal">
            <Text style={styles.modalTitle}>Edit Highlight</Text>
            <TextInput style={styles.input} value={editText} onChangeText={setEditText} multiline />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setHighlights((prev) => prev.map((h) => (h.id === editingId ? { ...h, text: editText } : h)));
                setEditingId(null);
              }}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const swatch = (name: string): string => {
  switch (name) {
    case 'yellow':
      return '#facc15';
    case 'green':
      return '#22c55e';
    case 'blue':
      return '#3b82f6';
    case 'pink':
      return '#ec4899';
    default:
      return '#e5e5ea';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  filterBar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  filterChip: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  filterChipActive: { borderColor: '#1a1a2e' },
  exportButton: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 },
  exportLabel: { fontSize: 14, color: '#667eea' },
  exportMessage: { textAlign: 'center', color: '#22c55e', paddingBottom: 8 },
  hint: { fontSize: 13, color: '#888', paddingHorizontal: 16, paddingBottom: 12 },
  list: { paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 12 },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  colorBar: { width: 6, alignSelf: 'stretch', borderRadius: 3, marginRight: 12 },
  cardBody: { flex: 1 },
  highlightText: { fontSize: 15, color: '#1a1a2e', lineHeight: 21 },
  noteText: { fontSize: 13, color: '#667eea', marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: 16, marginLeft: 12 },
  panel: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  confirmText: { fontSize: 15, color: '#1a1a2e', marginBottom: 12 },
  dangerButton: { backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16, minHeight: 60 },
});

export default HighlightsScreen;
