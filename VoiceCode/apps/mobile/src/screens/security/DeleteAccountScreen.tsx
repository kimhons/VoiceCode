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
import { useAuth } from '../../contexts/AuthContext';

const CONFIRM_WORD = 'DELETE';
const MIN_PASSWORD_LENGTH = 8;

interface DeleteAccountScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
    reset?: (state: { index: number; routes: { name: string }[] }) => void;
  };
}

const DELETED_DATA = [
  'All transcripts and notes',
  'All audio recordings',
  'Your profile and account settings',
  'Your billing history',
];

const DeleteAccountScreen: React.FC<DeleteAccountScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const canDelete = confirmText === CONFIRM_WORD && password.length > 0 && !processing;

  // A valid account password must be at least 8 characters and contain a digit,
  // so an entry failing that policy cannot be the real password. This is a fast
  // client-side reject; the authoritative check is the server-side re-auth below.
  const passwordMeetsPolicy = password.length >= MIN_PASSWORD_LENGTH && /\d/.test(password);

  const handleDelete = async () => {
    setError(null);

    if (confirmText !== CONFIRM_WORD) {
      setError(`Please type ${CONFIRM_WORD} to confirm`);
      return;
    }
    if (!passwordMeetsPolicy) {
      setError('Incorrect password. Please try again.');
      return;
    }

    setProcessing(true);
    setStatus('Deleting your account…');

    try {
      const email = user?.email;
      if (email) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password });
        if (reauthError) {
          setStatus(null);
          setProcessing(false);
          setError('Incorrect password. Please try again.');
          return;
        }
      }

      await supabase.rpc('delete_account');
      await supabase.auth.signOut();

      navigation.reset?.({ index: 0, routes: [{ name: 'Auth' }] });
    } catch {
      setStatus(null);
      setProcessing(false);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} testID="delete-account-screen">
      <View style={styles.header}>
        <Ionicons name="warning-outline" size={44} color="#ef4444" />
        <Text style={styles.title}>Delete Account</Text>
        <Text style={styles.warning}>
          This action is permanent and cannot be undone.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>The following will be erased:</Text>
        {DELETED_DATA.map((item) => (
          <View style={styles.dataRow} key={item}>
            <Ionicons name="close-circle-outline" size={18} color="#ef4444" style={styles.dataIcon} />
            <Text style={styles.dataText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Enter your password</Text>
        <TextInput
          testID="password-input"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Your account password"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
        />

        <Text style={styles.label}>Type {CONFIRM_WORD} to confirm</Text>
        <TextInput
          testID="confirm-input"
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={`Type ${CONFIRM_WORD} here`}
          placeholderTextColor="#999"
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {error ? (
        <Text style={styles.error} testID="error-message">
          {error}
        </Text>
      ) : null}
      {status ? (
        <Text style={styles.status} testID="status-message">
          {status}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.deleteButton, !canDelete && styles.buttonDisabled]}
        onPress={handleDelete}
        disabled={!canDelete}
        testID="delete-button"
      >
        <Text style={styles.deleteButtonText}>Delete My Account</Text>
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
  warning: { fontSize: 15, color: '#ef4444', textAlign: 'center', marginTop: 8, fontWeight: '600' },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  dataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  dataIcon: { marginRight: 10 },
  dataText: { fontSize: 15, color: '#333' },
  label: { fontSize: 13, color: '#555', marginTop: 12, marginBottom: 6, fontWeight: '600' },
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
  status: { color: '#667eea', fontSize: 14, paddingHorizontal: 20, paddingTop: 16 },
  deleteButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 12, marginBottom: 32, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#667eea', fontSize: 16, fontWeight: '600' },
});

export default DeleteAccountScreen;
