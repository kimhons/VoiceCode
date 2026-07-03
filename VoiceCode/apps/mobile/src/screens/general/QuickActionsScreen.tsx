import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  shortcut: string;
}

interface QuickActionsScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const ACTIONS: QuickAction[] = [
  { id: 'new-recording', label: 'New Recording', icon: 'mic', screen: 'Recording', shortcut: '⌘N' },
  { id: 'import', label: 'Import Audio', icon: 'cloud-upload-outline', screen: 'Import', shortcut: '⌘I' },
  { id: 'search', label: 'Search', icon: 'search', screen: 'Search', shortcut: '⌘F' },
  { id: 'recent', label: 'Recent', icon: 'time-outline', screen: 'Recent', shortcut: '⌘R' },
  { id: 'favorites', label: 'Favorites', icon: 'star-outline', screen: 'Favorites', shortcut: '⌘B' },
];

const QuickActionsScreen: React.FC<QuickActionsScreenProps> = ({ navigation }) => {
  const renderAction = ({ item }: { item: QuickAction }) => (
    <TouchableOpacity
      style={styles.action}
      testID={`action-${item.id}`}
      onPress={() => navigation.navigate(item.screen)}
    >
      <Ionicons name={item.icon} size={22} color="#667eea" style={styles.actionIcon} />
      <Text style={styles.actionLabel}>{item.label}</Text>
      <Text style={styles.actionShortcut}>{item.shortcut}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID="quick-actions-screen">
      <Text style={styles.title}>Quick Actions</Text>
      <FlatList
        testID="action-list"
        data={ACTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderAction}
        style={styles.list}
      />
      <Text style={styles.shortcutsHint}>Keyboard shortcuts shown on the right.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', padding: 16 },
  list: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  actionIcon: { marginRight: 12 },
  actionLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  actionShortcut: { fontSize: 13, color: '#aaa' },
  shortcutsHint: { textAlign: 'center', color: '#888', fontSize: 13, paddingVertical: 16 },
});

export default QuickActionsScreen;
