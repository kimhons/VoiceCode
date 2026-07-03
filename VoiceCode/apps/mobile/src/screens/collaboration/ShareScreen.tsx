import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

interface ShareScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
  route: { params?: { transcriptId?: string } };
}

interface ShareEntry {
  id: string;
  email: string;
  role: string;
}

type Permission = 'View' | 'Edit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXPIRATIONS = ['24 hours', '7 days', '30 days'];

const ShareScreen: React.FC<ShareScreenProps> = ({ route }) => {
  const transcriptId = route.params?.transcriptId ?? '';
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<Permission>('View');
  const [expiration, setExpiration] = useState('7 days');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<ShareEntry[]>([
    { id: '1', email: 'sarah@example.com', role: 'Viewer' },
    { id: '2', email: 'mike@example.com', role: 'Owner' },
  ]);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const sendInvite = () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address');
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess('Transcript shared successfully');
  };

  const generateLink = () => {
    setLink(`https://voicecode.app/s/${transcriptId || 'abc123'}`);
  };

  const copyLink = () => {
    Clipboard.setStringAsync(link ?? '').catch(() => undefined);
    setCopied(true);
  };

  const confirmRemove = () => {
    if (pendingRemove) {
      setShares((prev) => prev.filter((s) => s.id !== pendingRemove));
      setPendingRemove(null);
    }
  };

  return (
    <ScrollView style={styles.container} testID="share-screen">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email</Text>
        <TextInput
          style={styles.input}
          testID="email-input"
          placeholder="name@example.com"
          placeholderTextColor="#8E8E93"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.chipRow} testID="permission-selector">
          {(['View', 'Edit'] as Permission[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, permission === p && styles.chipActive]}
              onPress={() => setPermission(p)}
            >
              <Text style={[styles.chipText, permission === p && styles.chipTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} testID="share-button" onPress={sendInvite}>
          <Ionicons name="mail-outline" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Send Invitation</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Share Link</Text>
        <View style={styles.linkRow}>
          <TouchableOpacity style={styles.secondaryButton} testID="generate-link" onPress={generateLink}>
            <Ionicons name="link-outline" size={18} color="#667eea" />
            <Text style={styles.secondaryButtonText}>Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} testID="copy-link" onPress={copyLink}>
            <Ionicons name="copy-outline" size={18} color="#667eea" />
            <Text style={styles.secondaryButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {link ? (
          <Text style={styles.linkText} testID="share-link">
            {link}
          </Text>
        ) : null}
        {copied ? <Text style={styles.success}>Copied to clipboard</Text> : null}

        <View style={styles.chipRow} testID="expiration-selector">
          {EXPIRATIONS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.chip, expiration === e && styles.chipActive]}
              onPress={() => setExpiration(e)}
            >
              <Text style={[styles.chipText, expiration === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Shares</Text>
        <View testID="shares-list">
          {shares.map((share) => (
            <View key={share.id} style={styles.shareRow} testID={`share-${share.id}`}>
              <View style={styles.shareInfo}>
                <Text style={styles.shareEmail}>{share.email}</Text>
                <Text style={styles.shareRole}>{share.role}</Text>
              </View>
              <TouchableOpacity
                testID={`remove-share-${share.id}`}
                onPress={() => setPendingRemove(share.id)}
              >
                <Ionicons name="close-circle-outline" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {pendingRemove ? (
          <TouchableOpacity style={styles.confirmButton} testID="confirm-remove" onPress={confirmRemove}>
            <Text style={styles.confirmButtonText}>Confirm Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  input: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a2e',
  },
  chipRow: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: '#667eea' },
  chipText: { fontSize: 14, color: '#1a1a2e' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef0ff',
    borderRadius: 10,
    paddingVertical: 12,
    flex: 1,
    marginRight: 8,
  },
  secondaryButtonText: { color: '#667eea', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  linkRow: { flexDirection: 'row' },
  linkText: { marginTop: 12, color: '#667eea', fontSize: 14 },
  error: { color: '#FF3B30', marginTop: 12, fontSize: 14 },
  success: { color: '#34C759', marginTop: 12, fontSize: 14 },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  shareInfo: { flex: 1 },
  shareEmail: { fontSize: 15, color: '#1a1a2e' },
  shareRole: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  confirmButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default ShareScreen;
