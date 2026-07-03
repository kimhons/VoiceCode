/**
 * AgentQuickActionsBar - Quick action buttons for mobile screens
 * Drop-in component for adding AI actions to any screen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAgentContext } from '../../contexts/AgentContext';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  command: string;
  primary?: boolean;
}

interface AgentQuickActionsBarProps {
  actions?: QuickAction[];
  transcriptId?: string;
  showChatButton?: boolean;
  onResultReady?: (command: string, result: any) => void;
}

const defaultActions: QuickAction[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    icon: '📝',
    command: 'summarize_transcript',
    primary: true,
  },
  { id: 'actions', label: 'Actions', icon: '✅', command: 'extract_action_items' },
  { id: 'keypoints', label: 'Key Points', icon: '💡', command: 'extract_key_points' },
];

const medicalActions: QuickAction[] = [
  { id: 'soap', label: 'SOAP', icon: '🏥', command: 'generate_soap_note', primary: true },
  { id: 'progress', label: 'Progress', icon: '📋', command: 'generate_progress_note' },
  { id: 'billing', label: 'Codes', icon: '💰', command: 'suggest_billing_codes' },
];

export const AgentQuickActionsBar: React.FC<AgentQuickActionsBarProps> = ({
  actions,
  transcriptId,
  showChatButton = true,
  onResultReady,
}) => {
  const { executeCommand, navigateToChat, professionalMode, isLoading } = useAgentContext();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  // Select actions based on mode
  const quickActions =
    actions || (professionalMode === 'medical' ? medicalActions : defaultActions);

  const handleAction = useCallback(
    async (action: QuickAction) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoadingId(action.id);
      setCompletedId(null);

      try {
        const result = await executeCommand(action.command, { transcript_id: transcriptId });
        setCompletedId(action.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setCompletedId(null), 2000);

        if (onResultReady) {
          onResultReady(action.command, result);
        }
      } catch (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.error('Action failed:', error);
      } finally {
        setLoadingId(null);
      }
    },
    [executeCommand, transcriptId, onResultReady]
  );

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.labelIcon}>✨</Text>
        <Text style={styles.label}>AI Actions</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}
      >
        {quickActions.map(action => {
          const isActionLoading = loadingId === action.id;
          const isCompleted = completedId === action.id;

          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.button,
                action.primary && styles.buttonPrimary,
                isActionLoading && styles.buttonLoading,
              ]}
              onPress={() => handleAction(action)}
              disabled={isActionLoading || isLoading}
              activeOpacity={0.7}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isCompleted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.buttonIcon}>{action.icon}</Text>
              )}
              <Text style={[styles.buttonLabel, action.primary && styles.buttonLabelPrimary]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {showChatButton && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigateToChat()}
            activeOpacity={0.7}
          >
            <Text style={styles.chatIcon}>💬</Text>
            <Text style={styles.chatLabel}>Ask AI</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  labelIcon: {
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  buttonPrimary: {
    backgroundColor: '#6366f1',
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonIcon: {
    fontSize: 14,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e5e7eb',
  },
  buttonLabelPrimary: {
    color: '#fff',
  },
  checkmark: {
    fontSize: 14,
    color: '#10b981',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4b5563',
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  chatIcon: {
    fontSize: 14,
  },
  chatLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
  },
});

export default AgentQuickActionsBar;
