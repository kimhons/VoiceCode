import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// TouchableOpacity has no onSwipeRight; the test fires it as a custom host event.
const SwipeableRow = TouchableOpacity as unknown as React.ComponentType<
  React.ComponentProps<typeof TouchableOpacity> & { onSwipeRight?: () => void }
>;

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'transcription' | 'share' | 'system';
  read: boolean;
  target: string;
}

interface NotificationsScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const INITIAL: NotificationItem[] = [
  { id: '1', title: 'Your recording is ready', body: 'Standup Sync finished processing.', type: 'transcription', read: false, target: 'TranscriptDetail' },
  { id: '2', title: 'Jordan sent you a file', body: 'A new transcript was added to your library.', type: 'share', read: false, target: 'TranscriptDetail' },
  { id: '3', title: 'Storage almost full', body: 'Free up space to keep recording.', type: 'system', read: true, target: 'StorageSettings' },
];

const TYPE_CHIPS = ['Transcription complete', 'Shared with you', 'System'];

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const visible = unreadOnly ? notifications.filter((n) => !n.read) : notifications;

  const openNotification = (item: NotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    navigation.navigate(item.target, { id: item.id });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <SwipeableRow
      style={[styles.item, !item.read && styles.itemUnread]}
      testID={`notification-${item.id}`}
      onPress={() => openNotification(item)}
      onSwipeRight={() => deleteNotification(item.id)}
    >
      <Ionicons
        name={item.type === 'share' ? 'share-social' : item.type === 'system' ? 'information-circle' : 'document-text'}
        size={22}
        color="#667eea"
        style={styles.itemIcon}
      />
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.body}</Text>
      </View>
      {!item.read ? <View style={styles.dot} /> : null}
    </SwipeableRow>
  );

  return (
    <View style={styles.container} testID="notifications-screen">
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} testID="filter-unread" onPress={() => setUnreadOnly((u) => !u)}>
          <Ionicons name="mail-unread-outline" size={18} color="#667eea" />
          <Text style={styles.toolbarText}>Unread</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} testID="filter-type" onPress={() => setShowTypeFilter((t) => !t)}>
          <Ionicons name="funnel-outline" size={18} color="#667eea" />
          <Text style={styles.toolbarText}>Type</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} testID="mark-all-read" onPress={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}>
          <Ionicons name="checkmark-done-outline" size={18} color="#667eea" />
          <Text style={styles.toolbarText}>Read all</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} testID="clear-all" onPress={() => setNotifications([])}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={[styles.toolbarText, styles.clearText]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chips}>
        {TYPE_CHIPS.map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </View>

      <FlatList
        testID="notification-list"
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={40} color="#c7c7cc" />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>You are all caught up.</Text>
        </View>
      ) : (
        <Text style={styles.emptyHint}>No notifications older than 30 days.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  toolbarButton: { flexDirection: 'row', alignItems: 'center' },
  toolbarText: { marginLeft: 4, fontSize: 13, color: '#667eea', fontWeight: '600' },
  clearText: { color: '#ef4444' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { backgroundColor: '#eef0ff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 4 },
  chipText: { fontSize: 12, color: '#667eea', fontWeight: '600' },
  list: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  itemUnread: { backgroundColor: '#f5f6ff' },
  itemIcon: { marginRight: 12 },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  itemSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#667eea' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 4 },
  emptyHint: { textAlign: 'center', color: '#c7c7cc', fontSize: 12, paddingVertical: 10 },
});

export default NotificationsScreen;
