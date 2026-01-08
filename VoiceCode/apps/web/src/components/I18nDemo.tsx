/**
 * I18n Demo Component
 * Phase 5.3: Multi-Language UI
 * 
 * Demonstrates internationalization features
 */

import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { I18nLanguageSelector } from './I18nLanguageSelector';

export const I18nDemo: React.FC = () => {
  const {
    t,
    language,
    isRTL,
    languageMetadata,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
  } = useI18n({ autoLoad: true });

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return (
    <div style={{
      padding: 'var(--spacing-xl, 24px)',
      fontFamily: 'var(--font-family, Arial, sans-serif)',
      backgroundColor: 'var(--color-background, #ffffff)',
      color: 'var(--color-text, #212529)',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: 'var(--spacing-lg, 16px)' }}>
          🌐 {t('common.app_name')} - {t('settings.language')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary, #6c757d)', marginBottom: 'var(--spacing-2xl, 32px)' }}>
          {t('common.welcome')} to the internationalization demo
        </p>

        {/* Language Selector */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
            {t('settings.language')}
          </h2>
          <p style={{
            marginBottom: 'var(--spacing-md, 12px)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: 'var(--color-text-secondary, #6c757d)',
          }}>
            Current: {languageMetadata.flag} {languageMetadata.nativeName} ({languageMetadata.name})
            {isRTL && ' - RTL'}
          </p>
          <I18nLanguageSelector />
        </div>

        {/* Common Translations */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
            Common Translations
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md, 12px)' }}>
            {[
              'common.save',
              'common.cancel',
              'common.delete',
              'common.edit',
              'common.search',
              'common.export',
              'common.import',
              'common.settings',
              'common.help',
              'common.yes',
              'common.no',
              'common.ok',
            ].map((key) => (
              <div
                key={key}
                style={{
                  padding: 'var(--spacing-sm, 8px)',
                  backgroundColor: 'var(--color-background-secondary, #f8f9fa)',
                  borderRadius: 'var(--border-radius-sm, 4px)',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                }}
              >
                <div style={{ color: 'var(--color-text-tertiary, #adb5bd)', fontSize: 'var(--font-size-xs, 0.75rem)' }}>
                  {key}
                </div>
                <div style={{ fontWeight: '500' }}>
                  {t(key as any)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
            {t('nav.home')}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)' }}>
            {[
              'nav.home',
              'nav.transcripts',
              'nav.recordings',
              'nav.analytics',
              'nav.collaboration',
              'nav.settings',
            ].map((key) => (
              <button
                key={key}
                style={{
                  padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
                  backgroundColor: 'var(--color-primary, #007bff)',
                  color: 'var(--color-text-inverse, #ffffff)',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md, 8px)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  fontWeight: '500',
                }}
              >
                {t(key as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time Formatting */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
            Date & Time Formatting
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm, 8px)' }}>
            <div>
              <strong>Short:</strong> {formatDate(now, 'short')}
            </div>
            <div>
              <strong>Medium:</strong> {formatDate(now, 'medium')}
            </div>
            <div>
              <strong>Long:</strong> {formatDate(now, 'long')}
            </div>
            <div>
              <strong>Full:</strong> {formatDate(now, 'full')}
            </div>
            <div>
              <strong>Time:</strong> {formatTime(now)}
            </div>
            <div>
              <strong>Relative (now):</strong> {formatRelativeTime(now)}
            </div>
            <div>
              <strong>Relative (yesterday):</strong> {formatRelativeTime(yesterday)}
            </div>
            <div>
              <strong>Relative (last week):</strong> {formatRelativeTime(lastWeek)}
            </div>
          </div>
        </div>

        {/* Number & Currency Formatting */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
            Number & Currency Formatting
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm, 8px)' }}>
            <div>
              <strong>Number:</strong> {formatNumber(1234567.89)}
            </div>
            <div>
              <strong>Currency (USD):</strong> {formatCurrency(1234.56, 'USD')}
            </div>
            <div>
              <strong>Currency (EUR):</strong> {formatCurrency(1234.56, 'EUR')}
            </div>
            <div>
              <strong>Currency (GBP):</strong> {formatCurrency(1234.56, 'GBP')}
            </div>
            <div>
              <strong>Currency (JPY):</strong> {formatCurrency(1234.56, 'JPY')}
            </div>
          </div>
        </div>

        {/* Transcription Features */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          marginBottom: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
            {t('transcription.start')}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm, 8px)' }}>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-success, #28a745)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              {t('transcription.start')}
            </button>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-error, #dc3545)',
              color: 'var(--color-text-inverse, #ffffff)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              {t('transcription.stop')}
            </button>
            <button style={{
              padding: 'var(--spacing-md, 12px) var(--spacing-lg, 16px)',
              backgroundColor: 'var(--color-warning, #ffc107)',
              color: 'var(--color-text, #212529)',
              border: 'none',
              borderRadius: 'var(--border-radius-md, 8px)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base, 1rem)',
              fontWeight: '500',
            }}>
              {t('transcription.pause')}
            </button>
          </div>
        </div>

        {/* AI Features */}
        <div style={{
          padding: 'var(--spacing-lg, 16px)',
          backgroundColor: 'var(--color-surface, #ffffff)',
          border: '1px solid var(--color-border, #dee2e6)',
          borderRadius: 'var(--border-radius-lg, 12px)',
          boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 'var(--spacing-md, 12px)' }}>
            AI Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-sm, 8px)' }}>
            {[
              'ai.summarize',
              'ai.key_points',
              'ai.action_items',
              'ai.sentiment',
              'ai.topics',
              'ai.search',
            ].map((key) => (
              <button
                key={key}
                style={{
                  padding: 'var(--spacing-sm, 8px)',
                  backgroundColor: 'var(--color-secondary, #6c757d)',
                  color: 'var(--color-text-inverse, #ffffff)',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md, 8px)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  fontWeight: '500',
                }}
              >
                {t(key as any)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default I18nDemo;

