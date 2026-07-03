// Accessibility Utilities for VoiceFlow Pro

import { AccessibilityProps, ComponentSize, ComponentVariants } from '@/types';

// Generate accessible color combinations
export const generateAccessibleColors = (
  foreground: string,
  background: string
): { contrast: number; meetsAA: boolean; meetsAAA: boolean } => {
  // Calculate relative luminance
  const getLuminance = (color: string): number => {
    const rgb = hexToRgb(color);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  const contrast = (lighter + 0.05) / (darker + 0.05);
  
  return {
    contrast,
    meetsAA: contrast >= 4.5, // WCAG AA standard
    meetsAAA: contrast >= 7, // WCAG AAA standard
  };
};

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Generate accessible focus styles
export const getFocusStyles = (
  platform: 'mac' | 'windows' | 'linux',
  highContrast = false
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    outline: 'none',
  };

  switch (platform) {
    case 'mac':
      return {
        ...baseStyles,
        boxShadow: highContrast 
          ? '0 0 0 3px #007AFF, 0 0 0 6px rgba(0, 122, 255, 0.3)'
          : '0 0 0 2px #007AFF',
        borderRadius: '4px',
      };
    
    case 'windows':
      return {
        ...baseStyles,
        border: highContrast 
          ? '2px solid #1A73E8' 
          : '1px solid #1A73E8',
        borderRadius: '2px',
      };
    
    case 'linux':
      return {
        ...baseStyles,
        boxShadow: highContrast 
          ? '0 0 0 2px #4A90E2, 0 0 0 4px rgba(74, 144, 226, 0.3)'
          : '0 0 0 2px #4A90E2',
        borderRadius: '3px',
      };
    
    default:
      return baseStyles;
  }
};

// Component size configurations
export const componentSizes: Record<string, ComponentSize> = {
  button: {
    small: { height: '28px', padding: '4px 8px', fontSize: '12px' },
    medium: { height: '36px', padding: '8px 16px', fontSize: '14px' },
    large: { height: '44px', padding: '12px 24px', fontSize: '16px' },
  },
  input: {
    small: { height: '32px', padding: '6px 10px', fontSize: '13px' },
    medium: { height: '40px', padding: '8px 12px', fontSize: '14px' },
    large: { height: '48px', padding: '12px 16px', fontSize: '16px' },
  },
  modal: {
    small: { width: '320px', maxHeight: '400px' },
    medium: { width: '480px', maxHeight: '600px' },
    large: { width: '640px', maxHeight: '800px' },
  },
};

// Component variants for different contexts
export const componentVariants: Record<string, ComponentVariants> = {
  button: {
    primary: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: '1px solid #3b82f6',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: '1px solid #3b82f6',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#64748b',
      border: '1px solid #e2e8f0',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#64748b',
      border: 'none',
    },
    destructive: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
      border: '1px solid #ef4444',
    },
  },
};

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  // Clean up after a short delay
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Keyboard navigation utilities
export const getKeyboardNavigationProps = (
  onEnter?: () => void,
  onEscape?: () => void,
  onSpace?: () => void,
  onArrowKeys?: {
    up?: () => void;
    down?: () => void;
    left?: () => void;
    right?: () => void;
  }
) => ({
  onKeyDown: (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
      case ' ':
        e.preventDefault();
        onSpace?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowKeys?.up?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowKeys?.down?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowKeys?.left?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowKeys?.right?.();
        break;
    }
  },
});

// Generate ARIA labels for common components
export const generateAriaLabel = (
  component: string,
  state?: string,
  action?: string
): string => {
  const base = component.charAt(0).toUpperCase() + component.slice(1);
  
  if (state && action) {
    return `${base} ${state}, ${action}`;
  } else if (state) {
    return `${base} ${state}`;
  } else if (action) {
    return `${base}, ${action}`;
  }
  
  return base;
};

// Skip link for keyboard navigation
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {children}
  </a>
);

// High contrast mode detector
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    if (mediaQuery.matches) {
      setIsHighContrast(true);
    }

    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
};

// Reduced motion detector
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.matches) {
      setPrefersReducedMotion(true);
    }

    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};