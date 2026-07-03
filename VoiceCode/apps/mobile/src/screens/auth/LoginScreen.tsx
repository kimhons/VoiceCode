// VoiceCode Mobile - Login Screen

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button, Input, Card } from '../../components/common';
import { useAppDispatch } from '../../store';
import { loginSuccess } from '../../store/slices/authSlice';

type LoginNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<LoginNavigationProp>();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validation
    let hasError = false;

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }

    if (hasError) return;

    // Simulate login (TODO: Implement actual API call)
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Dispatch login success
      dispatch(loginSuccess({
        user: {
          id: '1',
          email,
          name: email.split('@')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'mock-token-' + Date.now(),
      }));
    }, 2000);
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement social login
    console.log('Social Login:', provider);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="h1" align="center" color={theme.colors.primary}>
            VoiceCode
          </Text>
          <Text
            variant="body"
            align="center"
            color={theme.colors.textSecondary}
            style={styles.subtitle}
          >
            Welcome back! Sign in to continue
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
          >
            <Text variant="caption" color={theme.colors.primary}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            variant="primary"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.loginButton}
          >
            Sign In
          </Button>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text variant="caption" color={theme.colors.textSecondary} style={styles.dividerText}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <Button
            variant="outline"
            onPress={() => handleSocialLogin('google')}
            fullWidth
            style={styles.socialButton}
          >
            Continue with Google
          </Button>

          <Button
            variant="outline"
            onPress={() => handleSocialLogin('apple')}
            fullWidth
            style={styles.socialButton}
          >
            Continue with Apple
          </Button>
        </Card>

        <View style={styles.footer}>
          <Text variant="body" color={theme.colors.textSecondary}>
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleSignup}>
            <Text variant="body" color={theme.colors.primary} style={styles.signupLink}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 8,
  },
  formCard: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  socialButton: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupLink: {
    fontWeight: '600',
  },
});

