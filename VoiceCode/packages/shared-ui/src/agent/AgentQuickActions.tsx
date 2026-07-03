/**
 * AgentQuickActions - Contextual action bar for agent commands
 * Non-disruptive addition to existing pages
 */

import React, { useState } from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  command: string;
  params?: Record<string, any>;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

interface AgentQuickActionsProps {
  actions: QuickAction[];
  context?: Record<string, any>;
  onAction: (command: string, params?: Record<string, any>) => Promise<any>;
  onOpenChat?: (prefill?: string) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showChatButton?: boolean;
}

export const AgentQuickActions: React.FC<AgentQuickActionsProps> = ({
  actions,
  context = {},
  onAction,
  onOpenChat,
  orientation = 'horizontal',
  size = 'md',
  showChatButton = true,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  const handleAction = async (action: QuickAction) => {
    setLoadingId(action.id);
    setCompletedId(null);

    try {
      await onAction(action.command, { ...action.params, ...context });
      setCompletedId(action.id);
      setTimeout(() => setCompletedId(null), 2000);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '12px', gap: '6px', iconSize: '14px' },
    md: { padding: '8px 16px', fontSize: '13px', gap: '8px', iconSize: '16px' },
    lg: {
      padding: '10px 20px',
      fontSize: '14px',
      gap: '10px',
      iconSize: '18px',
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: '#374151', color: '#e5e7eb' },
    primary: { backgroundColor: '#6366f1', color: '#fff' },
    success: { backgroundColor: '#10b981', color: '#fff' },
    warning: { backgroundColor: '#f59e0b', color: '#fff' },
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '12px 0',
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeStyles[size].gap,
      padding: sizeStyles[size].padding,
      fontSize: sizeStyles[size].fontSize,
      fontWeight: 500,
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap' as const,
    },
    icon: {
      fontSize: sizeStyles[size].iconSize,
    },
    chatButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeStyles[size].gap,
      padding: sizeStyles[size].padding,
      fontSize: sizeStyles[size].fontSize,
      fontWeight: 500,
      borderRadius: '8px',
      border: '1px dashed #4b5563',
      backgroundColor: 'transparent',
      color: '#9ca3af',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    loadingSpinner: {
      width: '14px',
      height: '14px',
      border: '2px solid transparent',
      borderTopColor: 'currentColor',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    },
    checkmark: {
      color: '#10b981',
    },
  };

  // Add keyframes for spinner
  React.useEffect(() => {
    const styleSheet = document.styleSheets[0];
    const keyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;
    try {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {
      // Rule might already exist
    }
  }, []);

  return (
    <div style={styles.container}>
      {actions.map((action) => {
        const isLoading = loadingId === action.id;
        const isCompleted = completedId === action.id;
        const variant = action.variant || 'default';

        return (
          <button
            key={action.id}
            style={{
              ...styles.button,
              ...variantStyles[variant],
              opacity: isLoading ? 0.7 : 1,
            }}
            onClick={() => handleAction(action)}
            disabled={isLoading}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? (
              <span style={styles.loadingSpinner} />
            ) : isCompleted ? (
              <span style={styles.checkmark}>✓</span>
            ) : action.icon ? (
              <span style={styles.icon}>{action.icon}</span>
            ) : null}
            {action.label}
          </button>
        );
      })}

      {showChatButton && onOpenChat && (
        <button
          style={styles.chatButton}
          onClick={() => onOpenChat()}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#6b7280';
            e.currentTarget.style.color = '#e5e7eb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#4b5563';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <span style={styles.icon}>💬</span>
          Ask AI...
        </button>
      )}
    </div>
  );
};

// Preset configurations for common use cases
export const TranscriptQuickActions: QuickAction[] = [
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
  { id: 'similar', label: 'Find Similar', icon: '🔍', command: 'find_similar' },
];

export const MedicalQuickActions: QuickAction[] = [
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
    id: 'discharge',
    label: 'Discharge Summary',
    icon: '📄',
    command: 'generate_discharge_summary',
  },
  {
    id: 'billing',
    label: 'Billing Codes',
    icon: '💰',
    command: 'suggest_billing_codes',
  },
];

export const MeetingQuickActions: QuickAction[] = [
  {
    id: 'minutes',
    label: 'Meeting Minutes',
    icon: '📋',
    command: 'generate_meeting_minutes',
    variant: 'primary',
  },
  {
    id: 'decisions',
    label: 'Decisions',
    icon: '⚖️',
    command: 'extract_decisions',
  },
  {
    id: 'actions',
    label: 'Action Items',
    icon: '✅',
    command: 'extract_action_items',
  },
  {
    id: 'followup',
    label: 'Follow-up Email',
    icon: '📧',
    command: 'generate_followup_email',
  },
];

export default AgentQuickActions;
