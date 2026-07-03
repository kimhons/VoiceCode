// VoiceCode Mobile - Color Palette

export const colors = {
  light: {
    // Primary Colors
    primary: '#3B82F6',      // Blue
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    
    // Secondary Colors
    secondary: '#8B5CF6',    // Purple
    secondaryLight: '#A78BFA',
    secondaryDark: '#7C3AED',
    
    // Status Colors
    success: '#10B981',      // Green
    successLight: '#34D399',
    successDark: '#059669',
    
    warning: '#F59E0B',      // Amber
    warningLight: '#FBBF24',
    warningDark: '#D97706',
    
    error: '#EF4444',        // Red
    errorLight: '#F87171',
    errorDark: '#DC2626',
    
    info: '#3B82F6',         // Blue
    infoLight: '#60A5FA',
    infoDark: '#2563EB',
    
    // Neutral Colors
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceVariant: '#F3F4F6',
    
    // Text Colors
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textDisabled: '#D1D5DB',
    
    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Other
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    divider: '#E5E7EB',
    disabled: '#9CA3AF',
  },
  
  dark: {
    // Primary Colors
    primary: '#60A5FA',      // Light Blue
    primaryLight: '#93C5FD',
    primaryDark: '#3B82F6',
    
    // Secondary Colors
    secondary: '#A78BFA',    // Light Purple
    secondaryLight: '#C4B5FD',
    secondaryDark: '#8B5CF6',
    
    // Status Colors
    success: '#34D399',      // Light Green
    successLight: '#6EE7B7',
    successDark: '#10B981',
    
    warning: '#FBBF24',      // Light Amber
    warningLight: '#FCD34D',
    warningDark: '#F59E0B',
    
    error: '#F87171',        // Light Red
    errorLight: '#FCA5A5',
    errorDark: '#EF4444',
    
    info: '#60A5FA',         // Light Blue
    infoLight: '#93C5FD',
    infoDark: '#3B82F6',
    
    // Neutral Colors
    background: '#111827',
    surface: '#1F2937',
    surfaceVariant: '#374151',
    
    // Text Colors
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    textDisabled: '#4B5563',
    
    // Border Colors
    border: '#374151',
    borderLight: '#4B5563',
    borderDark: '#1F2937',
    
    // Other
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    divider: '#374151',
    disabled: '#6B7280',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof colors.light;

