import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AuthMethod {
  id: string;
  name: string;
  type: 'app' | 'sms' | 'email' | 'hardware';
  isEnabled: boolean;
  isPrimary: boolean;
  lastUsed?: string;
}

const TwoFactorAuthScreen: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [authMethods, setAuthMethods] = useState<AuthMethod[]>([
    {
      id: '1',
      name: 'Authenticator App',
      type: 'app',
      isEnabled: true,
      isPrimary: true,
      lastUsed: 'Today',
    },
    {
      id: '2',
      name: 'SMS Verification',
      type: 'sms',
      isEnabled: true,
      isPrimary: false,
      lastUsed: 'Last week',
    },
    { id: '3', name: 'Email Verification', type: 'email', isEnabled: false, isPrimary: false },
    {
      id: '4',
      name: 'Hardware Key (YubiKey)',
      type: 'hardware',
      isEnabled: false,
      isPrimary: false,
    },
  ]);

  const backupCodes = ['ABCD-1234', 'EFGH-5678', 'IJKL-9012', 'MNOP-3456'];

  const getMethodIcon = (type: string): string => {
    switch (type) {
      case 'app':
        return 'phone-portrait';
      case 'sms':
        return 'chatbubble';
      case 'email':
        return 'mail';
      case 'hardware':
        return 'key';
      default:
        return 'shield';
    }
  };

  const getMethodColor = (type: string): string => {
    switch (type) {
      case 'app':
        return '#007AFF';
      case 'sms':
        return '#34C759';
      case 'email':
        return '#FF9500';
      case 'hardware':
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  const toggleMethod = (id: string) => {
    setAuthMethods(prev => prev.map(m => (m.id === id ? { ...m, isEnabled: !m.isEnabled } : m)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: is2FAEnabled ? '#34C75920' : '#FF3B3020' },
            ]}
          >
            <Ionicons
              name={is2FAEnabled ? 'shield-checkmark' : 'shield'}
              size={32}
              color={is2FAEnabled ? '#34C759' : '#FF3B30'}
            />
          </View>
          <Text style={styles.statusTitle}>
            {is2FAEnabled ? '2FA is Enabled' : '2FA is Disabled'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {is2FAEnabled
              ? 'Your account is protected with an extra layer of security'
              : 'Enable 2FA to add an extra layer of security'}
          </Text>
          <TouchableOpacity
            style={[styles.toggleButton, is2FAEnabled && styles.toggleButtonActive]}
            onPress={() => setIs2FAEnabled(!is2FAEnabled)}
          >
            <Text style={[styles.toggleText, is2FAEnabled && styles.toggleTextActive]}>
              {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Text>
          </TouchableOpacity>
        </View>

        {is2FAEnabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Authentication Methods</Text>
              {authMethods.map(method => (
                <View key={method.id} style={styles.methodCard}>
                  <View
                    style={[
                      styles.methodIcon,
                      { backgroundColor: getMethodColor(method.type) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getMethodIcon(method.type) as any}
                      size={22}
                      color={getMethodColor(method.type)}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <View style={styles.methodHeader}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      {method.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    {method.lastUsed && (
                      <Text style={styles.methodLastUsed}>Last used: {method.lastUsed}</Text>
                    )}
                  </View>
                  <Switch
                    value={method.isEnabled}
                    onValueChange={() => toggleMethod(method.id)}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Backup Codes</Text>
              <View style={styles.backupCard}>
                <View style={styles.backupHeader}>
                  <Ionicons name="document-text" size={20} color="#FF9500" />
                  <Text style={styles.backupTitle}>Recovery Codes</Text>
                </View>
                <Text style={styles.backupDesc}>
                  Save these codes in a secure location. Each code can only be used once.
                </Text>
                <View style={styles.codesGrid}>
                  {backupCodes.map((code, idx) => (
                    <View key={idx} style={styles.codeItem}>
                      <Text style={styles.codeText}>{code}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.backupActions}>
                  <TouchableOpacity style={styles.backupAction}>
                    <Ionicons name="copy" size={16} color="#007AFF" />
                    <Text style={styles.backupActionText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.backupAction}>
                    <Ionicons name="download" size={16} color="#007AFF" />
                    <Text style={styles.backupActionText}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.backupAction}>
                    <Ionicons name="refresh" size={16} color="#FF9500" />
                    <Text style={[styles.backupActionText, { color: '#FF9500' }]}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trusted Devices</Text>
              <View style={styles.deviceCard}>
                <View style={styles.deviceInfo}>
                  <Ionicons name="phone-portrait" size={24} color="#007AFF" />
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName}>iPhone 15 Pro</Text>
                    <Text style={styles.deviceMeta}>Added Jan 15, 2026 • Current device</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <View style={styles.deviceCard}>
                <View style={styles.deviceInfo}>
                  <Ionicons name="laptop" size={24} color="#34C759" />
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName}>MacBook Pro</Text>
                    <Text style={styles.deviceMeta}>Added Dec 20, 2025 • Last used: Today</Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={styles.securityLink}>
            <Ionicons name="help-circle" size={20} color="#007AFF" />
            <Text style={styles.securityLinkText}>Learn more about 2FA</Text>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 32 },
  content: { flex: 1 },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 24,
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  statusSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  toggleButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#34C759',
  },
  toggleButtonActive: { backgroundColor: '#FF3B3020' },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  toggleTextActive: { color: '#FF3B30' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: { flex: 1 },
  methodHeader: { flexDirection: 'row', alignItems: 'center' },
  methodName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  primaryBadge: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  primaryText: { fontSize: 10, fontWeight: '600', color: '#007AFF' },
  methodLastUsed: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  backupCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  backupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backupTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginLeft: 10 },
  backupDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  codesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  codeItem: {
    backgroundColor: '#F9F9FB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  codeText: { fontSize: 14, fontFamily: 'Courier', color: '#1C1C1E', fontWeight: '600' },
  backupActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  backupAction: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  backupActionText: { fontSize: 14, color: '#007AFF', marginLeft: 6 },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceText: { marginLeft: 12 },
  deviceName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  deviceMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  securityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 14,
  },
  securityLinkText: { flex: 1, fontSize: 15, color: '#007AFF', marginLeft: 10 },
  bottomPadding: { height: 40 },
});

export default TwoFactorAuthScreen;
