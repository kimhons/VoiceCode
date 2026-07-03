// VoiceCode Mobile - Card Component

import React from 'react';
import {
  View,
  ViewProps,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps extends ViewProps {
  pressable?: boolean;
  onPress?: () => void;
  elevation?: 0 | 1 | 2 | 3 | 4;
  padding?: number;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  pressable = false,
  onPress,
  elevation = 1,
  padding,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  // Map numeric elevation to shadow keys
  const shadowKeys = ['none', 'sm', 'md', 'lg', 'xl'] as const;
  const shadowKey = shadowKeys[elevation];

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: padding !== undefined ? padding : theme.spacing.md,
      ...theme.shadows[shadowKey],
    },
    style,
  ];

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

