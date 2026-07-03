import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabaseService';

const MIN_PASSWORD_LENGTH = 8;

interface ChangePasswordScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message || 'Unable to change password. Please try again.');
      return;
    }

    setSuccess('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <ScrollView style={styles.container} testID="change-password-screen">
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={40} color="#667eea" />
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>
          Choose a strong password you don&apos;t use anywhere else.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Existing Password</Text>
        <TextInput
          testID="current-password-input"
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter your current password"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          testID="new-password-input"
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          testID="confirm-password-input"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter your new password"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />
      </View>

      {error ? (
        <Text style={styles.error} testID="error-message">
          {error}
        </Text>
      ) : null}
      {success ? (
        <Text style={styles.success} testID="success-message">
          {success}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        testID="submit-button"
      >
        <Text style={styles.primaryButtonText}>
          {submitting ? 'Updating…' : 'Update Password'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.goBack()}
        testID="cancel-button"
      >
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 6 },
  section: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  label: { fontSize: 13, color: '#555', marginTop: 14, marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a2e',
    backgroundColor: '#fafafa',
  },
  error: { color: '#ef4444', fontSize: 14, paddingHorizontal: 20, paddingTop: 16 },
  success: { color: '#22c55e', fontSize: 14, paddingHorizontal: 20, paddingTop: 16 },
  primaryButton: {
    backgroundColor: '#667eea',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 12, marginBottom: 32, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#667eea', fontSize: 16, fontWeight: '600' },
});

export default ChangePasswordScreen;
