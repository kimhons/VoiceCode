/**
 * AgentCommandPalette - Global Agent Trigger (⌘K / Ctrl+K)
 * Non-disruptive access to agent from any page
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  command: string;
  params?: Record<string, any>;
}

interface AgentCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (command: string, params?: Record<string, any>) => void;
  onChat: (message: string) => void;
  context?: {
    currentPage?: string;
    transcriptId?: string;
    transcriptTitle?: string;
    professionalMode?: string;
  };
  recentActions?: Array<{ query: string; timestamp: Date }>;
  isLoading?: boolean;
}

const defaultQuickActions: QuickAction[] = [
  {
    id: '1',
    label: 'Summarize',
    description: 'Create a summary',
    icon: '📝',
    command: 'summarize_transcript',
  },
  {
    id: '2',
    label: 'Extract Action Items',
    description: 'Find tasks and to-dos',
    icon: '✅',
    command: 'extract_action_items',
  },
  {
    id: '3',
    label: 'Key Points',
    description: 'Identify main takeaways',
    icon: '💡',
    command: 'extract_key_points',
  },
  {
    id: '4',
    label: 'Search Transcripts',
    description: 'Find across all content',
    icon: '🔍',
    command: 'search_transcripts',
  },
];

const medicalQuickActions: QuickAction[] = [
  {
    id: 'm1',
    label: 'Generate SOAP Note',
    description: 'Clinical documentation',
    icon: '🏥',
    command: 'generate_soap_note',
  },
  {
    id: 'm2',
    label: 'Progress Note',
    description: 'Follow-up documentation',
    icon: '📋',
    command: 'generate_progress_note',
  },
  {
    id: 'm3',
    label: 'Discharge Summary',
    description: 'Patient discharge docs',
    icon: '📄',
    command: 'generate_discharge_summary',
  },
  {
    id: 'm4',
    label: 'Billing Codes',
    description: 'Suggest ICD-10/CPT codes',
    icon: '💰',
    command: 'suggest_billing_codes',
  },
];

export const AgentCommandPalette: React.FC<AgentCommandPaletteProps> = ({
  isOpen,
  onClose,
  onAction,
  onChat,
  context = {},
  recentActions = [],
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine quick actions based on context
  const quickActions =
    context.professionalMode === 'medical'
      ? [...medicalQuickActions, ...defaultQuickActions]
      : defaultQuickActions;

  // Filter actions based on input
  const filteredActions = inputValue
    ? quickActions.filter(
        (a) =>
          a.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          a.description?.toLowerCase().includes(inputValue.toLowerCase())
      )
    : quickActions;

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setInputValue('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          const action = filteredActions[selectedIndex];
          onAction(action.command, {
            ...action.params,
            transcript_id: context.transcriptId,
          });
        } else if (inputValue.trim()) {
          onChat(inputValue);
        }
      }
    },
    [
      filteredActions,
      selectedIndex,
      inputValue,
      onAction,
      onChat,
      onClose,
      context.transcriptId,
    ]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
      zIndex: 9999,
    },
    container: {
      width: '100%',
      maxWidth: '600px',
      backgroundColor: '#1f2937',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      border: '1px solid #374151',
    },
    header: {
      padding: '16px 20px',
      borderBottom: '1px solid #374151',
    },
    inputWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    icon: {
      fontSize: '20px',
    },
    input: {
      flex: 1,
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      fontSize: '16px',
      color: '#fff',
    },
    shortcut: {
      padding: '4px 8px',
      backgroundColor: '#374151',
      borderRadius: '6px',
      fontSize: '12px',
      color: '#9ca3af',
    },
    context: {
      marginTop: '8px',
      fontSize: '13px',
      color: '#9ca3af',
    },
    content: {
      maxHeight: '400px',
      overflowY: 'auto' as const,
    },
    section: {
      padding: '8px 0',
    },
    sectionTitle: {
      padding: '8px 20px',
      fontSize: '11px',
      fontWeight: 600,
      color: '#6b7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    actionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 20px',
      cursor: 'pointer',
      transition: 'background-color 0.1s',
    },
    actionItemSelected: {
      backgroundColor: '#374151',
    },
    actionIcon: {
      fontSize: '18px',
      width: '28px',
      textAlign: 'center' as const,
    },
    actionContent: {
      flex: 1,
    },
    actionLabel: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: 500,
    },
    actionDescription: {
      color: '#9ca3af',
      fontSize: '12px',
      marginTop: '2px',
    },
    footer: {
      padding: '12px 20px',
      borderTop: '1px solid #374151',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '12px',
      color: '#6b7280',
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: '#9ca3af',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header with input */}
        <div style={styles.header}>
          <div style={styles.inputWrapper}>
            <span style={styles.icon}>🤖</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask VoiceCode AI anything..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              style={styles.input}
            />
            <span style={styles.shortcut}>ESC</span>
          </div>
          {context.transcriptTitle && (
            <div style={styles.context}>
              📄 Context: {context.transcriptTitle}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {isLoading ? (
            <div style={styles.loading}>
              <span>Processing...</span>
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Quick Actions</div>
                {filteredActions.map((action, index) => (
                  <div
                    key={action.id}
                    style={{
                      ...styles.actionItem,
                      ...(index === selectedIndex
                        ? styles.actionItemSelected
                        : {}),
                    }}
                    onClick={() =>
                      onAction(action.command, {
                        transcript_id: context.transcriptId,
                      })
                    }
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span style={styles.actionIcon}>{action.icon}</span>
                    <div style={styles.actionContent}>
                      <div style={styles.actionLabel}>{action.label}</div>
                      {action.description && (
                        <div style={styles.actionDescription}>
                          {action.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent */}
              {recentActions.length > 0 && (
                <div style={styles.section}>
                  <div style={styles.sectionTitle}>Recent</div>
                  {recentActions.slice(0, 3).map((recent, index) => (
                    <div
                      key={index}
                      style={styles.actionItem}
                      onClick={() => onChat(recent.query)}
                    >
                      <span style={styles.actionIcon}>🕒</span>
                      <div style={styles.actionContent}>
                        <div style={styles.actionLabel}>{recent.query}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
};

export default AgentCommandPalette;
