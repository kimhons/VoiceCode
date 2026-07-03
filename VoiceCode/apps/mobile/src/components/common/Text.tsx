// VoiceCode Mobile - Text Component

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { TypographyVariant } from '../../theme';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const textStyle = [
    theme.typography[variant],
    {
      color: color || theme.colors.textPrimary,
      textAlign: align,
    },
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

