import React, { useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '../stores/appStore';

interface ThemeToggleProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onThemeChange,
}) => {
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let effectiveTheme: 'light' | 'dark' = 'light';

      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
      } else {
        effectiveTheme = theme;
      }

      root.setAttribute('data-theme', effectiveTheme);
      root.classList.remove('light-theme', 'dark-theme');
      root.classList.add(`${effectiveTheme}-theme`);
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={18} />;
      case 'dark':
        return <Moon size={18} />;
      case 'system':
        return <Monitor size={18} />;
    }
  };

  const getNextTheme = (): ThemeMode => {
    switch (theme) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'system';
      case 'system':
        return 'light';
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System theme';
    }
  };

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => onThemeChange(getNextTheme())}
      title={`Current: ${getLabel()}. Click to change.`}
      aria-label={`Theme: ${getLabel()}. Click to toggle.`}
    >
      {getIcon()}
      <span className="theme-label">{getLabel()}</span>
    </button>
  );
};

export default ThemeToggle;
