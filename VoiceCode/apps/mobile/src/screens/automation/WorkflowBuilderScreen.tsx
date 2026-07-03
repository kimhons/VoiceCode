import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  description: string;
  icon: string;
  color: string;
  isConfigured: boolean;
}

const WorkflowBuilderScreen: React.FC = () => {
  const [workflowName, setWorkflowName] = useState('Post-Meeting Workflow');
  const [isActive, setIsActive] = useState(true);

  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: '1',
      type: 'trigger',
      name: 'Recording Complete',
      description: 'When a recording finishes',
      icon: 'radio-button-on',
      color: '#FF3B30',
      isConfigured: true,
    },
    {
      id: '2',
      type: 'action',
      name: 'Generate Transcript',
      description: 'Create AI-powered transcript',
      icon: 'text',
      color: '#34C759',
      isConfigured: true,
    },
    {
      id: '3',
      type: 'action',
      name: 'Extract Action Items',
      description: 'Identify tasks and assignments',
      icon: 'checkbox',
      color: '#FF9500',
      isConfigured: true,
    },
    {
      id: '4',
      type: 'condition',
      name: 'Check Meeting Type',
      description: 'If meeting is client-facing',
      icon: 'git-branch',
      color: '#AF52DE',
      isConfigured: true,
    },
    {
      id: '5',
      type: 'action',
      name: 'Share to Slack',
      description: 'Post summary to #client-calls',
      icon: 'logo-slack',
      color: '#4A154B',
      isConfigured: false,
    },
  ]);

  const availableActions = [
    { id: 'transcript', name: 'Generate Transcript', icon: 'text', color: '#34C759' },
    { id: 'summary', name: 'AI Summary', icon: 'sparkles', color: '#AF52DE' },
    { id: 'action_items', name: 'Extract Actions', icon: 'checkbox', color: '#FF9500' },
    { id: 'share_slack', name: 'Share to Slack', icon: 'logo-slack', color: '#4A154B' },
    { id: 'share_email', name: 'Send Email', icon: 'mail', color: '#007AFF' },
    { id: 'save_drive', name: 'Save to Drive', icon: 'folder', color: '#4285F4' },
    { id: 'notify', name: 'Send Notification', icon: 'notifications', color: '#FF3B30' },
    { id: 'condition', name: 'Add Condition', icon: 'git-branch', color: '#5856D6' },
  ];

  const getStepTypeLabel = (type: string): string => {
    switch (type) {
      case 'trigger':
        return 'TRIGGER';
      case 'action':
        return 'ACTION';
      case 'condition':
        return 'CONDITION';
      default:
        return 'STEP';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Workflow Builder</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.workflowHeader}>
        <View style={styles.workflowInfo}>
          <Text style={styles.workflowName}>{workflowName}</Text>
          <View style={styles.workflowMeta}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isActive ? '#34C75920' : '#8E8E9320' },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: isActive ? '#34C759' : '#8E8E93' }]}
              />
              <Text style={[styles.statusText, { color: isActive ? '#34C759' : '#8E8E93' }]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text style={styles.stepsCount}>{steps.length} steps</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editNameButton}>
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => (
            <View key={step.id}>
              <TouchableOpacity style={styles.stepCard}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIcon, { backgroundColor: step.color + '20' }]}>
                    <Ionicons name={step.icon as any} size={20} color={step.color} />
                  </View>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTypeLabel}>{getStepTypeLabel(step.type)}</Text>
                  <Text style={styles.stepName}>{step.name}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
                <View style={styles.stepRight}>
                  {!step.isConfigured && (
                    <View style={styles.configWarning}>
                      <Ionicons name="alert-circle" size={18} color="#FF9500" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.stepMenu}>
                    <Ionicons name="ellipsis-vertical" size={18} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {idx < steps.length - 1 && (
                <View style={styles.connector}>
                  <View style={styles.connectorLine} />
                  <TouchableOpacity style={styles.addStepButton}>
                    <Ionicons name="add" size={16} color="#007AFF" />
                  </TouchableOpacity>
                  <View style={styles.connectorLine} />
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addNewStep}>
            <View style={styles.addNewIcon}>
              <Ionicons name="add" size={24} color="#007AFF" />
            </View>
            <Text style={styles.addNewText}>Add Step</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Actions</Text>
          <View style={styles.actionsGrid}>
            {availableActions.map(action => (
              <TouchableOpacity key={action.id} style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={styles.actionName}>{action.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workflow Stats</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Times Run</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2.3s</Text>
              <Text style={styles.statLabel}>Avg. Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.testButton}>
          <Ionicons name="play" size={18} color="#007AFF" />
          <Text style={styles.testText}>Test Workflow</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleButton, isActive && styles.toggleButtonActive]}>
          <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
            {isActive ? 'Disable' : 'Enable'}
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
  saveButton: { padding: 4 },
  saveText: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  workflowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  workflowInfo: { flex: 1 },
  workflowName: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  workflowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  stepsCount: { fontSize: 13, color: '#8E8E93', marginLeft: 12 },
  editNameButton: { padding: 8 },
  content: { flex: 1 },
  stepsContainer: { padding: 16 },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  stepLeft: { marginRight: 12 },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: { flex: 1 },
  stepTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  stepDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  stepRight: { flexDirection: 'row', alignItems: 'center' },
  configWarning: { marginRight: 8 },
  stepMenu: { padding: 4 },
  connector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40 },
  connectorLine: { width: 2, height: 16, backgroundColor: '#E5E5EA' },
  addStepButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  addNewStep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addNewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addNewText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  actionCard: {
    width: '23%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    margin: '1%',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionName: { fontSize: 11, fontWeight: '500', color: '#1C1C1E', textAlign: 'center' },
  statsCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#F2F2F7' },
  bottomPadding: { height: 100 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 8,
  },
  testText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#34C759',
    marginLeft: 8,
  },
  toggleButtonActive: { backgroundColor: '#FF3B3020' },
  toggleText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  toggleTextActive: { color: '#FF3B30' },
});

export default WorkflowBuilderScreen;
