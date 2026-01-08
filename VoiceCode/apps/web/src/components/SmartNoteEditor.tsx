// Smart Note Editor Component
// AI-powered note editor with real-time formatting and suggestions

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useProfessionalMode } from '@/contexts/ProfessionalModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NoteTemplate, AIProcessingResult, AISuggestion } from '@/types';

export interface SmartNoteEditorProps {
  initialContent?: string;
  template?: NoteTemplate;
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
  autoFormat?: boolean;
  showAISuggestions?: boolean;
}

export const SmartNoteEditor: React.FC<SmartNoteEditorProps> = ({
  initialContent = '',
  template,
  onContentChange,
  onSave,
  autoFormat = true,
  showAISuggestions = true,
}) => {
  const { modeConfig, formatNote, aiConfig } = useProfessionalMode();
  const { colors, spacing } = useTheme();
  
  const [content, setContent] = useState(initialContent);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [processingResult, setProcessingResult] = useState<AIProcessingResult | null>(null);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);

    // Debounce AI processing
    if (autoFormat && aiConfig.realTimeProcessing) {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      processingTimeoutRef.current = setTimeout(() => {
        processContent(newContent);
      }, 1000);
    }
  }, [autoFormat, aiConfig.realTimeProcessing, onContentChange]);

  // Process content with AI
  const processContent = useCallback(async (text: string) => {
    if (!text.trim() || !aiConfig.enabled) return;

    setIsProcessing(true);
    try {
      // This will integrate with the AI processor service
      const formatted = await formatNote(text);
      
      // Mock AI suggestions for now
      const mockSuggestions: AISuggestion[] = [];
      
      setSuggestions(mockSuggestions);
      
      if (aiConfig.autoSuggestions && mockSuggestions.length > 0) {
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error processing content:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [formatNote, aiConfig]);

  // Apply AI suggestion
  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    const { start, end } = suggestion.position;
    const newContent = 
      content.substring(0, start) + 
      suggestion.suggested + 
      content.substring(end);
    
    handleContentChange(newContent);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, [content, handleContentChange]);

  // Format entire note
  const handleFormatNote = useCallback(async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      const formatted = await formatNote(content);
      handleContentChange(formatted);
    } catch (error) {
      console.error('Error formatting note:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [content, formatNote, handleContentChange]);

  // Save note
  const handleSave = useCallback(() => {
    onSave?.(content);
  }, [content, onSave]);

  // Render template structure
  const renderTemplateStructure = () => {
    if (!template) return null;

    return (
      <div
        style={{
          marginBottom: spacing.md,
          padding: spacing.md,
          backgroundColor: colors.primaryLight,
          borderRadius: '8px',
          border: `1px solid ${colors.primary}`,
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: colors.primary,
            marginBottom: spacing.sm,
          }}
        >
          📋 Template: {template.name}
        </div>
        <div style={{ fontSize: '12px', color: colors.text }}>
          {template.structure.map((section, index) => (
            <div key={section.id} style={{ marginBottom: spacing.xs }}>
              <span style={{ fontWeight: 600 }}>
                {index + 1}. {section.title}
                {section.required && <span style={{ color: colors.error }}> *</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.md,
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '20px' }}>{modeConfig.icon}</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
            {modeConfig.displayName} Mode
          </span>
          {isProcessing && (
            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
              🤖 Processing...
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            onClick={handleFormatNote}
            disabled={isProcessing || !content.trim()}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: 'transparent',
              color: colors.primary,
              border: `1px solid ${colors.primary}`,
              borderRadius: '6px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              opacity: isProcessing || !content.trim() ? 0.5 : 1,
            }}
          >
            ✨ Format
          </button>

          <button
            onClick={handleSave}
            disabled={!content.trim()}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: !content.trim() ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              opacity: !content.trim() ? 0.5 : 1,
            }}
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Main Editor */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: spacing.lg,
            overflowY: 'auto',
          }}
        >
          {renderTemplateStructure()}

          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={
              template
                ? `Start speaking or typing to fill in the ${template.name} template...`
                : 'Start speaking or typing your notes...'
            }
            style={{
              flex: 1,
              width: '100%',
              padding: spacing.md,
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.text,
              fontSize: '14px',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />

          {/* Word count and stats */}
          <div
            style={{
              marginTop: spacing.sm,
              fontSize: '12px',
              color: colors.textSecondary,
              display: 'flex',
              gap: spacing.md,
            }}
          >
            <span>Words: {content.split(/\s+/).filter(w => w).length}</span>
            <span>Characters: {content.length}</span>
            {template && (
              <span>
                Sections: {template.structure.length}
              </span>
            )}
          </div>
        </div>

        {/* AI Suggestions Panel */}
        {showAISuggestions && suggestions.length > 0 && showSuggestions && (
          <div
            style={{
              width: '300px',
              borderLeft: `1px solid ${colors.border}`,
              padding: spacing.md,
              overflowY: 'auto',
              backgroundColor: colors.background,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text,
                }}
              >
                🤖 AI Suggestions
              </h4>
              <button
                onClick={() => setShowSuggestions(false)}
                style={{
                  padding: spacing.xs,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  style={{
                    padding: spacing.sm,
                    backgroundColor: colors.surface,
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: colors.primary,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {suggestion.type.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.textSecondary,
                      marginBottom: spacing.xs,
                      textDecoration: 'line-through',
                    }}
                  >
                    {suggestion.original}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.text,
                      fontWeight: 500,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {suggestion.suggested}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: colors.textSecondary,
                      marginBottom: spacing.sm,
                    }}
                  >
                    {suggestion.reason}
                  </div>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    style={{
                      width: '100%',
                      padding: spacing.xs,
                      backgroundColor: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNoteEditor;

