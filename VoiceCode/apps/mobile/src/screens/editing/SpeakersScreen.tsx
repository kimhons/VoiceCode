import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SpeakersScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params?: { transcriptId?: string } };
}

interface Speaker {
  id: string;
  name: string;
  color: string;
  speakingTime: string;
  words: number;
}

const SWATCHES = ['#667eea', '#34C759', '#FF9500', '#FF2D55', '#5856D6', '#00C7BE'];

const SpeakersScreen: React.FC<SpeakersScreenProps> = ({ navigation }) => {
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: '1', name: 'Speaker 1', color: '#667eea', speakingTime: '4:12', words: 620 },
    { id: '2', name: 'Speaker 2', color: '#34C759', speakingTime: '2:48', words: 410 },
  ]);
  const [selectedId, setSelectedId] = useState('1');
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [choosingColor, setChoosingColor] = useState(false);
  const [merging, setMerging] = useState(false);

  const selected = speakers.find((s) => s.id === selectedId) ?? speakers[0];

  const selectSpeaker = (speaker: Speaker) => {
    setSelectedId(speaker.id);
    setRenaming(false);
    setChoosingColor(false);
    setMerging(false);
    navigation.navigate('SpeakerDetail', { speakerId: speaker.id });
  };

  const startRename = () => {
    setNameDraft(selected.name);
    setRenaming(true);
  };

  const saveName = () => {
    setSpeakers((prev) => prev.map((s) => (s.id === selectedId ? { ...s, name: nameDraft } : s)));
    setRenaming(false);
  };

  const applyColor = (color: string) => {
    setSpeakers((prev) => prev.map((s) => (s.id === selectedId ? { ...s, color } : s)));
    setChoosingColor(false);
  };

  const mergeInto = (targetId: string) => {
    setSpeakers((prev) => prev.filter((s) => s.id !== selectedId || s.id === targetId));
    setSelectedId(targetId);
    setMerging(false);
  };

  return (
    <ScrollView style={styles.container} testID="speakers-screen">
      <View style={styles.section} testID="speaker-list">
        {speakers.map((speaker) => (
          <TouchableOpacity
            key={speaker.id}
            style={[styles.row, selectedId === speaker.id && styles.rowSelected]}
            testID={`speaker-${speaker.id}`}
            onPress={() => selectSpeaker(speaker)}
          >
            <View style={[styles.dot, { backgroundColor: speaker.color }]} />
            <Text style={styles.rowLabel}>{speaker.name}</Text>
            {selectedId === speaker.id ? (
              <Ionicons name="chevron-forward" size={18} color="#bbb" />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Speaking Time</Text>
          <Text style={styles.statValue}>{selected.speakingTime}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Words</Text>
          <Text style={styles.statValue}>{selected.words.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} testID="rename-speaker" onPress={startRename}>
          <Ionicons name="create-outline" size={20} color="#667eea" />
          <Text style={styles.toolText}>Rename</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolButton}
          testID="change-color"
          onPress={() => setChoosingColor(true)}
        >
          <Ionicons name="color-palette-outline" size={20} color="#667eea" />
          <Text style={styles.toolText}>Color</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolButton}
          testID="merge-speaker"
          onPress={() => setMerging(true)}
        >
          <Ionicons name="git-merge-outline" size={20} color="#667eea" />
          <Text style={styles.toolText}>Merge</Text>
        </TouchableOpacity>
      </View>

      {renaming ? (
        <View style={styles.panel}>
          <TextInput
            style={styles.input}
            testID="speaker-name-input"
            value={nameDraft}
            onChangeText={setNameDraft}
          />
          <TouchableOpacity style={styles.saveButton} testID="save-name" onPress={saveName}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {choosingColor ? (
        <View style={styles.panel} testID="color-picker">
          <View style={styles.swatchRow}>
            {SWATCHES.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.swatch, { backgroundColor: color }]}
                onPress={() => applyColor(color)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {merging ? (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Merge into:</Text>
          {speakers
            .filter((s) => s.id !== selectedId)
            .map((target) => (
              <TouchableOpacity
                key={target.id}
                style={styles.targetRow}
                testID={`speaker-${target.id}-target`}
                onPress={() => setMerging(true)}
              >
                <View style={[styles.dot, { backgroundColor: target.color }]} />
                <Text style={styles.rowLabel}>{target.name}</Text>
              </TouchableOpacity>
            ))}
          <TouchableOpacity
            style={styles.saveButton}
            testID="confirm-merge"
            onPress={() => mergeInto(speakers.filter((s) => s.id !== selectedId)[0].id)}
          >
            <Text style={styles.saveText}>Confirm Merge</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowSelected: { backgroundColor: '#f0f2ff' },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  statItem: { flex: 1 },
  statLabel: { fontSize: 13, color: '#8E8E93' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginTop: 4 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 12,
  },
  toolButton: { alignItems: 'center' },
  toolText: { fontSize: 12, color: '#667eea', marginTop: 4 },
  panel: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  panelLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 12 },
  input: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a2e',
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap' },
  swatch: { width: 40, height: 40, borderRadius: 20, marginRight: 12, marginBottom: 12 },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
});

export default SpeakersScreen;
