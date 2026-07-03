/**
 * Automation Builder Screen
 * Phase 3 Week 10 Day 68-69: Intelligent Automation
 * 
 * Visual automation builder with drag-and-drop interface.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import {
  fetchWorkflows,
  fetchTriggers,
  fetchActions,
  fetchTemplates,
  createWorkflow,
  updateWorkflow,
  executeWorkflow,
  setActiveWorkflow,
  clearExecutionStatus,
} from '../../store/slices/automationSlice';
import {
  Workflow,
  Trigger,
  Action,
  ActionTemplate,
  TriggerTemplate,
  WorkflowTemplate,
} from '../../services/automationService';

type TabType = 'builder' | 'actions' | 'testing' | 'templates' | 'settings';

export default function AutomationBuilderScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    workflows,
    activeWorkflow,
    triggers,
    actions,
    templates,
    executionStatus,
    loading,
    error,
  } = useSelector((state: RootState) => state.automation);

  const [activeTab, setActiveTab] = useState<TabType>('builder');
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [selectedActions, setSelectedActions] = useState<Action[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkflows('current-user'));
    dispatch(fetchTriggers());
    dispatch(fetchActions());
    dispatch(fetchTemplates());
  }, [dispatch]);

  useEffect(() => {
    if (activeWorkflow) {
      setWorkflowName(activeWorkflow.name);
      setWorkflowDescription(activeWorkflow.description);
      setSelectedTrigger(activeWorkflow.trigger);
      setSelectedActions(activeWorkflow.actions);
      setIsEnabled(activeWorkflow.is_enabled);
    }
  }, [activeWorkflow]);

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      Alert.alert('Error', 'Please enter a workflow name');
      return;
    }

    if (!selectedTrigger) {
      Alert.alert('Error', 'Please select a trigger');
      return;
    }

    if (selectedActions.length === 0) {
      Alert.alert('Error', 'Please add at least one action');
      return;
    }

    const workflowData = {
      user_id: 'current-user',
      name: workflowName,
      description: workflowDescription,
      trigger: selectedTrigger,
      actions: selectedActions,
      conditions: [],
      is_enabled: isEnabled,
      execution_count: 0,
      success_count: 0,
      failure_count: 0,
      metadata: {},
    };

    if (activeWorkflow) {
      dispatch(updateWorkflow({ workflowId: activeWorkflow.id, updates: workflowData }));
    } else {
      dispatch(createWorkflow(workflowData));
    }

    Alert.alert('Success', 'Workflow saved successfully');
  };

  const handleTestWorkflow = async () => {
    if (!activeWorkflow) {
      Alert.alert('Error', 'Please save the workflow first');
      return;
    }

    setTestRunning(true);
    await dispatch(executeWorkflow({ workflowId: activeWorkflow.id }));
    setTestRunning(false);
    setActiveTab('testing');
  };

  const handleAddAction = (actionTemplate: ActionTemplate) => {
    const newAction: Action = {
      id: Math.random().toString(36).substring(7),
      type: actionTemplate.type,
      name: actionTemplate.name,
      description: actionTemplate.description,
      config: {},
      order: selectedActions.length + 1,
    };
    setSelectedActions([...selectedActions, newAction]);
  };

  const handleRemoveAction = (actionId: string) => {
    setSelectedActions(selectedActions.filter(a => a.id !== actionId));
  };

  const handleMoveAction = (actionId: string, direction: 'up' | 'down') => {
    const index = selectedActions.findIndex(a => a.id === actionId);
    if (index === -1) return;

    const newActions = [...selectedActions];
    if (direction === 'up' && index > 0) {
      [newActions[index], newActions[index - 1]] = [newActions[index - 1], newActions[index]];
    } else if (direction === 'down' && index < newActions.length - 1) {
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
    }

    // Update order
    newActions.forEach((action, i) => {
      action.order = i + 1;
    });

    setSelectedActions(newActions);
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    setSelectedTrigger(template.trigger);
    setSelectedActions(template.actions);
    Alert.alert('Success', 'Template loaded successfully');
  };

  const renderBuilderTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Workflow Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workflow Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Workflow Name"
          value={workflowName}
          onChangeText={setWorkflowName}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={workflowDescription}
          onChangeText={setWorkflowDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Trigger Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trigger</Text>
        {selectedTrigger ? (
          <View style={styles.triggerCard}>
            <View style={styles.triggerHeader}>
              <Ionicons name="flash" size={20} color="#4CAF50" />
              <Text style={styles.triggerType}>{selectedTrigger.type.toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setSelectedTrigger(null)}>
                <Ionicons name="close-circle" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
            <Text style={styles.triggerConfig}>
              {JSON.stringify(selectedTrigger.config, null, 2)}
            </Text>
          </View>
        ) : (
          <View style={styles.triggerSelector}>
            {triggers.map((trigger, index) => (
              <TouchableOpacity
                key={index}
                style={styles.triggerOption}
                onPress={() => setSelectedTrigger({ type: trigger.type, config: trigger.config_template })}
              >
                <Ionicons name="flash" size={24} color="#4CAF50" />
                <View style={styles.triggerInfo}>
                  <Text style={styles.triggerName}>{trigger.name}</Text>
                  <Text style={styles.triggerDescription}>{trigger.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions ({selectedActions.length})</Text>
        {selectedActions.map((action, index) => (
          <View key={action.id} style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionOrder}>{index + 1}</Text>
              <View style={styles.actionInfo}>
                <Text style={styles.actionName}>{action.name}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </View>
              <View style={styles.actionControls}>
                <TouchableOpacity
                  onPress={() => handleMoveAction(action.id, 'up')}
                  disabled={index === 0}
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={index === 0 ? '#ccc' : '#2196F3'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleMoveAction(action.id, 'down')}
                  disabled={index === selectedActions.length - 1}
                >
                  <Ionicons
                    name="arrow-down"
                    size={20}
                    color={index === selectedActions.length - 1 ? '#ccc' : '#2196F3'}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveAction(action.id)}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addActionButton}
          onPress={() => setActiveTab('actions')}
        >
          <Ionicons name="add-circle" size={24} color="#2196F3" />
          <Text style={styles.addActionText}>Add Action</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveWorkflow}>
        <Text style={styles.saveButtonText}>Save Workflow</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderActionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Available Actions</Text>
      {actions.map((actionTemplate, index) => (
        <TouchableOpacity
          key={index}
          style={styles.actionTemplateCard}
          onPress={() => {
            handleAddAction(actionTemplate);
            setActiveTab('builder');
          }}
        >
          <View style={styles.actionTemplateHeader}>
            <Ionicons name={actionTemplate.icon as any} size={32} color="#2196F3" />
            <View style={styles.actionTemplateInfo}>
              <Text style={styles.actionTemplateName}>{actionTemplate.name}</Text>
              <Text style={styles.actionTemplateCategory}>{actionTemplate.category}</Text>
            </View>
            <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.actionTemplateDescription}>{actionTemplate.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTestingTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Workflow</Text>
        <TouchableOpacity
          style={[styles.testButton, testRunning && styles.testButtonDisabled]}
          onPress={handleTestWorkflow}
          disabled={testRunning || !activeWorkflow}
        >
          {testRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.testButtonText}>Run Test</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {executionStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execution Results</Text>
          <View style={[
            styles.statusCard,
            executionStatus.status === 'completed' ? styles.statusSuccess : styles.statusError
          ]}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={executionStatus.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={executionStatus.status === 'completed' ? '#4CAF50' : '#F44336'}
              />
              <Text style={styles.statusText}>{executionStatus.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.statusDuration}>
              Duration: {executionStatus.duration}ms
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Execution Steps</Text>
          {executionStatus.steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.stepType}>{step.action_type}</Text>
                <Ionicons
                  name={step.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={step.status === 'completed' ? '#4CAF50' : '#F44336'}
                />
              </View>
              {step.error && (
                <Text style={styles.stepError}>{step.error}</Text>
              )}
              {step.duration && (
                <Text style={styles.stepDuration}>{step.duration}ms</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderTemplatesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Workflow Templates</Text>
      {templates.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={styles.templateCard}
          onPress={() => handleLoadTemplate(template)}
        >
          <View style={styles.templateHeader}>
            <View>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateCategory}>{template.category}</Text>
            </View>
            {template.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          <Text style={styles.templateDescription}>{template.description}</Text>
          <View style={styles.templateStats}>
            <View style={styles.templateStat}>
              <Ionicons name="flash" size={16} color="#666" />
              <Text style={styles.templateStatText}>{template.trigger.type}</Text>
            </View>
            <View style={styles.templateStat}>
              <Ionicons name="list" size={16} color="#666" />
              <Text style={styles.templateStatText}>{template.actions.length} actions</Text>
            </View>
            <View style={styles.templateStat}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.templateStatText}>{template.usage_count} uses</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workflow Settings</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Enable Workflow</Text>
            <Text style={styles.settingDescription}>
              Workflow will run automatically when triggered
            </Text>
          </View>
          <Switch value={isEnabled} onValueChange={setIsEnabled} />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Error Handling</Text>
            <Text style={styles.settingDescription}>
              Retry failed actions automatically
            </Text>
          </View>
          <Switch value={true} onValueChange={() => {}} />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingDescription}>
              Get notified when workflow completes
            </Text>
          </View>
          <Switch value={false} onValueChange={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Execution Frequency</Text>
        <TouchableOpacity style={styles.frequencyOption}>
          <Text style={styles.frequencyText}>Every time trigger fires</Text>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.frequencyOption}>
          <Text style={styles.frequencyText}>Once per hour</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.frequencyOption}>
          <Text style={styles.frequencyText}>Once per day</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Automation Builder</Text>
        <Text style={styles.subtitle}>
          {activeWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'builder' && styles.tabActive]}
          onPress={() => setActiveTab('builder')}
        >
          <Ionicons
            name="construct"
            size={20}
            color={activeTab === 'builder' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'builder' && styles.tabTextActive]}>
            Builder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'actions' && styles.tabActive]}
          onPress={() => setActiveTab('actions')}
        >
          <Ionicons
            name="list"
            size={20}
            color={activeTab === 'actions' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'actions' && styles.tabTextActive]}>
            Actions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'testing' && styles.tabActive]}
          onPress={() => setActiveTab('testing')}
        >
          <Ionicons
            name="flask"
            size={20}
            color={activeTab === 'testing' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'testing' && styles.tabTextActive]}>
            Testing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Ionicons
            name="albums"
            size={20}
            color={activeTab === 'templates' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? '#2196F3' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <>
          {activeTab === 'builder' && renderBuilderTab()}
          {activeTab === 'actions' && renderActionsTab()}
          {activeTab === 'testing' && renderTestingTab()}
          {activeTab === 'templates' && renderTemplatesTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  triggerCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  triggerType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  triggerConfig: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  triggerSelector: {
    gap: 8,
  },
  triggerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    gap: 12,
  },
  triggerInfo: {
    flex: 1,
  },
  triggerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  triggerDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: 'bold',
  },
  actionInfo: {
    flex: 1,
  },
  actionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionControls: {
    flexDirection: 'row',
    gap: 12,
  },
  addActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    gap: 8,
  },
  addActionText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionTemplateCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionTemplateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  actionTemplateInfo: {
    flex: 1,
  },
  actionTemplateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionTemplateCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionTemplateDescription: {
    fontSize: 14,
    color: '#666',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButtonDisabled: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statusError: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDuration: {
    fontSize: 14,
    color: '#666',
  },
  stepCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stepError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  stepDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  templateCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  templateCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    color: '#F57F17',
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  templateStats: {
    flexDirection: 'row',
    gap: 16,
  },
  templateStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateStatText: {
    fontSize: 12,
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  frequencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  frequencyText: {
    fontSize: 16,
    color: '#333',
  },
});

