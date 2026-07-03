import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface BatchItem {
  id: string;
  name: string;
  duration: string;
  size: string;
  selected: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const BatchProcessingScreen: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState('transcribe');
  const [selectAll, setSelectAll] = useState(false);

  const [items, setItems] = useState<BatchItem[]>([
    {
      id: '1',
      name: 'Team Meeting Recording',
      duration: '45:23',
      size: '128 MB',
      selected: true,
      status: 'pending',
    },
    {
      id: '2',
      name: 'Client Call',
      duration: '32:10',
      size: '92 MB',
      selected: true,
      status: 'pending',
    },
    {
      id: '3',
      name: 'Weekly Standup',
      duration: '15:45',
      size: '45 MB',
      selected: false,
      status: 'pending',
    },
    {
      id: '4',
      name: 'Interview Recording',
      duration: '58:30',
      size: '167 MB',
      selected: true,
      status: 'pending',
    },
    {
      id: '5',
      name: 'Product Demo',
      duration: '28:15',
      size: '81 MB',
      selected: false,
      status: 'pending',
    },
  ]);

  const actions = [
    { id: 'transcribe', name: 'Transcribe', icon: 'text', color: '#007AFF' },
    { id: 'enhance', name: 'Enhance Audio', icon: 'sparkles', color: '#FF9500' },
    { id: 'export', name: 'Export', icon: 'share', color: '#34C759' },
    { id: 'delete', name: 'Delete', icon: 'trash', color: '#FF3B30' },
  ];

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleSelectAll = () => {
    setSelectAll(!selectAll);
    setItems(prev => prev.map(item => ({ ...item, selected: !selectAll })));
  };

  const selectedCount = items.filter(i => i.selected).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Batch Processing</Text>
        <TouchableOpacity style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsScroll}
        >
          {actions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                selectedAction === action.id && styles.actionButtonActive,
              ]}
              onPress={() => setSelectedAction(action.id)}
            >
              <Ionicons
                name={action.icon as any}
                size={20}
                color={selectedAction === action.id ? '#FFF' : action.color}
              />
              <Text
                style={[styles.actionText, selectedAction === action.id && styles.actionTextActive]}
              >
                {action.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.selectBar}>
        <TouchableOpacity style={styles.selectAllRow} onPress={toggleSelectAll}>
          <Ionicons
            name={selectAll ? 'checkbox' : 'square-outline'}
            size={22}
            color={selectAll ? '#007AFF' : '#C7C7CC'}
          />
          <Text style={styles.selectAllText}>Select All</Text>
        </TouchableOpacity>
        <Text style={styles.selectedCount}>{selectedCount} selected</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {items.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => toggleItem(item.id)}
          >
            <Ionicons
              name={item.selected ? 'checkbox' : 'square-outline'}
              size={22}
              color={item.selected ? '#007AFF' : '#C7C7CC'}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemDuration}>{item.duration}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.itemSize}>{item.size}</Text>
              </View>
            </View>
            {item.status === 'processing' && (
              <View style={styles.processingBadge}>
                <Ionicons name="sync" size={14} color="#007AFF" />
              </View>
            )}
            {item.status === 'completed' && (
              <Ionicons name="checkmark-circle" size={22} color="#34C759" />
            )}
            {item.status === 'failed' && <Ionicons name="alert-circle" size={22} color="#FF3B30" />}
          </TouchableOpacity>
        ))}

        <View style={styles.optionsSection}>
          <Text style={styles.optionsTitle}>Options</Text>
          <View style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Overwrite Existing</Text>
              <Switch
                value={false}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Notify When Complete</Text>
              <Switch
                value={true}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerCount}>{selectedCount} files</Text>
          <Text style={styles.footerSize}>
            {items.filter(i => i.selected).reduce((acc, i) => acc + parseInt(i.size), 0)} MB total
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.processButton, selectedCount === 0 && styles.processButtonDisabled]}
          disabled={selectedCount === 0}
        >
          <Text style={styles.processText}>
            {selectedAction === 'transcribe'
              ? 'Transcribe'
              : selectedAction === 'enhance'
                ? 'Enhance'
                : selectedAction === 'export'
                  ? 'Export'
                  : 'Delete'}{' '}
            Selected
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
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
  doneButton: { padding: 4 },
  doneText: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  actionBar: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  actionsScroll: { paddingHorizontal: 16 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    marginRight: 10,
  },
  actionButtonActive: { backgroundColor: '#007AFF' },
  actionText: { fontSize: 14, color: '#1C1C1E', marginLeft: 6 },
  actionTextActive: { color: '#FFF' },
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  selectAllRow: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { fontSize: 15, color: '#1C1C1E', marginLeft: 10 },
  selectedCount: { fontSize: 14, color: '#8E8E93' },
  content: { flex: 1, padding: 16 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemDuration: { fontSize: 13, color: '#8E8E93' },
  metaDot: { fontSize: 13, color: '#C7C7CC', marginHorizontal: 6 },
  itemSize: { fontSize: 13, color: '#8E8E93' },
  processingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsSection: { marginTop: 20 },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  optionLabel: { fontSize: 15, color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  bottomPadding: { height: 100 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerInfo: { flex: 1 },
  footerCount: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  footerSize: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  processButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  processButtonDisabled: { backgroundColor: '#C7C7CC' },
  processText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});

export default BatchProcessingScreen;
