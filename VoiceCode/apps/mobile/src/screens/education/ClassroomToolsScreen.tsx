import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const ClassroomToolsScreen: React.FC = () => {
  const tools = [
    {
      id: 'timer',
      icon: 'timer',
      label: 'Class Timer',
      color: '#FF9500',
      description: 'Set timers for activities',
    },
    {
      id: 'random',
      icon: 'shuffle',
      label: 'Random Picker',
      color: '#AF52DE',
      description: 'Randomly select students',
    },
    {
      id: 'poll',
      icon: 'stats-chart',
      label: 'Quick Poll',
      color: '#007AFF',
      description: 'Create instant polls',
    },
    {
      id: 'noise',
      icon: 'volume-high',
      label: 'Noise Meter',
      color: '#FF3B30',
      description: 'Monitor class noise level',
    },
    {
      id: 'groups',
      icon: 'people',
      label: 'Group Maker',
      color: '#34C759',
      description: 'Create random groups',
    },
    {
      id: 'attendance',
      icon: 'checkbox',
      label: 'Attendance',
      color: '#5856D6',
      description: 'Take voice attendance',
    },
  ];

  const quickActions = [
    { icon: 'hand-left', label: 'Raise Hand Queue' },
    { icon: 'megaphone', label: 'Announcements' },
    { icon: 'calendar', label: 'Schedule' },
    { icon: 'document-text', label: 'Lesson Plan' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Classroom Tools</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.classInfo}>
          <Text style={styles.className}>CS101 - Introduction to Programming</Text>
          <Text style={styles.classMeta}>Room 302 • 28 students present</Text>
        </View>

        <View style={styles.toolsGrid}>
          {tools.map(tool => (
            <TouchableOpacity key={tool.id} style={styles.toolCard}>
              <View style={[styles.toolIcon, { backgroundColor: `${tool.color}20` }]}>
                <Ionicons name={tool.icon as any} size={28} color={tool.color} />
              </View>
              <Text style={styles.toolLabel}>{tool.label}</Text>
              <Text style={styles.toolDescription}>{tool.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map(action => (
              <TouchableOpacity key={action.label} style={styles.quickAction}>
                <Ionicons name={action.icon as any} size={24} color="#007AFF" />
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.activeSession}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionIndicator} />
            <Text style={styles.sessionTitle}>Active Session</Text>
          </View>
          <View style={styles.sessionStats}>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatValue}>45:23</Text>
              <Text style={styles.sessionStatLabel}>Duration</Text>
            </View>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatValue}>12</Text>
              <Text style={styles.sessionStatLabel}>Questions</Text>
            </View>
            <View style={styles.sessionStat}>
              <Text style={styles.sessionStatValue}>85%</Text>
              <Text style={styles.sessionStatLabel}>Engagement</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  content: { flex: 1 },
  classInfo: { backgroundColor: '#007AFF', padding: 20 },
  className: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  classMeta: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  toolCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
  toolDescription: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 4 },
  quickActionsSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionLabel: { fontSize: 11, color: '#666', marginTop: 6, textAlign: 'center' },
  activeSession: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sessionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  sessionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  sessionStats: { flexDirection: 'row' },
  sessionStat: { flex: 1, alignItems: 'center' },
  sessionStatValue: { fontSize: 24, fontWeight: '600', color: '#007AFF' },
  sessionStatLabel: { fontSize: 12, color: '#666', marginTop: 4 },
});

export default ClassroomToolsScreen;
