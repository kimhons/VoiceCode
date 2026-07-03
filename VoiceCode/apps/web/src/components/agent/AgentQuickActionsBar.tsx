/**
 * AgentQuickActionsBar - Reusable quick actions for pages
 * Drop-in component for adding AI actions to any page
 */

import React, { useState, useCallback } from 'react';
import { useAgentContext } from '../../contexts/AgentContext';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  command: string;
  variant?: 'default' | 'primary';
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
    variant: 'primary',
  },
  {
    id: 'actions',
    label: 'Action Items',
    icon: '✅',
    command: 'extract_action_items',
  },
  {
    id: 'keypoints',
    label: 'Key Points',
    icon: '💡',
    command: 'extract_key_points',
  },
];

const medicalActions: QuickAction[] = [
  {
    id: 'soap',
    label: 'SOAP Note',
    icon: '🏥',
    command: 'generate_soap_note',
    variant: 'primary',
  },
  {
    id: 'progress',
    label: 'Progress Note',
    icon: '📋',
    command: 'generate_progress_note',
  },
  {
    id: 'billing',
    label: 'Billing Codes',
    icon: '💰',
    command: 'suggest_billing_codes',
  },
];

export const AgentQuickActionsBar: React.FC<AgentQuickActionsBarProps> = ({
  actions,
  transcriptId,
  showChatButton = true,
  onResultReady,
}) => {
  const { executeCommand, navigateToChat, professionalMode, isLoading } =
    useAgentContext();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  // Select actions based on mode
  const quickActions =
    actions ||
    (professionalMode === 'medical' ? medicalActions : defaultActions);

  const handleAction = useCallback(
    async (action: QuickAction) => {
      setLoadingId(action.id);
      setCompletedId(null);

      try {
        const result = await executeCommand(action.command, {
          transcript_id: transcriptId,
        });
        setCompletedId(action.id);
        setTimeout(() => setCompletedId(null), 2000);

        if (onResultReady) {
          onResultReady(action.command, result);
        }
      } catch (error) {
        console.error('Action failed:', error);
      } finally {
        setLoadingId(null);
      }
    },
    [executeCommand, transcriptId, onResultReady]
  );

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '12px 0',
      borderTop: '1px solid #374151',
      marginTop: '16px',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: '#9ca3af',
      marginRight: '8px',
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: 500,
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    buttonDefault: {
      backgroundColor: '#374151',
      color: '#e5e7eb',
    },
    buttonPrimary: {
      backgroundColor: '#6366f1',
      color: '#fff',
    },
    buttonLoading: {
      opacity: 0.7,
      cursor: 'wait',
    },
    chatButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: 500,
      borderRadius: '8px',
      border: '1px dashed #4b5563',
      backgroundColor: 'transparent',
      color: '#9ca3af',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      marginLeft: 'auto',
    },
    spinner: {
      width: '12px',
      height: '12px',
      border: '2px solid transparent',
      borderTopColor: 'currentColor',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    },
  };

  return (
    <div style={styles.container}>
      <span style={styles.label}>
        <span>✨</span> AI Actions:
      </span>

      {quickActions.map((action) => {
        const isActionLoading = loadingId === action.id;
        const isCompleted = completedId === action.id;

        return (
          <button
            key={action.id}
            style={{
              ...styles.button,
              ...(action.variant === 'primary'
                ? styles.buttonPrimary
                : styles.buttonDefault),
              ...(isActionLoading ? styles.buttonLoading : {}),
            }}
            onClick={() => handleAction(action)}
            disabled={isActionLoading || isLoading}
          >
            {isActionLoading ? (
              <span style={styles.spinner} />
            ) : isCompleted ? (
              <span style={{ color: '#10b981' }}>✓</span>
            ) : (
              <span>{action.icon}</span>
            )}
            {action.label}
          </button>
        );
      })}

      {showChatButton && (
        <button style={styles.chatButton} onClick={() => navigateToChat()}>
          <span>💬</span>
          Ask AI...
        </button>
      )}
    </div>
  );
};

export default AgentQuickActionsBar;
