import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Activity {
  id: string;
  user: string;
  userColor: string;
  action: string;
  target: string;
  targetType: 'document' | 'folder' | 'comment' | 'member';
  timestamp: string;
  isUnread: boolean;
  details?: string;
}

const ActivityFeedScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Activity' },
    { id: 'edits', label: 'Edits' },
    { id: 'comments', label: 'Comments' },
    { id: 'shares', label: 'Shares' },
  ];

  const activities: Activity[] = [
    {
      id: '1',
      user: 'Sarah Chen',
      userColor: '#007AFF',
      action: 'edited',
      target: 'Q1 Planning Meeting Notes',
      targetType: 'document',
      timestamp: '5 min ago',
      isUnread: true,
      details: 'Updated the action items section',
    },
    {
      id: '2',
      user: 'Mike Johnson',
      userColor: '#34C759',
      action: 'commented on',
      target: 'Product Roadmap Discussion',
      targetType: 'comment',
      timestamp: '15 min ago',
      isUnread: true,
      details: 'Great summary of the key points!',
    },
    {
      id: '3',
      user: 'Emily Davis',
      userColor: '#FF9500',
      action: 'shared',
      target: 'Design Review Recording',
      targetType: 'document',
      timestamp: '1 hour ago',
      isUnread: true,
    },
    {
      id: '4',
      user: 'Jordan Lee',
      userColor: '#AF52DE',
      action: 'created',
      target: 'Sprint Retrospective',
      targetType: 'document',
      timestamp: '2 hours ago',
      isUnread: false,
    },
    {
      id: '5',
      user: 'Alex Kim',
      userColor: '#FF2D55',
      action: 'replied to your comment in',
      target: 'Client Call Notes',
      targetType: 'comment',
      timestamp: '3 hours ago',
      isUnread: false,
      details: 'I agree, we should follow up on that',
    },
    {
      id: '6',
      user: 'Sarah Chen',
      userColor: '#007AFF',
      action: 'added you to',
      target: 'Engineering Docs',
      targetType: 'folder',
      timestamp: 'Yesterday',
      isUnread: false,
    },
    {
      id: '7',
      user: 'Mike Johnson',
      userColor: '#34C759',
      action: 'mentioned you in',
      target: 'Weekly Sync Meeting',
      targetType: 'document',
      timestamp: 'Yesterday',
      isUnread: false,
    },
    {
      id: '8',
      user: 'Emily Davis',
      userColor: '#FF9500',
      action: 'resolved a thread in',
      target: 'Budget Review',
      targetType: 'comment',
      timestamp: '2 days ago',
      isUnread: false,
    },
  ];

  const getActionIcon = (action: string, targetType: string): string => {
    if (action.includes('comment') || action.includes('replied') || action.includes('mentioned'))
      return 'chatbubble';
    if (action.includes('shared') || action.includes('added')) return 'share';
    if (action.includes('created')) return 'add-circle';
    if (action.includes('resolved')) return 'checkmark-circle';
    return 'create';
  };

  const getActionColor = (action: string): string => {
    if (action.includes('comment') || action.includes('replied')) return '#FF9500';
    if (action.includes('shared') || action.includes('added')) return '#34C759';
    if (action.includes('created')) return '#007AFF';
    if (action.includes('resolved')) return '#34C759';
    if (action.includes('mentioned')) return '#AF52DE';
    return '#007AFF';
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const groupedActivities = {
    today: activities.filter(a => a.timestamp.includes('min') || a.timestamp.includes('hour')),
    yesterday: activities.filter(a => a.timestamp === 'Yesterday'),
    earlier: activities.filter(a => a.timestamp.includes('days')),
  };

  const renderActivityItem = (activity: Activity) => (
    <TouchableOpacity
      key={activity.id}
      style={[styles.activityCard, activity.isUnread && styles.activityUnread]}
    >
      <View style={styles.activityLeft}>
        <View style={[styles.avatar, { backgroundColor: activity.userColor }]}>
          <Text style={styles.avatarText}>
            {activity.user
              .split(' ')
              .map(n => n[0])
              .join('')}
          </Text>
        </View>
        <View
          style={[
            styles.actionIconBadge,
            { backgroundColor: getActionColor(activity.action) + '20' },
          ]}
        >
          <Ionicons
            name={getActionIcon(activity.action, activity.targetType) as any}
            size={12}
            color={getActionColor(activity.action)}
          />
        </View>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.userName}>{activity.user}</Text> {activity.action}{' '}
          <Text style={styles.targetName}>{activity.target}</Text>
        </Text>
        {activity.details && (
          <Text style={styles.activityDetails} numberOfLines={1}>
            &quot;{activity.details}&quot;
          </Text>
        )}
        <Text style={styles.activityTime}>{activity.timestamp}</Text>
      </View>
      {activity.isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Activity</Text>
        <TouchableOpacity style={styles.markReadButton}>
          <Text style={styles.markReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {groupedActivities.today.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            {groupedActivities.today.map(renderActivityItem)}
          </View>
        )}

        {groupedActivities.yesterday.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yesterday</Text>
            {groupedActivities.yesterday.map(renderActivityItem)}
          </View>
        )}

        {groupedActivities.earlier.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earlier</Text>
            {groupedActivities.earlier.map(renderActivityItem)}
          </View>
        )}

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
  markReadButton: { padding: 4 },
  markReadText: { fontSize: 14, color: '#007AFF' },
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#8E8E93' },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  activityUnread: { backgroundColor: '#007AFF08', borderWidth: 1, borderColor: '#007AFF20' },
  activityLeft: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  actionIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: 15, color: '#3C3C43', lineHeight: 20 },
  userName: { fontWeight: '600', color: '#1C1C1E' },
  targetName: { fontWeight: '500', color: '#007AFF' },
  activityDetails: { fontSize: 13, color: '#8E8E93', fontStyle: 'italic', marginTop: 4 },
  activityTime: { fontSize: 12, color: '#8E8E93', marginTop: 6 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    marginTop: 6,
  },
  bottomPadding: { height: 40 },
});

export default ActivityFeedScreen;
