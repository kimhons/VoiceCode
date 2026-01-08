// Language Selector Component for VoiceFlow Pro

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Globe, Volume2 } from 'lucide-react';
import { LanguageInfo, AccessibilityProps } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  getFocusStyles, 
  announceToScreenReader, 
  generateAriaLabel,
  getKeyboardNavigationProps,
} from '@/utils/accessibility';

interface LanguageSelectorProps extends AccessibilityProps {
  languages?: LanguageInfo[];
  value?: string;
  onChange?: (languageCode: string) => void;
  onAutoDetect?: () => void;
  placeholder?: string;
  searchable?: boolean;
  showNativeNames?: boolean;
  showFlags?: boolean;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages: propLanguages,
  value,
  onChange,
  onAutoDetect,
  placeholder = 'Select language',
  searchable = true,
  showNativeNames = true,
  showFlags = true,
  size = 'medium',
  disabled = false,
  className = '',
  ...accessibilityProps
}) => {
  const { colors, spacing, borderRadius, platform } = useTheme();
  const { settings, supportedLanguages } = useSettings();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(value || settings.language);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const languages = propLanguages || supportedLanguages;

  // Get current language info
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);
  const filteredLanguages = languages.filter(lang => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      lang.name.toLowerCase().includes(searchLower) ||
      lang.nativeName.toLowerCase().includes(searchLower) ||
      lang.code.toLowerCase().includes(searchLower)
    );
  });

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Handle language selection
  const selectLanguage = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setIsOpen(false);
    setSearchTerm('');
    onChange?.(languageCode);
    const language = languages.find(l => l.code === languageCode);
    announceToScreenReader(
      `Language changed to ${language?.name || languageCode}`, 
      'polite'
    );
  };

  // Handle keyboard navigation
  const keyboardProps = getKeyboardNavigationProps(
    // Enter/Space - toggle dropdown
    () => setIsOpen(!isOpen),
    // Escape - close dropdown
    () => setIsOpen(false),
    undefined,
    // Arrow keys - navigate through options
    {
      up: () => {
        const currentIndex = filteredLanguages.findIndex(lang => lang.code === selectedLanguage);
        if (currentIndex > 0) {
          selectLanguage(filteredLanguages[currentIndex - 1].code);
        }
      },
      down: () => {
        const currentIndex = filteredLanguages.findIndex(lang => lang.code === selectedLanguage);
        if (currentIndex < filteredLanguages.length - 1) {
          selectLanguage(filteredLanguages[currentIndex + 1].code);
        }
      },
    }
  );

  const focusStyles = getFocusStyles(platform, settings.accessibility.highContrast);
  
  // Size configurations
  const sizeConfig = {
    small: {
      height: '32px',
      fontSize: '13px',
      padding: `${spacing.xs} ${spacing.sm}`,
    },
    medium: {
      height: '40px',
      fontSize: '14px',
      padding: `${spacing.sm} ${spacing.md}`,
    },
    large: {
      height: '48px',
      fontSize: '16px',
      padding: `${spacing.md} ${spacing.lg}`,
    },
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    minHeight: sizeConfig[size].height,
    padding: sizeConfig[size].padding,
    fontSize: sizeConfig[size].fontSize,
    borderRadius: borderRadius.medium,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    position: 'relative',
    ...focusStyles,
  };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.medium,
    boxShadow: `0 8px 24px ${colors.background}20, 0 2px 8px ${colors.background}10`,
    zIndex: 50,
    maxHeight: '300px',
    overflow: 'hidden',
  };

  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    border: 'none',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.backgroundSecondary,
    color: colors.text,
    fontSize: '14px',
    outline: 'none',
  };

  const languageItemStyles: React.CSSProperties = {
    padding: spacing.md,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    borderBottom: `1px solid ${colors.border}`,
    minHeight: '48px',
  };

  return (
    <div 
      {...accessibilityProps}
      className={`language-selector ${className}`}
      style={{ position: 'relative', width: '100%' }}
      ref={dropdownRef}
    >
      {/* Main selector button */}
      <button
        {...accessibilityProps}
        {...keyboardProps}
        aria-label={generateAriaLabel(
          'language selector',
          currentLanguage ? `current: ${currentLanguage.name}` : undefined,
          'click to change language'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          ...buttonStyles,
          opacity: disabled ? 0.6 : 1,
          backgroundColor: isOpen ? colors.backgroundSecondary : colors.background,
          borderColor: isOpen ? colors.primary : colors.border,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          {showFlags && currentLanguage?.flag && (
            <span style={{ fontSize: '18px' }}>{currentLanguage.flag}</span>
          )}
          
          <Globe size={16} color={colors.textTertiary} />
          
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: '500' }}>
              {currentLanguage?.name || placeholder}
            </div>
            {showNativeNames && currentLanguage?.nativeName !== currentLanguage?.name && (
              <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                {currentLanguage?.nativeName}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          {onAutoDetect && (
            <button
              aria-label="Auto-detect language"
              onClick={(e) => {
                e.stopPropagation();
                onAutoDetect();
              }}
              style={{
                padding: '4px',
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.textTertiary,
                borderRadius: borderRadius.small,
                cursor: 'pointer',
              }}
            >
              <Volume2 size={14} />
            </button>
          )}
          
          <ChevronDown 
            size={16} 
            color={colors.textTertiary}
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div style={dropdownStyles} role="listbox">
          {/* Search input */}
          {searchable && (
            <div style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={16} 
                  color={colors.textTertiary}
                  style={{
                    position: 'absolute',
                    left: spacing.md,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                  }}
                />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search languages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    ...searchInputStyles,
                    paddingLeft: `calc(${spacing.md} + 20px + ${spacing.sm})`,
                  }}
                  aria-label="Search languages"
                />
              </div>
            </div>
          )}

          {/* Language options */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredLanguages.length === 0 ? (
              <div
                style={{
                  padding: spacing.md,
                  textAlign: 'center',
                  color: colors.textTertiary,
                  fontStyle: 'italic',
                }}
              >
                No languages found
              </div>
            ) : (
              filteredLanguages.map((language) => (
                <div
                  key={language.code}
                  role="option"
                  aria-selected={selectedLanguage === language.code}
                  onClick={() => selectLanguage(language.code)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.backgroundTertiary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  style={{
                    ...languageItemStyles,
                    backgroundColor: selectedLanguage === language.code 
                      ? `${colors.primary}10` 
                      : 'transparent',
                    color: selectedLanguage === language.code 
                      ? colors.primary 
                      : colors.text,
                    opacity: language.supported ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                    {showFlags && language.flag && (
                      <span style={{ fontSize: '18px' }}>{language.flag}</span>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: selectedLanguage === language.code ? '600' : '500' }}>
                        {language.name}
                      </div>
                      {showNativeNames && language.nativeName !== language.name && (
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          {language.nativeName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    {!language.supported && (
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          color: colors.warning,
                          textTransform: 'uppercase',
                          fontWeight: '600',
                        }}
                      >
                        Beta
                      </span>
                    )}
                    
                    {selectedLanguage === language.code && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with language count */}
          <div
            style={{
              padding: spacing.sm,
              backgroundColor: colors.backgroundSecondary,
              borderTop: `1px solid ${colors.border}`,
              fontSize: '12px',
              color: colors.textTertiary,
              textAlign: 'center',
            }}
          >
            {filteredLanguages.length} of {languages.length} languages
          </div>
        </div>
      )}
    </div>
  );
};

// Default export for lazy loading
export default LanguageSelector;