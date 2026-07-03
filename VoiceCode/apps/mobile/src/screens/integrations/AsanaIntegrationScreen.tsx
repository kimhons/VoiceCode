import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AsanaIntegrationScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);
  const [syncActionItems, setSyncActionItems] = useState(true);
  const [attachTranscripts, setAttachTranscripts] = useState(false);
  const [notifyAssignees, setNotifyAssignees] = useState(true);

  const accountInfo = {
    workspace: 'Company Corp',
    email: 'john.smith@company.com',
  };

  const connectedProjects = [
    { id: '1', name: 'Product Development', tasks: 45, color: '#FF6B6B' },
    { id: '2', name: 'Marketing Campaigns', tasks: 23, color: '#4ECDC4' },
    { id: '3', name: 'Sales Pipeline', tasks: 67, color: '#FFE66D' },
  ];

  const recentTasks = [
    {
      title: 'Follow up with client on proposal',
      project: 'Sales Pipeline',
      assignee: 'Sarah W.',
      dueDate: 'Tomorrow',
    },
    {
      title: 'Review Q4 marketing metrics',
      project: 'Marketing Campaigns',
      assignee: 'Mike J.',
      dueDate: 'Jan 20',
    },
    {
      title: 'Update product roadmap',
      project: 'Product Development',
      assignee: 'John S.',
      dueDate: 'Jan 22',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Asana</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.asanaLogo}>
              <Ionicons name="checkbox" size={28} color="#F06A6A" />
            </View>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionTitle}>{accountInfo.workspace}</Text>
              <Text style={styles.connectionEmail}>{accountInfo.email}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
              <Text style={[styles.statusText, { color: '#34C759' }]}>Connected</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Creation</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="add-circle" size={20} color="#F06A6A" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-Create Tasks</Text>
                  <Text style={styles.settingDesc}>Create tasks from action items</Text>
                </View>
              </View>
              <Switch
                value={autoCreateTasks}
                onValueChange={setAutoCreateTasks}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sync" size={20} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sync Action Items</Text>
                  <Text style={styles.settingDesc}>Keep tasks updated with changes</Text>
                </View>
              </View>
              <Switch
                value={syncActionItems}
                onValueChange={setSyncActionItems}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="attach" size={20} color="#FF9500" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Attach Transcripts</Text>
                  <Text style={styles.settingDesc}>Add meeting transcripts to tasks</Text>
                </View>
              </View>
              <Switch
                value={attachTranscripts}
                onValueChange={setAttachTranscripts}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color="#AF52DE" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Notify Assignees</Text>
                  <Text style={styles.settingDesc}>Send notifications when assigned</Text>
                </View>
              </View>
              <Switch
                value={notifyAssignees}
                onValueChange={setNotifyAssignees}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Projects</Text>
          {connectedProjects.map(project => (
            <TouchableOpacity key={project.id} style={styles.projectCard}>
              <View style={[styles.projectColor, { backgroundColor: project.color }]} />
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectTasks}>{project.tasks} tasks created</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addProjectButton}>
            <Ionicons name="add" size={20} color="#F06A6A" />
            <Text style={styles.addProjectText}>Connect Project</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Created Tasks</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentTasks.map((task, idx) => (
            <View key={idx} style={styles.taskCard}>
              <View style={styles.taskCheckbox}>
                <Ionicons name="ellipse-outline" size={22} color="#C7C7CC" />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskMeta}>
                  <Text style={styles.taskProject}>{task.project}</Text>
                  <Text style={styles.taskDot}>•</Text>
                  <Text style={styles.taskAssignee}>{task.assignee}</Text>
                  <Text style={styles.taskDot}>•</Text>
                  <Text style={styles.taskDue}>{task.dueDate}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.disconnectButton}>
          <Ionicons name="unlink" size={20} color="#FF3B30" />
          <Text style={styles.disconnectText}>Disconnect Asana</Text>
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
  placeholder: { width: 32 },
  content: { flex: 1 },
  connectionCard: { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 20 },
  connectionHeader: { flexDirection: 'row', alignItems: 'center' },
  asanaLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F06A6A15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectionInfo: { flex: 1 },
  connectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  connectionEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: { fontSize: 14, color: '#007AFF' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  settingInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  settingDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  projectColor: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  projectTasks: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  addProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F06A6A',
    borderStyle: 'dashed',
  },
  addProjectText: { fontSize: 15, color: '#F06A6A', marginLeft: 8 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  taskCheckbox: { marginRight: 12, marginTop: 2 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, color: '#1C1C1E', lineHeight: 20 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap' },
  taskProject: { fontSize: 12, color: '#F06A6A' },
  taskDot: { fontSize: 12, color: '#C7C7CC', marginHorizontal: 6 },
  taskAssignee: { fontSize: 12, color: '#8E8E93' },
  taskDue: { fontSize: 12, color: '#8E8E93' },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FF3B3015',
  },
  disconnectText: { fontSize: 15, fontWeight: '500', color: '#FF3B30', marginLeft: 8 },
  bottomPadding: { height: 40 },
});

export default AsanaIntegrationScreen;
