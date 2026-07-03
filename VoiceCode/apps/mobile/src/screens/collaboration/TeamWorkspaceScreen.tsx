import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
}

interface SharedDocument {
  id: string;
  title: string;
  type: string;
  lastModified: string;
  modifiedBy: string;
  sharedWith: number;
}

const TeamWorkspaceScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'documents' | 'members' | 'activity'>('documents');

  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Sarah Chen', role: 'Team Lead', status: 'online' },
    { id: '2', name: 'Mike Johnson', role: 'Developer', status: 'online' },
    { id: '3', name: 'Emily Davis', role: 'Designer', status: 'busy' },
    { id: '4', name: 'Alex Kim', role: 'Developer', status: 'offline' },
    { id: '5', name: 'Jordan Lee', role: 'Product Manager', status: 'online' },
  ];

  const sharedDocuments: SharedDocument[] = [
    {
      id: '1',
      title: 'Q1 Planning Meeting',
      type: 'transcript',
      lastModified: '2 hours ago',
      modifiedBy: 'Sarah Chen',
      sharedWith: 5,
    },
    {
      id: '2',
      title: 'Product Roadmap Discussion',
      type: 'transcript',
      lastModified: 'Yesterday',
      modifiedBy: 'Jordan Lee',
      sharedWith: 8,
    },
    {
      id: '3',
      title: 'Client Call - Acme Corp',
      type: 'recording',
      lastModified: '3 days ago',
      modifiedBy: 'Mike Johnson',
      sharedWith: 3,
    },
    {
      id: '4',
      title: 'Sprint Retrospective',
      type: 'notes',
      lastModified: 'Last week',
      modifiedBy: 'Emily Davis',
      sharedWith: 6,
    },
  ];

  const recentActivity = [
    { user: 'Sarah Chen', action: 'edited', target: 'Q1 Planning Meeting', time: '2 hours ago' },
    {
      user: 'Mike Johnson',
      action: 'commented on',
      target: 'Product Roadmap',
      time: '4 hours ago',
    },
    { user: 'Jordan Lee', action: 'shared', target: 'Client Call Notes', time: 'Yesterday' },
    { user: 'Emily Davis', action: 'created', target: 'Design Review Meeting', time: '2 days ago' },
  ];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online':
        return '#34C759';
      case 'busy':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getDocIcon = (type: string): string => {
    switch (type) {
      case 'transcript':
        return 'document-text';
      case 'recording':
        return 'mic';
      default:
        return 'document';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Product Team</Text>
          <Text style={styles.subtitle}>
            {teamMembers.filter(m => m.status === 'online').length} members online
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workspace..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {(['documents', 'members', 'activity'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'documents' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shared Documents</Text>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addText}>New</Text>
              </TouchableOpacity>
            </View>

            {sharedDocuments.map(doc => (
              <TouchableOpacity key={doc.id} style={styles.documentCard}>
                <View style={styles.docIcon}>
                  <Ionicons name={getDocIcon(doc.type) as any} size={22} color="#007AFF" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <View style={styles.docMeta}>
                    <Text style={styles.docMetaText}>
                      Modified {doc.lastModified} by {doc.modifiedBy}
                    </Text>
                  </View>
                </View>
                <View style={styles.docShared}>
                  <View style={styles.sharedAvatars}>
                    {[...Array(Math.min(doc.sharedWith, 3))].map((_, i) => (
                      <View key={i} style={[styles.miniAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                        <Text style={styles.miniAvatarText}>{String.fromCharCode(65 + i)}</Text>
                      </View>
                    ))}
                  </View>
                  {doc.sharedWith > 3 && (
                    <Text style={styles.moreCount}>+{doc.sharedWith - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {selectedTab === 'members' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team Members</Text>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="person-add" size={18} color="#007AFF" />
                <Text style={styles.addText}>Invite</Text>
              </TouchableOpacity>
            </View>

            {teamMembers.map(member => (
              <TouchableOpacity key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarText}>
                    {member.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </Text>
                  <View
                    style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]}
                  />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <TouchableOpacity style={styles.messageButton}>
                  <Ionicons name="chatbubble" size={18} color="#007AFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {selectedTab === 'activity' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>

            {recentActivity.map((activity, idx) => (
              <View key={idx} style={styles.activityCard}>
                <View style={styles.activityAvatar}>
                  <Text style={styles.avatarText}>
                    {activity.user
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activityUser}>{activity.user}</Text> {activity.action}{' '}
                    <Text style={styles.activityTarget}>{activity.target}</Text>
                  </Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="mic" size={22} color="#FF3B30" />
          </View>
          <Text style={styles.quickActionText}>Record</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="document-text" size={22} color="#007AFF" />
          </View>
          <Text style={styles.quickActionText}>New Doc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="share" size={22} color="#34C759" />
          </View>
          <Text style={styles.quickActionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="videocam" size={22} color="#AF52DE" />
          </View>
          <Text style={styles.quickActionText}>Meeting</Text>
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
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  subtitle: { fontSize: 12, color: '#34C759', marginTop: 2 },
  settingsButton: { padding: 4 },
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF' },
  content: { flex: 1, padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  addButton: { flexDirection: 'row', alignItems: 'center' },
  addText: { fontSize: 14, color: '#007AFF', marginLeft: 4 },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  docMeta: { marginTop: 4 },
  docMetaText: { fontSize: 12, color: '#8E8E93' },
  docShared: { flexDirection: 'row', alignItems: 'center' },
  sharedAvatars: { flexDirection: 'row' },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  miniAvatarText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  moreCount: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  memberRole: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: 14, color: '#3C3C43', lineHeight: 20 },
  activityUser: { fontWeight: '600', color: '#1C1C1E' },
  activityTarget: { fontWeight: '500', color: '#007AFF' },
  activityTime: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  bottomPadding: { height: 100 },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  quickAction: { flex: 1, alignItems: 'center' },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: { fontSize: 11, color: '#8E8E93' },
});

export default TeamWorkspaceScreen;
