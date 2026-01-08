// Settings Panel Component for VoiceFlow Pro

import React, { useState } from 'react';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Volume2, 
  VolumeX,
  Eye,
  EyeOff,
  Keyboard,
  Globe,
  Shield,
  Palette,
  Download,
  Upload,
  RotateCcw,
  Save,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { SettingsConfig, ThemeType, PlatformType, AccessibilityProps } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  getFocusStyles, 
  announceToScreenReader,
  componentSizes,
} from '@/utils/accessibility';
import { LanguageSelector } from './LanguageSelector';
import { VoiceRecording } from './VoiceRecording';

interface SettingsPanelProps extends AccessibilityProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: SettingsConfig) => void;
  className?: string;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onSave,
  className = '',
  ...accessibilityProps
}) => {
  const { 
    theme, 
    setTheme, 
    platform, 
    platformConfig, 
    colors, 
    spacing, 
    borderRadius,
    typography,
  } = useTheme();
  
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    exportSettings, 
    importSettings,
    supportedLanguages,
  } = useSettings();
  
  const [activeSection, setActiveSection] = useState<string>('general');
  const [searchTerm, setSearchTerm] = useState('');

  const focusStyles = getFocusStyles(platform, settings.accessibility.highContrast);

  // Settings sections configuration
  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'General',
      icon: <Settings size={18} />,
      description: 'Basic application settings',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette size={18} />,
      description: 'Theme and visual preferences',
    },
    {
      id: 'audio',
      title: 'Audio & Recording',
      icon: <Volume2 size={18} />,
      description: 'Microphone and audio settings',
    },
    {
      id: 'transcription',
      title: 'Transcription',
      icon: <Globe size={18} />,
      description: 'Language and transcription options',
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      icon: <Eye size={18} />,
      description: 'Accessibility and usability features',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: <Shield size={18} />,
      description: 'Data privacy and security settings',
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      icon: <Keyboard size={18} />,
      description: 'Customize keyboard shortcuts',
    },
  ];

  // Handle settings change
  const handleSettingChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    updateSettings(newSettings);
    announceToScreenReader(`${path} setting updated`, 'polite');
  };

  // Handle theme change
  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    handleSettingChange('theme', newTheme);
  };

  // Filter sections based on search
  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export settings
  const handleExport = () => {
    const data = exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voiceflow-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    announceToScreenReader('Settings exported', 'polite');
  };

  // Import settings
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (importSettings(data)) {
        announceToScreenReader('Settings imported successfully', 'polite');
      } else {
        announceToScreenReader('Failed to import settings', 'assertive');
      }
    };
    reader.readAsText(file);
  };

  const buttonSize = componentSizes.button.medium;

  const sidebarStyles: React.CSSProperties = {
    width: '280px',
    backgroundColor: colors.backgroundSecondary,
    borderRight: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    padding: spacing.xl,
    overflowY: 'auto',
  };

  const panelStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '800px',
    backgroundColor: colors.background,
    borderLeft: `1px solid ${colors.border}`,
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    display: 'flex',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease',
  };

  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: typography.fontSize.md,
    outline: 'none',
    ...focusStyles,
  };

  const sectionButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    ...focusStyles,
  };

  const activeSectionStyles: React.CSSProperties = {
    backgroundColor: `${colors.primary}10`,
    color: colors.primary,
    borderRight: `3px solid ${colors.primary}`,
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <h2 style={{ margin: 0, color: colors.text }}>General Settings</h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              {/* Auto-start */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={{ fontWeight: '500', color: colors.text }}>Auto-start on boot</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textSecondary }}>
                    Launch VoiceFlow Pro when your computer starts
                  </p>
                </div>
                <button
                  aria-label="Toggle auto-start"
                  onClick={() => handleSettingChange('autoStart', !settings.autoStart)}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: settings.autoStart ? colors.primary : colors.border,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '2px',
                      left: settings.autoStart ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </button>
              </div>

              {/* Sound notifications */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={{ fontWeight: '500', color: colors.text }}>Sound notifications</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textSecondary }}>
                    Play sounds for recording start/stop and notifications
                  </p>
                </div>
                <button
                  aria-label="Toggle sound notifications"
                  onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: settings.soundEnabled ? colors.primary : colors.border,
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '2px',
                      left: settings.soundEnabled ? '22px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <h2 style={{ margin: 0, color: colors.text }}>Appearance Settings</h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              {/* Theme selection */}
              <div>
                <label style={{ fontWeight: '500', color: colors.text, display: 'block', marginBottom: spacing.sm }}>
                  Theme
                </label>
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  {[
                    { value: 'light', icon: <Sun size={18} />, label: 'Light' },
                    { value: 'dark', icon: <Moon size={18} />, label: 'Dark' },
                    { value: 'auto', icon: <Monitor size={18} />, label: 'Auto' },
                  ].map(({ value, icon, label }) => (
                    <button
                      key={value}
                      aria-label={`Select ${label} theme`}
                      onClick={() => handleThemeChange(value as ThemeType)}
                      style={{
                        flex: 1,
                        padding: spacing.md,
                        border: theme === value ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                        borderRadius: borderRadius.medium,
                        backgroundColor: theme === value ? `${colors.primary}10` : colors.background,
                        color: colors.text,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: spacing.xs,
                        transition: 'all 0.2s ease',
                        ...focusStyles,
                      }}
                    >
                      {icon}
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <h2 style={{ margin: 0, color: colors.text }}>Audio & Recording</h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              <div>
                <label style={{ fontWeight: '500', color: colors.text, display: 'block', marginBottom: spacing.sm }}>
                  Test Microphone
                </label>
                <VoiceRecording 
                  size="medium"
                  showVolume={true}
                  showSettings={false}
                  onRecordingStart={() => announceToScreenReader('Recording test started', 'polite')}
                  onRecordingStop={() => announceToScreenReader('Recording test stopped', 'polite')}
                />
              </div>
            </div>
          </div>
        );

      case 'transcription':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <h2 style={{ margin: 0, color: colors.text }}>Transcription Settings</h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              <div>
                <label style={{ fontWeight: '500', color: colors.text, display: 'block', marginBottom: spacing.sm }}>
                  Default Language
                </label>
                <LanguageSelector
                  value={settings.language}
                  onChange={(lang) => handleSettingChange('language', lang)}
                  size="medium"
                />
              </div>

              {/* Transcription options */}
              <div style={{ display: 'grid', gap: spacing.md }}>
                {[
                  { key: 'autoPunctuation', label: 'Auto-punctuation', description: 'Automatically add punctuation' },
                  { key: 'smartFormatting', label: 'Smart formatting', description: 'Format text with proper spacing and capitalization' },
                  { key: 'detectLanguage', label: 'Auto-detect language', description: 'Automatically detect spoken language' },
                ].map(({ key, label, description }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label style={{ fontWeight: '500', color: colors.text }}>{label}</label>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textSecondary }}>
                        {description}
                      </p>
                    </div>
                    <button
                      aria-label={`Toggle ${label}`}
                      onClick={() => handleSettingChange(`transcription.${key}`, !settings.transcription[key as keyof typeof settings.transcription])}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: settings.transcription[key as keyof typeof settings.transcription] ? colors.primary : colors.border,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          position: 'absolute',
                          top: '2px',
                          left: settings.transcription[key as keyof typeof settings.transcription] ? '22px' : '2px',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Confidence threshold */}
              <div>
                <label style={{ fontWeight: '500', color: colors.text, display: 'block', marginBottom: spacing.sm }}>
                  Confidence threshold: {Math.round(settings.transcription.confidenceThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.transcription.confidenceThreshold}
                  onChange={(e) => handleSettingChange('transcription.confidenceThreshold', parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: colors.border,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'accessibility':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <h2 style={{ margin: 0, color: colors.text }}>Accessibility Settings</h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              {[
                { key: 'highContrast', label: 'High contrast mode', description: 'Increase contrast for better visibility' },
                { key: 'largeText', label: 'Large text', description: 'Increase text size throughout the interface' },
                { key: 'voiceFeedback', label: 'Voice feedback', description: 'Provide audio feedback for actions' },
                { key: 'keyboardNavigation', label: 'Enhanced keyboard navigation', description: 'Improved keyboard navigation support' },
              ].map(({ key, label, description }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: colors.text }}>{label}</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textSecondary }}>
                      {description}
                    </p>
                  </div>
                  <button
                    aria-label={`Toggle ${label}`}
                    onClick={() => handleSettingChange(`accessibility.${key}`, !settings.accessibility[key as keyof typeof settings.accessibility])}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: settings.accessibility[key as keyof typeof settings.accessibility] ? colors.primary : colors.border,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: settings.accessibility[key as keyof typeof settings.accessibility] ? '22px' : '2px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <h2 style={{ margin: 0, color: colors.text }}>Privacy & Security</h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              {[
                { key: 'saveTranscriptions', label: 'Save transcriptions locally', description: 'Store transcription data on your device' },
                { key: 'shareAnalytics', label: 'Share usage analytics', description: 'Help improve VoiceFlow Pro by sharing anonymous usage data' },
              ].map(({ key, label, description }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: colors.text }}>{label}</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textSecondary }}>
                      {description}
                    </p>
                  </div>
                  <button
                    aria-label={`Toggle ${label}`}
                    onClick={() => handleSettingChange(`privacy.${key}`, !settings.privacy[key as keyof typeof settings.privacy])}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: settings.privacy[key as keyof typeof settings.privacy] ? colors.primary : colors.border,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: settings.privacy[key as keyof typeof settings.privacy] ? '22px' : '2px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <h2 style={{ margin: 0, color: colors.text }}>Keyboard Shortcuts</h2>
            
            <div style={{ display: 'grid', gap: spacing.lg }}>
              <div>
                <label style={{ fontWeight: '500', color: colors.text, display: 'block', marginBottom: spacing.sm }}>
                  Voice recording hotkey
                </label>
                <input
                  type="text"
                  value={settings.hotkey}
                  onChange={(e) => handleSettingChange('hotkey', e.target.value)}
                  placeholder="Press your desired key combination"
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.medium,
                    backgroundColor: colors.background,
                    color: colors.text,
                    fontSize: typography.fontSize.md,
                    outline: 'none',
                    ...focusStyles,
                  }}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textSecondary }}>
                  Press the keys you want to use for starting/stopping recording
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      {...accessibilityProps}
      className={`settings-panel ${className}`}
      style={panelStyles}
      role="dialog"
      aria-labelledby="settings-title"
      aria-modal="true"
    >
      {/* Sidebar */}
      <div style={sidebarStyles}>
        {/* Header */}
        <div style={{ padding: spacing.xl, borderBottom: `1px solid ${colors.border}` }}>
          <h2 id="settings-title" style={{ margin: 0, color: colors.text }}>
            Settings
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textSecondary }}>
            Customize your VoiceFlow Pro experience
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
          <input
            type="text"
            placeholder="Search settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
            aria-label="Search settings"
          />
        </div>

        {/* Sections */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                ...sectionButtonStyles,
                ...(activeSection === section.id ? activeSectionStyles : {}),
              }}
              aria-label={`${section.title} settings section`}
              aria-current={activeSection === section.id ? 'page' : undefined}
            >
              {section.icon}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{section.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{section.description}</div>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{ padding: spacing.md, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: 'grid', gap: spacing.xs }}>
            <button
              onClick={handleExport}
              style={{
                padding: spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.small,
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: '14px',
                ...focusStyles,
              }}
            >
              <Download size={14} />
              Export Settings
            </button>
            
            <label
              style={{
                padding: spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.small,
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: '14px',
                ...focusStyles,
              }}
            >
              <Upload size={14} />
              Import Settings
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                aria-label="Import settings from file"
              />
            </label>
            
            <button
              onClick={() => {
                if (confirm('Reset all settings to default values?')) {
                  resetSettings();
                  announceToScreenReader('Settings reset to defaults', 'polite');
                }
              }}
              style={{
                padding: spacing.sm,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.small,
                color: colors.error,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: '14px',
                ...focusStyles,
              }}
            >
              <RotateCcw size={14} />
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {/* Section content */}
        {renderSectionContent()}
      </div>

      {/* Close button */}
      <button
        aria-label="Close settings"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: spacing.md,
          right: spacing.md,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: colors.backgroundSecondary,
          color: colors.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...focusStyles,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};