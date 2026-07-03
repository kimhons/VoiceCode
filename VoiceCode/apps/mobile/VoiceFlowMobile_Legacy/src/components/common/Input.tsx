// VoiceCode Pro Mobile - Input Component

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const hasError = !!error;

  const getBorderColor = () => {
    if (hasError) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.border;
  };

  const inputContainerStyle = [
    styles.inputContainer,
    {
      backgroundColor: theme.colors.surface,
      borderColor: getBorderColor(),
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
    },
  ];

  const inputStyle = [
    styles.input,
    theme.typography.body,
    {
      color: theme.colors.textPrimary,
      paddingLeft: leftIcon ? theme.spacing.xs : theme.spacing.md,
      paddingRight: rightIcon ? theme.spacing.xs : theme.spacing.md,
    },
    style,
  ];

  const handleToggleSecure = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="label"
          color={hasError ? theme.colors.error : theme.colors.textSecondary}
          style={styles.label}
        >
          {label}
        </Text>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={inputStyle}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={handleToggleSecure}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text variant="caption" color={theme.colors.textSecondary}>
              {isSecure ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(error || helperText) && (
        <Text
          variant="caption"
          color={hasError ? theme.colors.error : theme.colors.textSecondary}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    minHeight: 44,
  },
  leftIcon: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  rightIcon: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 4,
  },
});

