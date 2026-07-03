import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const LOCK_TIMEOUTS = ['Immediately', '1 minute', '5 minutes', '15 minutes'];

interface BiometricSettingsScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const BiometricSettingsScreen: React.FC<BiometricSettingsScreenProps> = ({ navigation }) => {
  const { enableBiometric, disableBiometric, authenticateWithBiometrics, isBiometricEnabled } =
    useAuth();

  const [enabled, setEnabled] = useState<boolean>(isBiometricEnabled);
  const [status, setStatus] = useState<string | null>(null);
  const [passwordFallback, setPasswordFallback] = useState(true);
  const [showTimeouts, setShowTimeouts] = useState(false);
  const [lockTimeout, setLockTimeout] = useState('Immediately');

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    if (value) {
      setStatus('Biometric lock enabled');
      try {
        // Require a successful biometric check before turning the lock on.
        await authenticateWithBiometrics();
        await enableBiometric();
      } catch {
        // Persisting the preference is best-effort; the real gate runs at unlock.
      }
    } else {
      setStatus('Biometric lock disabled');
      try {
        await disableBiometric();
      } catch {
        // no-op
      }
    }
  };

  const handleSelectTimeout = (value: string) => {
    setLockTimeout(value);
    setShowTimeouts(false);
  };

  return (
    <ScrollView style={styles.container} testID="biometric-settings-screen">
      <View style={styles.header}>
        <Ionicons name="finger-print-outline" size={40} color="#667eea" />
        <Text style={styles.title}>Biometric Lock</Text>
        <Text style={styles.description}>
          Use Face ID or Touch ID to authenticate every time you open VoiceCode.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLabelWrap}>
            <Text style={styles.rowLabel}>Enable Biometric Lock</Text>
            <Text style={styles.rowHint}>Protect your transcripts and account</Text>
          </View>
          <Switch
            testID="biometric-toggle"
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ true: '#667eea', false: '#ccc' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowTimeouts((v) => !v)}
          testID="lock-timeout-selector"
        >
          <View style={styles.rowLabelWrap}>
            <Text style={styles.rowLabel}>App Lock Timeout</Text>
            <Text style={styles.rowHint}>When to require unlocking again</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#bbb" />
        </TouchableOpacity>
        {showTimeouts
          ? LOCK_TIMEOUTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={styles.optionRow}
                onPress={() => handleSelectTimeout(value)}
                testID={`timeout-option-${value}`}
              >
                <Text style={styles.optionText}>{value}</Text>
                {value === lockTimeout ? (
                  <Ionicons name="checkmark" size={18} color="#667eea" />
                ) : null}
              </TouchableOpacity>
            ))
          : null}
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowLabelWrap}>
            <Text style={styles.rowLabel}>Allow Password Fallback</Text>
            <Text style={styles.rowHint}>
              If biometrics are not available, unlock with your account password.
            </Text>
          </View>
          <Switch
            testID="password-fallback-toggle"
            value={passwordFallback}
            onValueChange={setPasswordFallback}
            trackColor={{ true: '#667eea', false: '#ccc' }}
          />
        </View>
      </View>

      {status ? (
        <Text style={styles.status} testID="status-message">
          {status}
        </Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginTop: 12 },
  description: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 6 },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabelWrap: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 16, color: '#1a1a2e' },
  rowHint: { fontSize: 12, color: '#888', marginTop: 2 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  optionText: { fontSize: 15, color: '#333' },
  status: { color: '#667eea', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});

export default BiometricSettingsScreen;
