import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar?: string;
  lastActive: string;
}

const PermissionsManagementScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [linkSharing, setLinkSharing] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowComments, setAllowComments] = useState(true);

  const users: User[] = [
    { id: '1', name: 'Sarah Chen', email: 'sarah@company.com', role: 'owner', lastActive: 'Now' },
    {
      id: '2',
      name: 'Mike Johnson',
      email: 'mike@company.com',
      role: 'admin',
      lastActive: '5 min ago',
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily@company.com',
      role: 'editor',
      lastActive: '1 hour ago',
    },
    {
      id: '4',
      name: 'Alex Kim',
      email: 'alex@company.com',
      role: 'editor',
      lastActive: 'Yesterday',
    },
    {
      id: '5',
      name: 'Jordan Lee',
      email: 'jordan@company.com',
      role: 'viewer',
      lastActive: '3 days ago',
    },
  ];

  const roles = [
    {
      id: 'owner',
      label: 'Owner',
      description: 'Full access and can manage sharing',
      color: '#FF3B30',
    },
    { id: 'admin', label: 'Admin', description: 'Can edit and manage members', color: '#FF9500' },
    { id: 'editor', label: 'Editor', description: 'Can view and edit content', color: '#007AFF' },
    { id: 'viewer', label: 'Viewer', description: 'Can only view content', color: '#8E8E93' },
  ];

  const getRoleColor = (role: string): string => {
    return roles.find(r => r.id === role)?.color || '#8E8E93';
  };

  const getRoleLabel = (role: string): string => {
    return roles.find(r => r.id === role)?.label || role;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Access</Text>
        <TouchableOpacity style={styles.doneButton}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.documentInfo}>
          <View style={styles.docIcon}>
            <Ionicons name="document-text" size={28} color="#007AFF" />
          </View>
          <View style={styles.docDetails}>
            <Text style={styles.docTitle}>Q1 Planning Meeting Notes</Text>
            <Text style={styles.docMeta}>Shared with {users.length} people</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite People</Text>
          <View style={styles.inviteRow}>
            <View style={styles.inviteInput}>
              <Ionicons name="person-add" size={18} color="#8E8E93" />
              <TextInput
                style={styles.inviteTextInput}
                placeholder="Enter email address..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardType="email-address"
              />
            </View>
            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link Sharing</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="link" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Share via Link</Text>
                  <Text style={styles.settingDescription}>Anyone with the link can access</Text>
                </View>
              </View>
              <Switch
                value={linkSharing}
                onValueChange={setLinkSharing}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            {linkSharing && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.linkRow}>
                  <View style={styles.linkInfo}>
                    <Text style={styles.linkText} numberOfLines={1}>
                      https://voicecode.app/share/abc123...
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.copyButton}>
                    <Ionicons name="copy" size={18} color="#007AFF" />
                    <Text style={styles.copyText}>Copy</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="download" size={20} color="#34C759" />
                <Text style={styles.settingLabel}>Allow Download</Text>
              </View>
              <Switch
                value={allowDownload}
                onValueChange={setAllowDownload}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubble" size={20} color="#FF9500" />
                <Text style={styles.settingLabel}>Allow Comments</Text>
              </View>
              <Switch
                value={allowComments}
                onValueChange={setAllowComments}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People with Access</Text>
            <Text style={styles.sectionCount}>{users.length}</Text>
          </View>

          {users.map(user => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity style={styles.roleButton}>
                <View
                  style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}
                >
                  <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
                    {getRoleLabel(user.role)}
                  </Text>
                </View>
                {user.role !== 'owner' && (
                  <Ionicons name="chevron-down" size={14} color="#8E8E93" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role Descriptions</Text>
          <View style={styles.rolesCard}>
            {roles.map((role, idx) => (
              <View key={role.id}>
                <View style={styles.roleDescRow}>
                  <View style={[styles.roleIndicator, { backgroundColor: role.color }]} />
                  <View style={styles.roleDescInfo}>
                    <Text style={styles.roleDescLabel}>{role.label}</Text>
                    <Text style={styles.roleDescText}>{role.description}</Text>
                  </View>
                </View>
                {idx < roles.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.dangerButton}>
          <Ionicons name="trash" size={20} color="#FF3B30" />
          <Text style={styles.dangerText}>Remove All Access</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  content: { flex: 1 },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  docIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  docDetails: { flex: 1 },
  docTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  docMeta: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 12, flex: 1 },
  sectionCount: {
    fontSize: 14,
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inviteRow: { flexDirection: 'row', alignItems: 'center' },
  inviteInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inviteTextInput: { flex: 1, fontSize: 15, color: '#1C1C1E', marginLeft: 10 },
  inviteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 10,
  },
  inviteButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12 },
  settingLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  settingDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  linkRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  linkInfo: { flex: 1 },
  linkText: { fontSize: 13, color: '#8E8E93' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF15',
    borderRadius: 8,
  },
  copyText: { fontSize: 13, color: '#007AFF', marginLeft: 4, fontWeight: '500' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  userEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  roleButton: { flexDirection: 'row', alignItems: 'center' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 4 },
  roleText: { fontSize: 13, fontWeight: '500' },
  rolesCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  roleDescRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  roleIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  roleDescInfo: { flex: 1 },
  roleDescLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  roleDescText: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  dangerText: { fontSize: 15, fontWeight: '600', color: '#FF3B30', marginLeft: 8 },
  bottomPadding: { height: 40 },
});

export default PermissionsManagementScreen;
