import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SortScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

type SortKey = 'Date' | 'Title' | 'Duration' | 'Size';
type Direction = 'ascending' | 'descending';

const SORT_KEYS: { key: SortKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Date', icon: 'calendar-outline' },
  { key: 'Title', icon: 'text-outline' },
  { key: 'Duration', icon: 'time-outline' },
  { key: 'Size', icon: 'save-outline' },
];

const SortScreen: React.FC<SortScreenProps> = ({ navigation }) => {
  const [sortBy, setSortBy] = useState<SortKey>('Date');
  const [direction, setDirection] = useState<Direction>('descending');

  return (
    <ScrollView style={styles.container} testID="sort-screen">
      <Text style={styles.heading}>Sort By</Text>

      <View style={styles.section} testID="sort-options">
        {SORT_KEYS.map(({ key, icon }) => {
          const selected = sortBy === key;
          return (
            <TouchableOpacity key={key} style={styles.row} onPress={() => setSortBy(key)}>
              <Ionicons name={icon} size={20} color="#667eea" style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{key}</Text>
              {selected ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color="#667eea"
                  testID="selected-indicator"
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.heading}>Direction</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          testID="direction-ascending"
          onPress={() => setDirection('ascending')}
        >
          <Ionicons name="arrow-up-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Ascending</Text>
          {direction === 'ascending' ? (
            <Ionicons name="checkmark" size={20} color="#667eea" />
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          testID="direction-descending"
          onPress={() => setDirection('descending')}
        >
          <Ionicons name="arrow-down-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Descending</Text>
          {direction === 'descending' ? (
            <Ionicons name="checkmark" size={20} color="#667eea" />
          ) : null}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.applyButton} testID="apply-sort" onPress={() => navigation.goBack()}>
        <Text style={styles.applyText}>Apply</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: '#fff',
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
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  applyButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
  },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default SortScreen;
