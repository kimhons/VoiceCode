import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  assignee: string | null;
  dueDate: string | null;
}

interface ActionItemsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  route: { params: { transcriptId: string } };
}

const INITIAL_ITEMS: ActionItem[] = [
  { id: '1', text: 'Follow up on the pricing proposal', completed: false, assignee: null, dueDate: null },
  { id: '2', text: 'Schedule the design review', completed: false, assignee: 'Priya Patel', dueDate: null },
];

const ASSIGNEES = ['John Doe', 'Priya Patel', 'Marcus Lee'];

const ActionItemsScreen: React.FC<ActionItemsScreenProps> = ({ navigation, route }) => {
  const { transcriptId } = route.params;
  const [items, setItems] = useState<ActionItem[]>(INITIAL_ITEMS);
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'assignee'>('all');
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);
  const [assigningFor, setAssigningFor] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const toggleComplete = (id: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it)));

  const setDueDate = (id: string, dueDate: string | null) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, dueDate } : it)));

  const assign = (id: string, assignee: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, assignee } : it)));
    setAssigningFor(null);
  };

  const visibleItems = items.filter((it) => {
    if (filter === 'incomplete') return !it.completed;
    if (filter === 'assignee') return it.assignee !== null;
    return true;
  });

  return (
    <ScrollView style={styles.container} testID="action-items-screen">
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.chip} onPress={() => setFilter('incomplete')} testID="filter-incomplete">
          <Text style={styles.chipText}>Incomplete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => setFilter('assignee')} testID="filter-assignee">
          <Text style={styles.chipText}>By Assignee</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => setStatus('Exported to task manager')} testID="export-actions">
          <Ionicons name="share-outline" size={16} color="#667eea" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={() => setStatus('Copied to clipboard')} testID="copy-actions">
          <Ionicons name="copy-outline" size={16} color="#667eea" />
        </TouchableOpacity>
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <View style={styles.list} testID="action-items-list">
        {visibleItems.map((item) => (
          <View key={item.id} style={styles.item}>
            <TouchableOpacity onPress={() => toggleComplete(item.id)} testID={`complete-item-${item.id}`}>
              <Ionicons
                name={item.completed ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.completed ? '#22c55e' : '#bbb'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.itemBody}
              onPress={() => navigation.navigate('TranscriptDetail', { transcriptId, itemId: item.id })}
              testID={`action-item-${item.id}`}
            >
              <Text style={[styles.itemText, item.completed && styles.completedText]}>{item.text}</Text>
              {item.assignee ? <Text style={styles.meta}>Assigned to {item.assignee}</Text> : null}
              {item.dueDate ? <Text style={styles.meta}>Due {item.dueDate}</Text> : null}
            </TouchableOpacity>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => setDatePickerFor(item.id)} testID={`set-due-date-${item.id}`}>
                <Ionicons name="calendar-outline" size={18} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDueDate(item.id, null)} testID={`clear-due-date-${item.id}`}>
                <Ionicons name="close-circle-outline" size={18} color="#bbb" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAssigningFor(item.id)} testID={`assign-item-${item.id}`}>
                <Ionicons name="person-add-outline" size={18} color="#667eea" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {datePickerFor ? (
        <View style={styles.picker} testID="date-picker">
          <Text style={styles.pickerTitle}>Select a due date</Text>
          {['Today', 'Tomorrow', 'Next week'].map((label) => (
            <TouchableOpacity
              key={label}
              style={styles.pickerOption}
              onPress={() => {
                setDueDate(datePickerFor, label);
                setDatePickerFor(null);
              }}
            >
              <Text style={styles.pickerOptionText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {assigningFor ? (
        <View style={styles.picker} testID="assignee-picker">
          <Text style={styles.pickerTitle}>Assign to</Text>
          {ASSIGNEES.map((name) => (
            <TouchableOpacity key={name} style={styles.pickerOption} onPress={() => assign(assigningFor, name)}>
              <Text style={styles.pickerOptionText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  toolbar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#fff' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eef0ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: { fontSize: 13, color: '#667eea' },
  status: { textAlign: 'center', color: '#22c55e', paddingVertical: 10 },
  list: { marginTop: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    gap: 12,
  },
  itemBody: { flex: 1 },
  itemText: { fontSize: 15, color: '#1a1a2e' },
  completedText: { textDecorationLine: 'line-through', color: '#999' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  picker: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12 },
  pickerTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  pickerOption: { paddingVertical: 10 },
  pickerOptionText: { fontSize: 15, color: '#667eea' },
});

export default ActionItemsScreen;
