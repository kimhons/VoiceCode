import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackNavigationProp } from '@/navigation/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordScreenProps {
  navigation?: AuthStackNavigationProp;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation: navigationProp }) => {
  const hookNavigation = useNavigation<AuthStackNavigationProp>();
  const navigation = navigationProp ?? hookNavigation;
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('Email is required');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage('Password reset email sent! Check your inbox.');
      Alert.alert('Success', 'Password reset email sent! Check your inbox.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      const message = error?.message || 'Failed to send reset email';
      setErrorMessage(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView testID="forgot-password-screen" style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>

        <TextInput testID="email-input" style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!loading} />

        {errorMessage ? <Text testID="error-message" style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text testID="success-message" style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity testID="reset-button" style={[styles.button, loading && styles.buttonDisabled]} onPress={handleResetPassword} disabled={loading}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#667eea', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  input: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  errorText: { color: '#e53e3e', fontSize: 14, marginBottom: 16 },
  successText: { color: '#38a169', fontSize: 14, marginBottom: 16 },
  button: { height: 50, backgroundColor: '#667eea', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#667eea', textAlign: 'center', marginTop: 16, fontSize: 14 },
});

export default ForgotPasswordScreen;
