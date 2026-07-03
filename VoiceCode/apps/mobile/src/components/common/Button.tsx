// VoiceCode Mobile - Button Component

import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.typography.caption.fontSize,
      minHeight: 36,
    },
    medium: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.typography.button.fontSize,
      minHeight: 44,
    },
    large: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      fontSize: theme.typography.button.fontSize,
      minHeight: 56,
    },
  };

  // Variant styles
  const getVariantStyle = () => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled ? theme.colors.disabled : theme.colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled ? theme.colors.disabled : theme.colors.secondary,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? theme.colors.disabled : theme.colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {};
    }
  };

  // Text color based on variant
  const getTextColor = () => {
    const isDisabled = disabled || loading;

    if (isDisabled) {
      return theme.colors.textDisabled;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return theme.colors.textPrimary;
    }
  };

  const buttonStyle = [
    styles.button,
    {
      ...sizeConfig[size],
      ...getVariantStyle(),
      borderRadius: theme.borderRadius.md,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled && !loading ? 0.5 : 1,
    },
    style,
  ];

  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor}
            style={styles.loader}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            <Text
              variant="button"
              color={textColor}
              style={{ fontSize: sizeConfig[size].fontSize }}
            >
              {children}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginHorizontal: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

