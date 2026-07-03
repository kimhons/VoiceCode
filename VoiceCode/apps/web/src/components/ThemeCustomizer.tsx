/**
 * Theme Customizer Component
 * Phase 5.2: Customizable Themes
 * 
 * Comprehensive theme customization UI
 */

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ColorScheme, FontFamily, Spacing } from '../services/theme.service';

export const ThemeCustomizer: React.FC = () => {
  const {
    theme,
    isLoading,
    toggleMode,
    setColorScheme,
    setFontFamily,
    setSpacing,
    exportTheme,
    importTheme,
    availableColorSchemes,
    availableFontFamilies,
    availableSpacings,
    error,
    clearError,
  } = useTheme({ autoLoad: true });

  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');

  if (isLoading || !theme) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--font-family, Arial, sans-serif)' }}>
        Loading theme customizer...
      </div>
    );
  }

  const colorSchemeNames: Record<ColorScheme, string> = {
    default: 'Default Blue',
    ocean: 'Ocean Blue',
    forest: 'Forest Green',
    sunset: 'Sunset Orange',
    midnight: 'Midnight Blue',
    lavender: 'Lavender Purple',
    crimson: 'Crimson Red',
    amber: 'Amber Gold',
    slate: 'Slate Gray',
    rose: 'Rose Pink',
  };

  const fontFamilyNames: Record<FontFamily, string> = {
    inter: 'Inter',
    roboto: 'Roboto',
    'open-sans': 'Open Sans',
    lato: 'Lato',
    poppins: 'Poppins',
    montserrat: 'Montserrat',
  };

  const spacingNames: Record<Spacing, string> = {
    compact: 'Compact',
    normal: 'Normal',
    comfortable: 'Comfortable',
  };

  const handleExport = () => {
    const json = exportTheme();
    if (json) {
      // Copy to clipboard
      navigator.clipboard.writeText(json);
      alert('Theme exported to clipboard!');
    }
  };

  const handleImport = () => {
    try {
      importTheme(importJson);
      setShowImport(false);
      setImportJson('');
      alert('Theme imported successfully!');
    } catch (err) {
      alert('Failed to import theme. Please check the JSON format.');
    }
  };

  return (
    <div style={{
      padding: 'var(--spacing-xl, 24px)',
      fontFamily: 'var(--font-family, Arial, sans-serif)',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: 'var(--color-background, #ffffff)',
      color: 'var(--color-text, #212529)',
    }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg, 16px)' }}>🎨 Theme Customizer</h1>
      <p style={{ color: 'var(--color-text-secondary, #6c757d)', marginBottom: 'var(--spacing-2xl, 32px)' }}>
        Customize your VoiceFlow Pro experience with beautiful themes
      </p>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: 'var(--spacing-md, 12px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-error, #dc3545)',
          color: 'white',
          borderRadius: 'var(--border-radius-md, 8px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              padding: '5px 10px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Theme Mode */}
      <div style={{
        padding: 'var(--spacing-lg, 16px)',
        marginBottom: 'var(--spacing-lg, 16px)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #dee2e6)',
        borderRadius: 'var(--border-radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>Theme Mode</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md, 12px)' }}>
          <button
            onClick={toggleMode}
            style={{
              flex: 1,
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-primary, #007bff)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-hover, #0056b3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary, #007bff)';
            }}
          >
            {theme.mode === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
          </button>
        </div>
        <p style={{
          marginTop: 'var(--spacing-sm, 8px)',
          marginBottom: 0,
          fontSize: 'var(--font-size-sm, 0.875rem)',
          color: 'var(--color-text-secondary, #6c757d)',
        }}>
          Current mode: <strong>{theme.mode === 'light' ? 'Light' : 'Dark'}</strong>
        </p>
      </div>

      {/* Color Schemes */}
      <div style={{
        padding: 'var(--spacing-lg, 16px)',
        marginBottom: 'var(--spacing-lg, 16px)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #dee2e6)',
        borderRadius: 'var(--border-radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>Color Scheme</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 'var(--spacing-md, 12px)',
        }}>
          {availableColorSchemes.map((scheme) => (
            <button
              key={scheme}
              onClick={() => setColorScheme(scheme)}
              style={{
                padding: 'var(--spacing-md, 12px)',
                backgroundColor: theme.colorScheme === scheme
                  ? 'var(--color-primary, #007bff)'
                  : 'var(--color-surface-hover, #f8f9fa)',
                color: theme.colorScheme === scheme
                  ? 'var(--color-text-inverse, #ffffff)'
                  : 'var(--color-text, #212529)',
                border: `2px solid ${theme.colorScheme === scheme ? 'var(--color-primary, #007bff)' : 'var(--color-border, #dee2e6)'}`,
                borderRadius: 'var(--border-radius-md, 8px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: theme.colorScheme === scheme ? '600' : '400',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (theme.colorScheme !== scheme) {
                  e.currentTarget.style.borderColor = 'var(--color-primary, #007bff)';
                }
              }}
              onMouseLeave={(e) => {
                if (theme.colorScheme !== scheme) {
                  e.currentTarget.style.borderColor = 'var(--color-border, #dee2e6)';
                }
              }}
            >
              {colorSchemeNames[scheme]}
              {theme.colorScheme === scheme && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div style={{
        padding: 'var(--spacing-lg, 16px)',
        marginBottom: 'var(--spacing-lg, 16px)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #dee2e6)',
        borderRadius: 'var(--border-radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>Font Family</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 'var(--spacing-md, 12px)',
        }}>
          {availableFontFamilies.map((font) => (
            <button
              key={font}
              onClick={() => setFontFamily(font)}
              style={{
                padding: 'var(--spacing-md, 12px)',
                backgroundColor: theme.fontFamily === font
                  ? 'var(--color-primary, #007bff)'
                  : 'var(--color-surface-hover, #f8f9fa)',
                color: theme.fontFamily === font
                  ? 'var(--color-text-inverse, #ffffff)'
                  : 'var(--color-text, #212529)',
                border: `2px solid ${theme.fontFamily === font ? 'var(--color-primary, #007bff)' : 'var(--color-border, #dee2e6)'}`,
                borderRadius: 'var(--border-radius-md, 8px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: theme.fontFamily === font ? '600' : '400',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (theme.fontFamily !== font) {
                  e.currentTarget.style.borderColor = 'var(--color-primary, #007bff)';
                }
              }}
              onMouseLeave={(e) => {
                if (theme.fontFamily !== font) {
                  e.currentTarget.style.borderColor = 'var(--color-border, #dee2e6)';
                }
              }}
            >
              {fontFamilyNames[font]}
              {theme.fontFamily === font && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div style={{
        padding: 'var(--spacing-lg, 16px)',
        marginBottom: 'var(--spacing-lg, 16px)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #dee2e6)',
        borderRadius: 'var(--border-radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>Spacing</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md, 12px)' }}>
          {availableSpacings.map((space) => (
            <button
              key={space}
              onClick={() => setSpacing(space)}
              style={{
                flex: 1,
                padding: 'var(--spacing-md, 12px)',
                backgroundColor: theme.spacing.md === (space === 'compact' ? '8px' : space === 'normal' ? '12px' : '16px')
                  ? 'var(--color-primary, #007bff)'
                  : 'var(--color-surface-hover, #f8f9fa)',
                color: theme.spacing.md === (space === 'compact' ? '8px' : space === 'normal' ? '12px' : '16px')
                  ? 'var(--color-text-inverse, #ffffff)'
                  : 'var(--color-text, #212529)',
                border: `2px solid ${theme.spacing.md === (space === 'compact' ? '8px' : space === 'normal' ? '12px' : '16px') ? 'var(--color-primary, #007bff)' : 'var(--color-border, #dee2e6)'}`,
                borderRadius: 'var(--border-radius-md, 8px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: theme.spacing.md === (space === 'compact' ? '8px' : space === 'normal' ? '12px' : '16px') ? '600' : '400',
                transition: 'all 0.2s',
              }}
            >
              {spacingNames[space]}
              {theme.spacing.md === (space === 'compact' ? '8px' : space === 'normal' ? '12px' : '16px') && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Import/Export */}
      <div style={{
        padding: 'var(--spacing-lg, 16px)',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #dee2e6)',
        borderRadius: 'var(--border-radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>Import / Export</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md, 12px)', marginBottom: 'var(--spacing-md, 12px)' }}>
          <button
            onClick={handleExport}
            style={{
              flex: 1,
              padding: 'var(--spacing-md, 12px)',
              backgroundColor: 'var(--color-secondary, #6c757d)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              fontWeight: '500',
            }}
          >
            📤 Export Theme
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            style={{
              flex: 1,
              padding: 'var(--spacing-md, 12px)',
              backgroundColor: 'var(--color-secondary, #6c757d)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              fontWeight: '500',
            }}
          >
            📥 Import Theme
          </button>
        </div>

        {showImport && (
          <div>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste theme JSON here..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: 'var(--spacing-md, 12px)',
                border: '1px solid var(--color-border, #dee2e6)',
                borderRadius: 'var(--border-radius-md, 8px)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontFamily: 'monospace',
                marginBottom: 'var(--spacing-md, 12px)',
                backgroundColor: 'var(--color-background-secondary, #f8f9fa)',
                color: 'var(--color-text, #212529)',
              }}
            />
            <button
              onClick={handleImport}
              style={{
                padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
                backgroundColor: 'var(--color-success, #28a745)',
                color: 'var(--color-text-inverse, #ffffff)',
                border: 'none',
                borderRadius: 'var(--border-radius-md, 8px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: '500',
              }}
            >
              Import
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeCustomizer;

