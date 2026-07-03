// Template Selector Component
// Allows users to select and apply note templates

import React, { useState } from 'react';
import { useProfessionalMode } from '@/contexts/ProfessionalModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NoteTemplate } from '@/types';

export interface TemplateSelectorProps {
  onTemplateSelect?: (template: NoteTemplate) => void;
  onCreateNew?: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  onCreateNew,
}) => {
  const { templates, activeTemplate, selectTemplate, modeConfig } = useProfessionalMode();
  const { colors, spacing } = useTheme();
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (template: NoteTemplate) => {
    selectTemplate(template.id);
    onTemplateSelect?.(template);
  };

  const toggleExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  if (templates.length === 0) {
    return (
      <div
        style={{
          padding: spacing.xl,
          backgroundColor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📝</div>
        <h3 style={{ margin: 0, marginBottom: spacing.sm, color: colors.text }}>
          No Templates Available
        </h3>
        <p style={{ margin: 0, marginBottom: spacing.lg, color: colors.textSecondary }}>
          No templates are available for {modeConfig.displayName} mode yet.
        </p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Create Custom Template
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
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
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: colors.text,
          }}
        >
          Note Templates
        </h3>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: 'transparent',
              color: colors.primary,
              border: `1px solid ${colors.primary}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.primary;
            }}
          >
            + New Template
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {templates.map((template) => {
          const isActive = activeTemplate?.id === template.id;
          const isExpanded = expandedTemplate === template.id;

          return (
            <div
              key={template.id}
              style={{
                backgroundColor: isActive ? colors.primaryLight : colors.background,
                border: `1px solid ${isActive ? colors.primary : colors.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: spacing.md,
                  cursor: 'pointer',
                }}
                onClick={() => handleTemplateSelect(template)}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginBottom: spacing.xs,
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      {template.name}
                    </h4>
                    {isActive && (
                      <span
                        style={{
                          padding: `2px ${spacing.xs}`,
                          backgroundColor: colors.primary,
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: colors.textSecondary,
                      lineHeight: 1.4,
                    }}
                  >
                    {template.description}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(template.id);
                  }}
                  style={{
                    padding: spacing.xs,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.textSecondary,
                    fontSize: '12px',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </button>
              </div>

              {isExpanded && (
                <div
                  style={{
                    padding: spacing.md,
                    paddingTop: 0,
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colors.textSecondary,
                      marginBottom: spacing.sm,
                    }}
                  >
                    Template Structure:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                    {template.structure
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                        <div
                          key={section.id}
                          style={{
                            padding: spacing.sm,
                            backgroundColor: colors.surface,
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs,
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: colors.textSecondary,
                              }}
                            >
                              {section.order}.
                            </span>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: colors.text,
                              }}
                            >
                              {section.title}
                            </span>
                            {section.required && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: colors.error,
                                  fontWeight: 600,
                                }}
                              >
                                *
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: colors.textSecondary,
                              fontStyle: 'italic',
                            }}
                          >
                            {section.placeholder}
                          </div>
                        </div>
                      ))}
                  </div>

                  {template.aiPrompt && (
                    <div
                      style={{
                        marginTop: spacing.md,
                        padding: spacing.sm,
                        backgroundColor: colors.primaryLight,
                        borderRadius: '6px',
                        border: `1px solid ${colors.primary}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: colors.primary,
                          marginBottom: '4px',
                        }}
                      >
                        🤖 AI Formatting
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: colors.text,
                          lineHeight: 1.4,
                        }}
                      >
                        {template.aiPrompt}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;

