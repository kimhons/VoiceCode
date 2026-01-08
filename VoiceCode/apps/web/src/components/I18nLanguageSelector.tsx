/**
 * I18n Language Selector Component
 * Phase 5.3: Multi-Language UI
 * 
 * Simple language selection dropdown for i18n
 */

import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { Language } from '../services/i18n.service';

export const I18nLanguageSelector: React.FC = () => {
  const {
    language,
    languageMetadata,
    setLanguage,
    getAvailableLanguages,
    t,
    isLoading,
    error,
    clearError,
  } = useI18n({ autoLoad: true });

  const [isOpen, setIsOpen] = useState(false);
  const availableLanguages = getAvailableLanguages();

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      await setLanguage(newLanguage);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to change language:', err);
    }
  };

  return (
    <div style={{
      position: 'relative',
      fontFamily: 'var(--font-family, Arial, sans-serif)',
    }}>
      {/* Error Message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: 0,
          right: 0,
          padding: 'var(--spacing-md, 12px)',
          backgroundColor: 'var(--color-error, #dc3545)',
          color: 'white',
          borderRadius: 'var(--border-radius-md, 8px)',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              padding: '2px 8px',
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

      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm, 8px)',
          padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-md, 8px)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: 'var(--font-size-base, 1rem)',
          color: 'var(--color-text, #212529)',
          transition: 'all 0.2s',
          minWidth: '150px',
          opacity: isLoading ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8f9fa)';
            e.currentTarget.style.borderColor = 'var(--color-primary, #007bff)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface, #ffffff)';
          e.currentTarget.style.borderColor = 'var(--color-border, #dee2e6)';
        }}
      >
        <span style={{ fontSize: '1.2em' }}>{languageMetadata.flag}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{languageMetadata.nativeName}</span>
        <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary, #6c757d)' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />

          {/* Dropdown Menu */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #dee2e6)',
            borderRadius: 'var(--border-radius-md, 8px)',
            boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
          }}>
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm, 8px)',
                  padding: 'var(--spacing-md, 12px)',
                  backgroundColor: language === lang.code
                    ? 'var(--color-primary-light, #e7f3ff)'
                    : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border-light, #e9ecef)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-base, 1rem)',
                  color: 'var(--color-text, #212529)',
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover, #f8f9fa)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (language !== lang.code) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '1.2em' }}>{lang.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: language === lang.code ? '600' : '400' }}>
                    {lang.nativeName}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-xs, 0.75rem)',
                    color: 'var(--color-text-secondary, #6c757d)',
                  }}>
                    {lang.name}
                  </div>
                </div>
                {language === lang.code && (
                  <span style={{ color: 'var(--color-primary, #007bff)', fontWeight: 'bold' }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default I18nLanguageSelector;

