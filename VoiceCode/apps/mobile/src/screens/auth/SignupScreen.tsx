// VoiceCode Mobile - Signup Screen

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
import { signupSuccess } from '../../store/slices/authSlice';

type SignupParamList = AuthStackParamList & {
  WebView: { url: string; title?: string };
};
type SignupNavigationProp = StackNavigationProp<SignupParamList, 'Signup'>;

interface SignupScreenProps {
  navigation?: Pick<SignupNavigationProp, 'navigate'>;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  navigation: injectedNavigation,
}) => {
  const { theme } = useTheme();
  const defaultNavigation = useNavigation<SignupNavigationProp>();
  const navigation: Pick<SignupNavigationProp, 'navigate'> =
    injectedNavigation ?? defaultNavigation;
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true };
  };

  const handleSignup = async () => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');

    // Validation
    let hasError = false;

    if (!name.trim()) {
      setNameError('Name is required');
      hasError = true;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      hasError = true;
    }

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
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setPasswordError(passwordValidation.message || 'Invalid password');
        hasError = true;
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (!acceptedTerms) {
      setTermsError('You must accept the terms and conditions');
      hasError = true;
    }

    if (hasError) return;

    // Simulate signup (TODO: Implement actual API call)
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Dispatch signup success
      dispatch(signupSuccess({
        user: {
          id: '1',
          email,
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'mock-token-' + Date.now(),
      }));
    }, 2000);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSocialSignup = (provider: string) => {
    // TODO: Implement social signup
    console.log('Social Signup:', provider);
  };

  const handleTermsPress = () => {
    navigation.navigate('WebView', {
      url: 'https://voicecode.app/terms',
      title: 'Terms of Service',
    });
  };

  const handlePrivacyPress = () => {
    // TODO: Open privacy policy
    console.log('Open Privacy Policy');
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
            Create Account
          </Text>
          <Text
            variant="body"
            align="center"
            color={theme.colors.textSecondary}
            style={styles.subtitle}
          >
            Sign up to get started with VoiceCode
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            testID="name-input"
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            error={nameError}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Input
            testID="email-input"
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
            testID="password-input"
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
            autoCapitalize="none"
            helperText="Min 8 characters, 1 uppercase, 1 lowercase, 1 number"
          />

          <Input
            testID="confirm-password-input"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* Terms and Conditions */}
          <TouchableOpacity
            testID="terms-checkbox"
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: termsError ? theme.colors.error : theme.colors.border,
                  backgroundColor: acceptedTerms ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {acceptedTerms && (
                <Text variant="caption" color="#FFFFFF">
                  ✓
                </Text>
              )}
            </View>
            <View style={styles.termsTextContainer}>
              <Text variant="caption" color={theme.colors.textSecondary}>
                I agree to the{' '}
                <Text
                  variant="caption"
                  color={theme.colors.primary}
                  onPress={handleTermsPress}
                  style={styles.link}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  variant="caption"
                  color={theme.colors.primary}
                  onPress={handlePrivacyPress}
                  style={styles.link}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          {termsError && (
            <Text variant="caption" color={theme.colors.error} style={styles.termsError}>
              {termsError}
            </Text>
          )}

          <Button
            testID="signup-button"
            variant="primary"
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            style={styles.signupButton}
          >
            Create Account
          </Button>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text variant="caption" color={theme.colors.textSecondary} style={styles.dividerText}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <Button
            testID="google-signup"
            variant="outline"
            onPress={() => handleSocialSignup('google')}
            fullWidth
            style={styles.socialButton}
          >
            Continue with Google
          </Button>

          <Button
            testID="apple-signup"
            variant="outline"
            onPress={() => handleSocialSignup('apple')}
            fullWidth
            style={styles.socialButton}
          >
            Continue with Apple
          </Button>
        </Card>

        <View style={styles.footer}>
          <Text
            variant="body"
            color={theme.colors.textSecondary}
            onPress={handleLogin}
          >
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text variant="body" color={theme.colors.primary} style={styles.loginLink}>
              Sign In
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  termsTextContainer: {
    flex: 1,
  },
  link: {
    textDecorationLine: 'underline',
  },
  termsError: {
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 4,
  },
  signupButton: {
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
  loginLink: {
    fontWeight: '600',
  },
});

