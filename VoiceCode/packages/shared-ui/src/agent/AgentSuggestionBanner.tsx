/**
 * AgentSuggestionBanner - Proactive suggestions display
 * Non-disruptive banner for AI-powered insights
 */

import React, { useState } from 'react';

interface Suggestion {
  id: string;
  type: 'action' | 'insight' | 'tip';
  text: string;
  icon?: string;
  command?: string;
  params?: Record<string, any>;
}

interface AgentSuggestionBannerProps {
  suggestions: Suggestion[];
  onAction: (command: string, params?: Record<string, any>) => void;
  onDismiss: (suggestionId: string) => void;
  onDismissAll?: () => void;
  variant?: 'card' | 'inline' | 'minimal';
}

export const AgentSuggestionBanner: React.FC<AgentSuggestionBannerProps> = ({
  suggestions,
  onAction,
  onDismiss,
  onDismissAll,
  variant = 'card',
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));

  if (visibleSuggestions.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds(new Set([...dismissedIds, id]));
    onDismiss(id);
  };

  const handleDismissAll = () => {
    setDismissedIds(new Set(suggestions.map((s) => s.id)));
    onDismissAll?.();
  };

  const typeStyles: Record<
    string,
    { bg: string; border: string; icon: string }
  > = {
    action: { bg: '#1e3a5f', border: '#3b82f6', icon: '⚡' },
    insight: { bg: '#1e3a3a', border: '#10b981', icon: '💡' },
    tip: { bg: '#3a2e1e', border: '#f59e0b', icon: '✨' },
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: '16px',
      backgroundColor: '#111827',
      borderRadius: '12px',
      border: '1px solid #374151',
      marginBottom: '16px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    headerIcon: {
      fontSize: '18px',
    },
    headerTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#e5e7eb',
    },
    dismissAllButton: {
      padding: '4px 8px',
      fontSize: '12px',
      color: '#6b7280',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
    },
    suggestionsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    suggestionItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      borderRadius: '8px',
      transition: 'all 0.15s ease',
    },
    suggestionLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flex: 1,
    },
    suggestionIcon: {
      fontSize: '16px',
    },
    suggestionText: {
      fontSize: '13px',
      color: '#e5e7eb',
    },
    suggestionActions: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: '#374151',
      color: '#e5e7eb',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.15s',
    },
    dismissButton: {
      padding: '4px 8px',
      fontSize: '14px',
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: 'none',
      cursor: 'pointer',
    },
    // Inline variant
    inlineContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      padding: '8px 0',
    },
    inlineItem: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      backgroundColor: '#1f2937',
      borderRadius: '20px',
      fontSize: '12px',
      color: '#e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    // Minimal variant
    minimalContainer: {
      padding: '8px 12px',
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      borderLeft: '3px solid #6366f1',
    },
    minimalText: {
      fontSize: '13px',
      color: '#9ca3af',
    },
  };

  if (variant === 'inline') {
    return (
      <div style={styles.inlineContainer}>
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            style={styles.inlineItem}
            onClick={() =>
              suggestion.command &&
              onAction(suggestion.command, suggestion.params)
            }
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              suggestion.command &&
              onAction(suggestion.command, suggestion.params)
            }
            role="button"
            tabIndex={0}
          >
            <span>{typeStyles[suggestion.type].icon}</span>
            <span>{suggestion.text}</span>
            <button
              style={styles.dismissButton}
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(suggestion.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    const first = visibleSuggestions[0];
    return (
      <div style={styles.minimalContainer}>
        <span style={styles.minimalText}>
          {typeStyles[first.type].icon} {first.text}
          {first.command && (
            <button
              style={{ ...styles.actionButton, marginLeft: '12px' }}
              onClick={() => onAction(first.command!, first.params)}
            >
              Go
            </button>
          )}
        </span>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>💡</span>
          <span style={styles.headerTitle}>AI Suggestions</span>
        </div>
        {visibleSuggestions.length > 1 && onDismissAll && (
          <button style={styles.dismissAllButton} onClick={handleDismissAll}>
            Dismiss all
          </button>
        )}
      </div>

      <div style={styles.suggestionsList}>
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            style={{
              ...styles.suggestionItem,
              backgroundColor: typeStyles[suggestion.type].bg,
              borderLeft: `3px solid ${typeStyles[suggestion.type].border}`,
            }}
          >
            <div style={styles.suggestionLeft}>
              <span style={styles.suggestionIcon}>
                {suggestion.icon || typeStyles[suggestion.type].icon}
              </span>
              <span style={styles.suggestionText}>{suggestion.text}</span>
            </div>
            <div style={styles.suggestionActions}>
              {suggestion.command && (
                <button
                  style={styles.actionButton}
                  onClick={() =>
                    onAction(suggestion.command!, suggestion.params)
                  }
                >
                  {suggestion.type === 'action' ? 'Do it' : 'View'}
                </button>
              )}
              <button
                style={styles.dismissButton}
                onClick={() => handleDismiss(suggestion.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentSuggestionBanner;
