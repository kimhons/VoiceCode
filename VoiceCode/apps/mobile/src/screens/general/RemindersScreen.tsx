import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Reminder {
  id: string;
  title: string;
  time: string;
  transcriptId: string;
}

interface RemindersScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const INITIAL: Reminder[] = [
  { id: '1', title: 'Follow up with the design team', time: 'Today, 3:00 PM', transcriptId: 't1' },
  { id: '2', title: 'Review Q3 planning notes', time: 'Tomorrow, 9:00 AM', transcriptId: 't2' },
];

const RemindersScreen: React.FC<RemindersScreenProps> = ({ navigation }) => {
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL);
  const [showCreate, setShowCreate] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);

  const remove = (id: string) => setReminders((prev) => prev.filter((r) => r.id !== id));

  const renderItem = ({ item }: { item: Reminder }) => (
    <View style={styles.item} testID={`reminder-${item.id}`}>
      <TouchableOpacity
        style={styles.completeButton}
        testID={`complete-reminder-${item.id}`}
        onPress={() => remove(item.id)}
      >
        <Ionicons name="ellipse-outline" size={22} color="#667eea" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.itemBody}
        testID={`reminder-transcript-${item.id}`}
        onPress={() => navigation.navigate('TranscriptDetail', { id: item.transcriptId })}
      >
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemTime} testID={`reminder-time-${item.id}`}>{item.time}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        testID={`snooze-reminder-${item.id}`}
        onPress={() => setShowSnooze(true)}
      >
        <Ionicons name="alarm-outline" size={20} color="#f59e0b" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        testID={`delete-reminder-${item.id}`}
        onPress={() => remove(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container} testID="reminders-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming</Text>
        <TouchableOpacity style={styles.createButton} testID="create-reminder" onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        testID="reminders-list"
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />

      {reminders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="alarm-outline" size={40} color="#c7c7cc" />
          <Text style={styles.emptyText}>No reminders yet</Text>
        </View>
      ) : (
        <Text style={styles.emptyHint}>No reminders are overdue right now.</Text>
      )}

      {showCreate ? (
        <View style={styles.modal} testID="create-reminder-modal">
          <Text style={styles.modalTitle}>New</Text>
          <Text style={styles.modalBody}>Schedule a follow-up for a transcript.</Text>
          <TouchableOpacity style={styles.modalButton} onPress={() => setShowCreate(false)}>
            <Text style={styles.modalButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showSnooze ? (
        <View style={styles.modal} testID="snooze-picker">
          <Text style={styles.modalTitle}>Snooze until</Text>
          <View style={styles.snoozeRow}>
            {['15 min', '1 hour', 'Tomorrow'].map((option) => (
              <TouchableOpacity key={option} style={styles.snoozeOption} onPress={() => setShowSnooze(false)}>
                <Text style={styles.snoozeOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  createButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  completeButton: { paddingHorizontal: 6 },
  itemBody: { flex: 1, paddingHorizontal: 8 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  itemTime: { fontSize: 13, color: '#888', marginTop: 2 },
  iconButton: { paddingHorizontal: 8 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', marginTop: 12 },
  emptyHint: { textAlign: 'center', color: '#c7c7cc', fontSize: 12, paddingVertical: 10 },
  modal: { position: 'absolute', left: 24, right: 24, top: '35%', padding: 20, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalBody: { fontSize: 14, color: '#888', marginTop: 8 },
  modalButton: { marginTop: 16, backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '600' },
  snoozeRow: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
  snoozeOption: { flex: 1, marginHorizontal: 4, paddingVertical: 12, alignItems: 'center', backgroundColor: '#eef0ff', borderRadius: 8 },
  snoozeOptionText: { color: '#667eea', fontWeight: '600' },
});

export default RemindersScreen;
