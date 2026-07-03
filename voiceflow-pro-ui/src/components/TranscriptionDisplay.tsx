// Transcription Display Component for VoiceFlow Pro

import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Edit3, 
  Save, 
  X, 
  CheckCircle, 
  Clock, 
  Volume2,
  Settings,
  Download,
  Share2,
} from 'lucide-react';
import { TranscriptionSegment, AccessibilityProps } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  getFocusStyles, 
  announceToScreenReader, 
  generateAriaLabel,
  useHighContrast,
} from '@/utils/accessibility';

interface TranscriptionDisplayProps extends AccessibilityProps {
  segments?: TranscriptionSegment[];
  onSegmentEdit?: (segmentId: string, newText: string) => void;
  onTextCopy?: (text: string) => void;
  onTextExport?: (text: string, format: 'txt' | 'pdf' | 'docx') => void;
  onTextShare?: (text: string) => void;
  editable?: boolean;
  showTimestamps?: boolean;
  showConfidence?: boolean;
  showSpeaker?: boolean;
  autoScroll?: boolean;
  maxHeight?: string;
  className?: string;
}

export const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  segments = [],
  onSegmentEdit,
  onTextCopy,
  onTextExport,
  onTextShare,
  editable = false,
  showTimestamps = true,
  showConfidence = true,
  showSpeaker = false,
  autoScroll = true,
  maxHeight = '400px',
  className = '',
  ...accessibilityProps
}) => {
  const { colors, spacing, borderRadius, platform, typography } = useTheme();
  const { settings } = useSettings();
  const isHighContrast = useHighContrast();
  
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [isTextSelected, setIsTextSelected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new segments are added
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, autoScroll]);

  // Format timestamp for display
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return colors.success;
    if (confidence >= 0.7) return colors.warning;
    return colors.error;
  };

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setIsTextSelected(true);
    } else {
      setIsTextSelected(false);
      setSelectedText('');
    }
  };

  // Start editing a segment
  const startEditing = (segment: TranscriptionSegment) => {
    if (!editable) return;
    setEditingSegment(segment.id);
    setEditText(segment.text);
  };

  // Save edited segment
  const saveEdit = () => {
    if (editingSegment && editText.trim()) {
      onSegmentEdit?.(editingSegment, editText.trim());
      setEditingSegment(null);
      setEditText('');
      announceToScreenReader('Text updated successfully', 'polite');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingSegment(null);
    setEditText('');
  };

  // Copy selected text or entire transcription
  const copyText = (text?: string) => {
    const textToCopy = text || selectedText || segments.map(s => s.text).join(' ');
    navigator.clipboard.writeText(textToCopy).then(() => {
      onTextCopy?.(textToCopy);
      announceToScreenReader('Text copied to clipboard', 'polite');
    });
  };

  // Export text in different formats
  const exportText = (format: 'txt' | 'pdf' | 'docx') => {
    const text = segments.map(s => s.text).join('\n\n');
    onTextExport?.(text, format);
    announceToScreenReader(`Text exported as ${format.toUpperCase()}`, 'polite');
  };

  // Calculate overall confidence
  const overallConfidence = segments.length > 0 
    ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length 
    : 1;

  const focusStyles = getFocusStyles(platform, isHighContrast);

  // Component styles
  const containerStyles: React.CSSProperties = {
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.background,
    overflow: 'hidden',
    maxHeight,
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  };

  const segmentStyles: React.CSSProperties = {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.border}`,
    cursor: editable ? 'text' : 'default',
    transition: 'background-color 0.2s ease',
    position: 'relative',
  };

  const textAreaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '60px',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily,
    resize: 'vertical',
    outline: 'none',
    backgroundColor: colors.background,
    color: colors.text,
    ...focusStyles,
  };

  return (
    <div 
      {...accessibilityProps}
      className={`transcription-display ${className}`}
      style={containerStyles}
      onMouseUp={handleTextSelection}
      onKeyUp={handleTextSelection}
    >
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <h3 
            style={{ 
              margin: 0, 
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text,
            }}
          >
            Transcription
          </h3>
          
          {segments.length > 0 && (
            <span 
              style={{ 
                fontSize: '12px', 
                color: colors.textSecondary,
                backgroundColor: colors.backgroundTertiary,
                padding: '2px 6px',
                borderRadius: borderRadius.small,
              }}
            >
              {segments.length} {segments.length === 1 ? 'segment' : 'segments'}
            </span>
          )}

          {/* Overall confidence indicator */}
          {showConfidence && segments.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle 
                size={14} 
                color={getConfidenceColor(overallConfidence)}
              />
              <span 
                style={{ 
                  fontSize: '12px', 
                  color: getConfidenceColor(overallConfidence),
                  fontWeight: '500',
                }}
              >
                {Math.round(overallConfidence * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          {isTextSelected && (
            <button
              aria-label="Copy selected text"
              onClick={() => copyText()}
              style={{
                padding: spacing.xs,
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                borderRadius: borderRadius.small,
                cursor: 'pointer',
                ...focusStyles,
              }}
            >
              <Copy size={16} />
            </button>
          )}

          {segments.length > 0 && (
            <>
              <button
                aria-label="Copy entire transcription"
                onClick={() => copyText()}
                style={{
                  padding: spacing.xs,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  borderRadius: borderRadius.small,
                  cursor: 'pointer',
                  ...focusStyles,
                }}
              >
                <Copy size={16} />
              </button>

              <button
                aria-label="Export transcription"
                onClick={() => {}}
                style={{
                  padding: spacing.xs,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  borderRadius: borderRadius.small,
                  cursor: 'pointer',
                  ...focusStyles,
                }}
              >
                <Download size={16} />
              </button>

              <button
                aria-label="Share transcription"
                onClick={() => {}}
                style={{
                  padding: spacing.xs,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  borderRadius: borderRadius.small,
                  cursor: 'pointer',
                  ...focusStyles,
                }}
              >
                <Share2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: `calc(${maxHeight} - ${spacing.lg})`,
        }}
        role="log"
        aria-label="Transcription content"
        aria-live="polite"
      >
        {segments.length === 0 ? (
          <div
            style={{
              padding: spacing.xl,
              textAlign: 'center',
              color: colors.textTertiary,
              fontStyle: 'italic',
            }}
          >
            No transcription yet. Start recording to see text appear here.
          </div>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.id}
              style={segmentStyles}
              onDoubleClick={() => startEditing(segment)}
              role="article"
              aria-label={`Transcription segment ${formatTimestamp(segment.startTime)}`}
            >
              {/* Segment header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.xs,
                  fontSize: '12px',
                  color: colors.textTertiary,
                }}
              >
                {showTimestamps && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {formatTimestamp(segment.startTime)} - {formatTimestamp(segment.endTime)}
                  </span>
                )}

                {showSpeaker && segment.speaker && (
                  <span
                    style={{
                      backgroundColor: colors.backgroundTertiary,
                      padding: '2px 6px',
                      borderRadius: borderRadius.small,
                      fontWeight: '500',
                    }}
                  >
                    {segment.speaker}
                  </span>
                )}

                {showConfidence && (
                  <span
                    style={{
                      color: getConfidenceColor(segment.confidence),
                      fontWeight: '500',
                    }}
                  >
                    {Math.round(segment.confidence * 100)}%
                  </span>
                )}

                {/* Edit indicator for non-final segments */}
                {!segment.isFinal && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: colors.warning,
                      textTransform: 'uppercase',
                      fontWeight: '600',
                    }}
                  >
                    Draft
                  </span>
                )}
              </div>

              {/* Segment text */}
              {editingSegment === segment.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={textAreaStyles}
                    aria-label="Edit transcription text"
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: spacing.xs, marginTop: spacing.xs }}>
                    <button
                      aria-label="Save changes"
                      onClick={saveEdit}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.primary,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: borderRadius.small,
                        cursor: 'pointer',
                        fontSize: '12px',
                        ...focusStyles,
                      }}
                    >
                      <Save size={12} style={{ marginRight: '4px' }} />
                      Save
                    </button>
                    <button
                      aria-label="Cancel editing"
                      onClick={cancelEdit}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: 'transparent',
                        color: colors.textSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.small,
                        cursor: 'pointer',
                        fontSize: '12px',
                        ...focusStyles,
                      }}
                    >
                      <X size={12} style={{ marginRight: '4px' }} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: typography.fontSize.md,
                    lineHeight: typography.lineHeight.normal,
                    color: segment.isFinal ? colors.text : colors.textSecondary,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {segment.text}
                </div>
              )}

              {/* Edit button for non-editing segments */}
              {editable && editingSegment !== segment.id && (
                <button
                  aria-label={`Edit segment starting at ${formatTimestamp(segment.startTime)}`}
                  onClick={() => startEditing(segment)}
                  style={{
                    position: 'absolute',
                    top: spacing.sm,
                    right: spacing.sm,
                    padding: spacing.xs,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.textTertiary,
                    borderRadius: borderRadius.small,
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                  }}
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer with stats */}
      {segments.length > 0 && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.backgroundSecondary,
            borderTop: `1px solid ${colors.border}`,
            fontSize: '12px',
            color: colors.textTertiary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            Total duration: {formatTimestamp(segments[segments.length - 1]?.endTime || 0)}
          </span>
          <span>
            Words: {segments.reduce((sum, s) => sum + s.text.split(' ').length, 0)}
          </span>
        </div>
      )}
    </div>
  );
};