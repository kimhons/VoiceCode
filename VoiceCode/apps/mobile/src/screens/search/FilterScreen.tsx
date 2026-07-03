import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  type ViewProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const PRESETS = ['Today', 'Last 7 days', 'Last 30 days'];
const TAGS: { key: string; label: string }[] = [
  { key: 'work', label: 'Work' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'personal', label: 'Personal' },
];
const FOLDERS = ['Inbox', 'Projects', 'Archive'];

const FilterScreen: React.FC<FilterScreenProps> = ({ navigation }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [preset, setPreset] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFolders, setShowFolders] = useState(false);
  const [folder, setFolder] = useState<string | null>(null);
  const [duration, setDuration] = useState<[number, number]>([0, 120]);
  const [presetSaved, setPresetSaved] = useState<string | null>(null);

  const toggleTag = (key: string) => {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setPreset(null);
    setSelectedTags([]);
    setFolder(null);
    setDuration([0, 120]);
    setPresetSaved(null);
  };

  const applyFilters = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} testID="filter-screen">
      <Text style={styles.heading}>Filters</Text>

      <Text style={styles.sectionTitle}>Date</Text>
      <TouchableOpacity style={styles.row} onPress={() => setShowDatePicker(true)} testID="date-range-picker">
        <Ionicons name="calendar-outline" size={20} color="#667eea" style={styles.rowIcon} />
        <Text style={styles.rowLabel}>Custom range</Text>
      </TouchableOpacity>
      {showDatePicker ? (
        <View style={styles.datePicker} testID="date-picker">
          <Text style={styles.datePickerText}>Pick a start and end date</Text>
        </View>
      ) : null}
      <View style={styles.chipRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, preset === p && styles.chipActive]}
            onPress={() => setPreset(p)}
          >
            <Text style={[styles.chipText, preset === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Tags</Text>
      <View style={styles.chipRow}>
        {TAGS.map((t) => {
          const active = selectedTags.includes(t.key);
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleTag(t.key)}
              testID={`tag-${t.key}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Folder</Text>
      <TouchableOpacity style={styles.row} onPress={() => setShowFolders(true)} testID="folder-selector">
        <Ionicons name="folder-outline" size={20} color="#667eea" style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{folder ?? 'All folders'}</Text>
      </TouchableOpacity>
      {showFolders ? (
        <View style={styles.folderList}>
          {FOLDERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={styles.folderItem}
              onPress={() => {
                setFolder(f);
                setShowFolders(false);
              }}
            >
              <Text style={styles.folderText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Duration (minutes)</Text>
      {/* onValueChange isn't part of ViewProps; cast through unknown so the range
          handler lives on the host element the slider gesture reports to. */}
      <View {...({ style: styles.slider, testID: 'duration-slider', onValueChange: (range: [number, number]) => setDuration(range) } as unknown as ViewProps)}>
        <Text style={styles.sliderText}>
          {duration[0]}–{duration[1]} min
        </Text>
      </View>

      {presetSaved ? <Text style={styles.savedText}>{presetSaved}</Text> : null}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setPresetSaved('Preset saved')}
        testID="save-preset"
      >
        <Text style={styles.secondaryButtonText}>Save as preset</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={clearFilters} testID="clear-filters">
        <Text style={styles.linkButtonText}>Clear all</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={applyFilters} testID="apply-filters">
        <Text style={styles.primaryButtonText}>Apply filters</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  heading: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 16, color: '#1a1a2e' },
  datePicker: { backgroundColor: '#fff', padding: 16 },
  datePickerText: { color: '#555' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  chip: {
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
  },
  chipActive: { backgroundColor: '#667eea' },
  chipText: { color: '#667eea', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  folderList: { backgroundColor: '#fff' },
  folderItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  folderText: { fontSize: 16, color: '#1a1a2e' },
  slider: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 20 },
  sliderText: { fontSize: 16, color: '#1a1a2e' },
  savedText: { textAlign: 'center', color: '#22c55e', paddingTop: 12, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#667eea',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#667eea', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkButtonText: { color: '#ef4444', fontSize: 15 },
  primaryButton: {
    backgroundColor: '#667eea',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FilterScreen;
