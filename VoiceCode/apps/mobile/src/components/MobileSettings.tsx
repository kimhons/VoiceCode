/**
 * Mobile Settings Component
 * Phase 5.4: Mobile App Enhancements
 * 
 * Settings UI for mobile-specific features
 */

import React, { useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useMobileEnhancements } from '../hooks/useMobileEnhancements';

export const MobileSettings: React.FC = () => {
  const {
    isInitialized,
    initialize,
    isOfflineModeEnabled,
    enableOfflineMode,
    disableOfflineMode,
    offlineStorageSize,
    getOfflineStorageSize,
    clearOfflineStorage,
    isBackgroundRecording,
    startBackgroundRecording,
    stopBackgroundRecording,
    isHapticsEnabled,
    triggerHaptic,
    enableHaptics,
    disableHaptics,
    isBiometricEnabled,
    biometricType,
    authenticateWithBiometrics,
    enableBiometricAuth,
    disableBiometricAuth,
    isLoading,
    error,
    clearError,
  } = useMobileEnhancements({ autoInitialize: true });

  useEffect(() => {
    if (isInitialized) {
      getOfflineStorageSize();
    }
  }, [isInitialized, getOfflineStorageSize]);

  const handleOfflineModeToggle = async (value: boolean) => {
    try {
      await triggerHaptic('selection');
      if (value) {
        await enableOfflineMode();
      } else {
        await disableOfflineMode();
      }
      await triggerHaptic('success');
    } catch (err) {
      await triggerHaptic('error');
      Alert.alert('Error', 'Failed to toggle offline mode');
    }
  };

  const handleHapticsToggle = async (value: boolean) => {
    try {
      if (value) {
        await enableHaptics();
        await triggerHaptic('success');
      } else {
        await disableHaptics();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle haptics');
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      await triggerHaptic('selection');
      if (value) {
        await enableBiometricAuth();
        await triggerHaptic('success');
      } else {
        await disableBiometricAuth();
        await triggerHaptic('success');
      }
    } catch (err) {
      await triggerHaptic('error');
      Alert.alert('Error', 'Failed to toggle biometric authentication');
    }
  };

  const handleTestBiometric = async () => {
    try {
      await triggerHaptic('selection');
      const success = await authenticateWithBiometrics();
      if (success) {
        await triggerHaptic('success');
        Alert.alert('Success', 'Authentication successful!');
      } else {
        await triggerHaptic('error');
        Alert.alert('Failed', 'Authentication failed');
      }
    } catch (err) {
      await triggerHaptic('error');
      Alert.alert('Error', 'Failed to authenticate');
    }
  };

  const handleClearStorage = async () => {
    Alert.alert(
      'Clear Offline Storage',
      'Are you sure you want to clear all offline data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await triggerHaptic('warning');
              await clearOfflineStorage();
              await triggerHaptic('success');
              Alert.alert('Success', 'Offline storage cleared');
            } catch (err) {
              await triggerHaptic('error');
              Alert.alert('Error', 'Failed to clear storage');
            }
          },
        },
      ]
    );
  };

  const handleBackgroundRecordingToggle = async (value: boolean) => {
    try {
      await triggerHaptic('selection');
      if (value) {
        await startBackgroundRecording();
        await triggerHaptic('success');
      } else {
        await stopBackgroundRecording();
        await triggerHaptic('success');
      }
    } catch (err) {
      await triggerHaptic('error');
      Alert.alert('Error', 'Failed to toggle background recording');
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading mobile settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📱 Mobile Settings</Text>
        <Text style={styles.subtitle}>Configure mobile-specific features</Text>
      </View>

      {/* Offline Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Mode</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Offline Mode</Text>
            <Text style={styles.settingDescription}>
              Access transcripts without internet connection
            </Text>
          </View>
          <Switch
            value={isOfflineModeEnabled}
            onValueChange={handleOfflineModeToggle}
            disabled={isLoading}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Storage Used</Text>
            <Text style={styles.settingDescription}>
              {offlineStorageSize.toFixed(2)} MB
            </Text>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleClearStorage}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Background Recording */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Background Recording</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Background Recording</Text>
            <Text style={styles.settingDescription}>
              Continue recording when app is in background
            </Text>
          </View>
          <Switch
            value={isBackgroundRecording}
            onValueChange={handleBackgroundRecordingToggle}
            disabled={isLoading}
          />
        </View>
      </View>

      {/* Haptic Feedback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Haptic Feedback</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Haptics</Text>
            <Text style={styles.settingDescription}>
              Vibration feedback for interactions
            </Text>
          </View>
          <Switch
            value={isHapticsEnabled}
            onValueChange={handleHapticsToggle}
            disabled={isLoading}
          />
        </View>
        {isHapticsEnabled && (
          <View style={styles.hapticButtons}>
            <TouchableOpacity
              style={styles.hapticButton}
              onPress={() => triggerHaptic('success')}
            >
              <Text style={styles.hapticButtonText}>Success</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hapticButton}
              onPress={() => triggerHaptic('warning')}
            >
              <Text style={styles.hapticButtonText}>Warning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hapticButton}
              onPress={() => triggerHaptic('error')}
            >
              <Text style={styles.hapticButtonText}>Error</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hapticButton}
              onPress={() => triggerHaptic('impact')}
            >
              <Text style={styles.hapticButtonText}>Impact</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Biometric Authentication */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biometric Authentication</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>
              {biometricType === 'face' && '👤 Face ID'}
              {biometricType === 'fingerprint' && '👆 Fingerprint'}
              {biometricType === 'iris' && '👁️ Iris'}
              {biometricType === 'none' && '🔒 Not Available'}
            </Text>
            <Text style={styles.settingDescription}>
              {biometricType !== 'none'
                ? 'Secure app with biometric authentication'
                : 'Biometric authentication not available'}
            </Text>
          </View>
          <Switch
            value={isBiometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={isLoading || biometricType === 'none'}
          />
        </View>
        {isBiometricEnabled && biometricType !== 'none' && (
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestBiometric}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Authentication</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  errorClose: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#dee2e6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  hapticButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  hapticButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  hapticButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MobileSettings;

