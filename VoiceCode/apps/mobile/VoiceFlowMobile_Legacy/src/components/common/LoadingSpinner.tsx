// VoiceFlow Pro Mobile - Loading Spinner Component

import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

type SpinnerSize = 'small' | 'medium' | 'large';

interface LoadingSpinnerProps extends ViewProps {
  size?: SpinnerSize;
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  message,
  fullScreen = false,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const sizeMap = {
    small: 'small' as const,
    medium: 'large' as const,
    large: 'large' as const,
  };

  const spinnerColor = color || theme.colors.primary;

  const containerStyle = [
    fullScreen ? styles.fullScreen : styles.container,
    fullScreen && { backgroundColor: theme.colors.background },
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      <ActivityIndicator size={sizeMap[size]} color={spinnerColor} />
      {message && (
        <Text
          variant="body"
          color={theme.colors.textSecondary}
          align="center"
          style={styles.message}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 12,
  },
});

