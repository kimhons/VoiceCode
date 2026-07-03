// VoiceCode Mobile - Permissions Screen

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Text, Button, Card } from '../../components/common';

interface Permission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  required: boolean;
  granted: boolean;
}

export const PermissionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'microphone',
      title: 'Microphone Access',
      description: 'Required to record audio. We only access your microphone when you tap the record button.',
      emoji: '🎤',
      required: true,
      granted: false,
    },
    {
      id: 'storage',
      title: 'Storage Access',
      description: 'Required to save your recordings locally. Your data stays private and secure on your device.',
      emoji: '💾',
      required: true,
      granted: false,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Optional. Get notified when transcriptions are ready and receive helpful tips.',
      emoji: '🔔',
      required: false,
      granted: false,
    },
  ]);

  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = async (permissionId: string) => {
    setIsRequesting(true);

    // TODO: Implement actual permission requests
    // For microphone: use expo-av Audio.requestPermissionsAsync()
    // For storage: use expo-media-library MediaLibrary.requestPermissionsAsync()
    // For notifications: use expo-notifications Notifications.requestPermissionsAsync()

    // Simulate permission request
    setTimeout(() => {
      setPermissions(prev =>
        prev.map(p =>
          p.id === permissionId ? { ...p, granted: true } : p
        )
      );
      setIsRequesting(false);
    }, 1000);

    console.log('Request permission:', permissionId);
  };

  const requestAllPermissions = async () => {
    setIsRequesting(true);

    // Request all required permissions
    for (const permission of permissions.filter(p => p.required)) {
      await requestPermission(permission.id);
    }

    setIsRequesting(false);
  };

  const handleContinue = async () => {
    const allRequiredGranted = permissions
      .filter(p => p.required)
      .every(p => p.granted);

    if (!allRequiredGranted) {
      // Show alert or error
      console.log('Please grant all required permissions');
      return;
    }

    // Complete onboarding - navigation happens automatically via conditional rendering
    await completeOnboarding();
  };

  const handleSkip = async () => {
    // Complete onboarding even with limited permissions
    await completeOnboarding();
  };

  const allRequiredGranted = permissions
    .filter(p => p.required)
    .every(p => p.granted);

  const someRequiredPending = permissions
    .filter(p => p.required)
    .some(p => !p.granted);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="h1" align="center" color={theme.colors.primary}>
            Permissions
          </Text>
          <Text
            variant="body"
            align="center"
            color={theme.colors.textSecondary}
            style={styles.subtitle}
          >
            VoiceCode needs a few permissions to work properly
          </Text>
        </View>

        <View style={styles.permissionsContainer}>
          {permissions.map(permission => (
            <Card
              key={permission.id}
              style={styles.permissionCard}
              elevation={permission.granted ? 0 : 2}
            >
              <View style={styles.permissionHeader}>
                <Text style={styles.emoji}>{permission.emoji}</Text>
                <View style={styles.permissionInfo}>
                  <View style={styles.titleRow}>
                    <Text variant="h4" color={theme.colors.textPrimary}>
                      {permission.title}
                    </Text>
                    {permission.required && (
                      <View
                        style={[
                          styles.requiredBadge,
                          { backgroundColor: theme.colors.error + '20' },
                        ]}
                      >
                        <Text
                          variant="caption"
                          color={theme.colors.error}
                          style={styles.requiredText}
                        >
                          Required
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    variant="body"
                    color={theme.colors.textSecondary}
                    style={styles.permissionDescription}
                  >
                    {permission.description}
                  </Text>
                </View>
              </View>

              {permission.granted ? (
                <View
                  style={[
                    styles.grantedBadge,
                    { backgroundColor: theme.colors.success + '20' },
                  ]}
                >
                  <Text variant="caption" color={theme.colors.success}>
                    ✓ Granted
                  </Text>
                </View>
              ) : (
                <Button
                  variant={permission.required ? 'primary' : 'outline'}
                  size="small"
                  onPress={() => requestPermission(permission.id)}
                  disabled={isRequesting}
                  style={styles.permissionButton}
                >
                  Allow
                </Button>
              )}
            </Card>
          ))}
        </View>

        {someRequiredPending && (
          <Button
            variant="primary"
            onPress={requestAllPermissions}
            loading={isRequesting}
            disabled={isRequesting}
            fullWidth
            style={styles.allowAllButton}
          >
            Allow All Required Permissions
          </Button>
        )}

        {allRequiredGranted && (
          <Button
            variant="primary"
            onPress={handleContinue}
            fullWidth
            style={styles.continueButton}
          >
            Continue
          </Button>
        )}

        <View style={styles.footer}>
          <Text
            variant="caption"
            color={theme.colors.textSecondary}
            align="center"
            style={styles.footerText}
          >
            We respect your privacy. You can change these permissions anytime in Settings.
          </Text>

          {!allRequiredGranted && (
            <Button
              variant="ghost"
              onPress={handleSkip}
              style={styles.skipButton}
            >
              Skip for Now
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  subtitle: {
    marginTop: 8,
  },
  permissionsContainer: {
    marginBottom: 24,
  },
  permissionCard: {
    marginBottom: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginRight: 16,
  },
  permissionInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
  },
  permissionDescription: {
    lineHeight: 20,
  },
  permissionButton: {
    alignSelf: 'flex-start',
  },
  grantedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  allowAllButton: {
    marginBottom: 16,
  },
  continueButton: {
    marginBottom: 16,
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    lineHeight: 20,
    marginBottom: 16,
  },
  skipButton: {
    alignSelf: 'center',
  },
});

