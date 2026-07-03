/**
 * GlobalAgentOverlay - Renders command palette and global agent UI
 * Should be placed at the root of the app
 */

import React, { useCallback } from 'react';
import { useAgentContext } from '../../contexts/AgentContext';

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: string;
  command: string;
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
    label: 'Action Items',
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
    label: 'Search',
    description: 'Search all transcripts',
    icon: '🔍',
    command: 'search_transcripts',
  },
];

const medicalQuickActions: QuickAction[] = [
  {
    id: 'm1',
    label: 'SOAP Note',
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
    description: 'Patient discharge',
    icon: '📄',
    command: 'generate_discharge_summary',
  },
  {
    id: 'm4',
    label: 'Billing Codes',
    description: 'ICD-10/CPT codes',
    icon: '💰',
    command: 'suggest_billing_codes',
  },
];

export const GlobalAgentOverlay: React.FC = () => {
  const {
    isCommandPaletteOpen,
    closeCommandPalette,
    executeCommand,
    navigateToChat,
    professionalMode,
    currentContext,
    recentActions,
    isLoading,
  } = useAgentContext();

  const [inputValue, setInputValue] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Get actions based on mode
  const quickActions =
    professionalMode === 'medical'
      ? [...medicalQuickActions, ...defaultQuickActions]
      : defaultQuickActions;

  // Filter actions
  const filteredActions = inputValue
    ? quickActions.filter(
        (a) =>
          a.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          a.description?.toLowerCase().includes(inputValue.toLowerCase())
      )
    : quickActions;

  // Focus input when opened
  React.useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setInputValue('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  // Handle action execution
  const handleAction = useCallback(
    async (action: QuickAction) => {
      closeCommandPalette();
      await executeCommand(action.command, {
        transcript_id: currentContext.transcriptId,
      });
    },
    [closeCommandPalette, executeCommand, currentContext.transcriptId]
  );

  // Handle chat navigation
  const handleChat = useCallback(
    (message: string) => {
      navigateToChat(message);
    },
    [navigateToChat]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          handleAction(filteredActions[selectedIndex]);
        } else if (inputValue.trim()) {
          handleChat(inputValue);
        }
      }
    },
    [filteredActions, selectedIndex, inputValue, handleAction, handleChat]
  );

  if (!isCommandPaletteOpen) return null;

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '12vh',
      zIndex: 99999,
    },
    container: {
      width: '100%',
      maxWidth: '560px',
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
    icon: { fontSize: '20px' },
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
      maxHeight: '360px',
      overflowY: 'auto' as const,
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
    actionContent: { flex: 1 },
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
    <div style={styles.overlay} onClick={closeCommandPalette}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.inputWrapper}>
            <span style={styles.icon}>🤖</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask VoiceCode AI..."
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
          {currentContext.transcriptTitle && (
            <div style={styles.context}>
              📄 {currentContext.transcriptTitle}
            </div>
          )}
        </div>

        <div style={styles.content}>
          {isLoading ? (
            <div style={styles.loading}>Processing...</div>
          ) : (
            <>
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
                  onClick={() => handleAction(action)}
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

              {recentActions.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>Recent</div>
                  {recentActions.slice(0, 3).map((recent, index) => (
                    <div
                      key={index}
                      style={styles.actionItem}
                      onClick={() => handleChat(recent.query)}
                    >
                      <span style={styles.actionIcon}>🕒</span>
                      <div style={styles.actionContent}>
                        <div style={styles.actionLabel}>{recent.query}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        <div style={styles.footer}>
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalAgentOverlay;
