import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Shortcut {
  id: string;
  action: string;
  keys: string[];
  category: string;
  isCustom: boolean;
}

interface KeyboardShortcutsScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
}

const KeyboardShortcutsScreen: React.FC<KeyboardShortcutsScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedShortcut, setSelectedShortcut] = useState<Shortcut | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleReset = () => setStatusMessage('Shortcuts reset to defaults');

  const handleSaveShortcut = () => {
    setStatusMessage('Shortcut saved');
    setSelectedShortcut(null);
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'recording', label: 'Recording' },
    { id: 'playback', label: 'Playback' },
    { id: 'editing', label: 'Editing' },
    { id: 'navigation', label: 'Navigation' },
  ];

  const shortcuts: Shortcut[] = [
    {
      id: '1',
      action: 'Start/Stop Recording',
      keys: ['⌘', 'R'],
      category: 'recording',
      isCustom: false,
    },
    {
      id: '2',
      action: 'Pause Recording',
      keys: ['⌘', 'P'],
      category: 'recording',
      isCustom: false,
    },
    { id: '3', action: 'Add Bookmark', keys: ['⌘', 'B'], category: 'recording', isCustom: false },
    { id: '4', action: 'Play/Pause', keys: ['Space'], category: 'playback', isCustom: false },
    { id: '5', action: 'Skip Forward 10s', keys: ['→'], category: 'playback', isCustom: false },
    { id: '6', action: 'Skip Back 10s', keys: ['←'], category: 'playback', isCustom: false },
    { id: '7', action: 'Increase Speed', keys: ['⌘', '↑'], category: 'playback', isCustom: false },
    { id: '8', action: 'Decrease Speed', keys: ['⌘', '↓'], category: 'playback', isCustom: false },
    { id: '9', action: 'Undo', keys: ['⌘', 'Z'], category: 'editing', isCustom: false },
    { id: '10', action: 'Redo', keys: ['⌘', '⇧', 'Z'], category: 'editing', isCustom: false },
    { id: '11', action: 'Cut Selection', keys: ['⌘', 'X'], category: 'editing', isCustom: false },
    { id: '12', action: 'Copy Selection', keys: ['⌘', 'C'], category: 'editing', isCustom: false },
    { id: '13', action: 'Go to Home', keys: ['⌘', 'H'], category: 'navigation', isCustom: false },
    { id: '14', action: 'Open Search', keys: ['⌘', 'F'], category: 'navigation', isCustom: false },
    { id: '15', action: 'Quick Export', keys: ['⌘', 'E'], category: 'navigation', isCustom: true },
  ];

  const filteredShortcuts = shortcuts.filter(
    s =>
      (selectedCategory === 'all' || s.category === selectedCategory) &&
      (searchQuery === '' || s.action.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedShortcuts = filteredShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>
  );

  const getCategoryLabel = (cat: string): string => {
    return categories.find(c => c.id === cat)?.label || cat;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen} testID="keyboard-shortcuts-screen">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Keyboard Shortcuts</Text>
        <TouchableOpacity
          style={styles.resetButton}
          testID="reset-shortcuts"
          onPress={handleReset}
        >
          <Text style={styles.resetText}>Restore</Text>
        </TouchableOpacity>
      </View>

      {statusMessage !== '' && (
        <Text style={styles.statusMessage} testID="status-message">
          {statusMessage}
        </Text>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            testID="search-input"
            placeholder="Search shortcuts..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        testID="shortcuts-list"
        showsVerticalScrollIndicator={false}
      >
        <View testID={searchQuery !== '' ? 'search-results' : undefined}>
        {selectedCategory === 'all' ? (
          Object.entries(groupedShortcuts).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{getCategoryLabel(category)}</Text>
              <View style={styles.shortcutsCard}>
                {items.map((shortcut, idx) => (
                  <View key={shortcut.id}>
                    <TouchableOpacity
                      style={styles.shortcutRow}
                      testID={`shortcut-${shortcut.id}`}
                      onPress={() => setSelectedShortcut(shortcut)}
                    >
                      <View style={styles.shortcutInfo}>
                        <Text style={styles.shortcutAction}>{shortcut.action}</Text>
                        {shortcut.isCustom && (
                          <View style={styles.customBadge}>
                            <Text style={styles.customText}>Custom</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.keysContainer}>
                        {shortcut.keys.map((key, keyIdx) => (
                          <View key={keyIdx} style={styles.keyBadge}>
                            <Text style={styles.keyText}>{key}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                    {idx < items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.section}>
            <View style={styles.shortcutsCard}>
              {filteredShortcuts.map((shortcut, idx) => (
                <View key={shortcut.id}>
                  <TouchableOpacity style={styles.shortcutRow}>
                    <View style={styles.shortcutInfo}>
                      <Text style={styles.shortcutAction}>{shortcut.action}</Text>
                      {shortcut.isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customText}>Custom</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.keysContainer}>
                      {shortcut.keys.map((key, keyIdx) => (
                        <View key={keyIdx} style={styles.keyBadge}>
                          <Text style={styles.keyText}>{key}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                  {idx < filteredShortcuts.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}
        </View>

        {selectedShortcut && (
          <View style={styles.modalOverlay} testID="customize-shortcut-modal">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Customize {selectedShortcut.action}</Text>
              <Text style={styles.modalSubtitle}>Current: {selectedShortcut.keys.join(' ')}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setSelectedShortcut(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  testID="save-shortcut"
                  onPress={handleSaveShortcut}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addText}>Add Custom Shortcut</Text>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={20} color="#FF9500" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipText}>
              Connect a Bluetooth keyboard to use these shortcuts on your mobile device.
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  resetButton: { padding: 4 },
  resetText: { fontSize: 17, color: '#007AFF' },
  statusMessage: {
    backgroundColor: '#34C75915',
    color: '#248A3D',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
  },
  modalCard: {},
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  modalCancelButton: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  modalCancelText: { fontSize: 15, color: '#8E8E93' },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  modalSaveText: { fontSize: 15, color: '#FFF', fontWeight: '600' },
  searchContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 8 },
  categoryBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryScroll: { paddingHorizontal: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#007AFF' },
  categoryText: { fontSize: 14, color: '#8E8E93' },
  categoryTextActive: { color: '#FFF', fontWeight: '500' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shortcutsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  shortcutRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  shortcutInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  shortcutAction: { fontSize: 15, color: '#1C1C1E' },
  customBadge: {
    backgroundColor: '#FF950020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  customText: { fontSize: 10, fontWeight: '600', color: '#FF9500' },
  keysContainer: { flexDirection: 'row' },
  keyBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  keyText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addText: { fontSize: 15, color: '#007AFF', marginLeft: 8 },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FF950015',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  tipContent: { flex: 1, marginLeft: 12 },
  tipTitle: { fontSize: 14, fontWeight: '600', color: '#FF9500' },
  tipText: { fontSize: 13, color: '#8E8E93', marginTop: 4, lineHeight: 18 },
  bottomPadding: { height: 40 },
});

export default KeyboardShortcutsScreen;
