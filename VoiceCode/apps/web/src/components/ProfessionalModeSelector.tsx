// Professional Mode Selector Component
// Allows users to switch between different professional modes

import React, { useState, useRef, useEffect } from 'react';
import { useProfessionalMode } from '@/contexts/ProfessionalModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfessionalMode } from '@/types';

export interface ProfessionalModeSelectorProps {
  compact?: boolean;
  showDescription?: boolean;
  onModeChange?: (mode: ProfessionalMode) => void;
}

export const ProfessionalModeSelector: React.FC<ProfessionalModeSelectorProps> = ({
  compact = false,
  showDescription = true,
  onModeChange,
}) => {
  const { currentMode, availableModes, switchMode } = useProfessionalMode();
  const { colors, spacing } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleModeSelect = (mode: ProfessionalMode) => {
    switchMode(mode);
    setIsOpen(false);
    onModeChange?.(mode);
  };

  const currentModeConfig = availableModes.find(m => m.mode === currentMode);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (compact) {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: colors.text,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.surfaceHover;
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.surface;
            e.currentTarget.style.borderColor = colors.border;
          }}
        >
          <span style={{ fontSize: '20px' }}>{currentModeConfig?.icon}</span>
          <span>{currentModeConfig?.displayName}</span>
          <span style={{ fontSize: '12px', opacity: 0.6 }}>▼</span>
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: spacing.xs,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '250px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {availableModes.map((mode) => (
              <button
                key={mode.mode}
                onClick={() => handleModeSelect(mode.mode)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  backgroundColor: mode.mode === currentMode ? colors.primaryLight : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (mode.mode !== currentMode) {
                    e.currentTarget.style.backgroundColor = colors.surfaceHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (mode.mode !== currentMode) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '24px' }}>{mode.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: colors.text }}>{mode.displayName}</div>
                  {showDescription && (
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                      {mode.description}
                    </div>
                  )}
                </div>
                {mode.mode === currentMode && (
                  <span style={{ color: colors.primary, fontSize: '16px' }}>✓</span>
                )}
              </button>
            ))}
          </div>
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
      <h3
        style={{
          margin: 0,
          marginBottom: spacing.md,
          fontSize: '18px',
          fontWeight: 600,
          color: colors.text,
        }}
      >
        Select Professional Mode
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: spacing.md,
        }}
      >
        {availableModes.map((mode) => (
          <button
            key={mode.mode}
            onClick={() => handleModeSelect(mode.mode)}
            style={{
              padding: spacing.lg,
              backgroundColor: mode.mode === currentMode ? colors.primaryLight : colors.background,
              border: `2px solid ${mode.mode === currentMode ? colors.primary : colors.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (mode.mode !== currentMode) {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (mode.mode !== currentMode) {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {mode.mode === currentMode && (
              <div
                style={{
                  position: 'absolute',
                  top: spacing.sm,
                  right: spacing.sm,
                  color: colors.primary,
                  fontSize: '20px',
                }}
              >
                ✓
              </div>
            )}

            <div style={{ fontSize: '36px', marginBottom: spacing.sm }}>{mode.icon}</div>

            <h4
              style={{
                margin: 0,
                marginBottom: spacing.xs,
                fontSize: '16px',
                fontWeight: 600,
                color: colors.text,
              }}
            >
              {mode.displayName}
            </h4>

            <p
              style={{
                margin: 0,
                marginBottom: spacing.md,
                fontSize: '13px',
                color: colors.textSecondary,
                lineHeight: 1.5,
              }}
            >
              {mode.description}
            </p>

            <div style={{ marginTop: spacing.md }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                }}
              >
                Key Features:
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing.lg,
                  fontSize: '12px',
                  color: colors.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                {mode.features.slice(0, 3).map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
                {mode.features.length > 3 && (
                  <li style={{ fontStyle: 'italic' }}>
                    +{mode.features.length - 3} more features
                  </li>
                )}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfessionalModeSelector;

