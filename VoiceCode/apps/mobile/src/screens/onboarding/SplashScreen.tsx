// VoiceCode Mobile - Splash Screen

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export const SplashScreen: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // TODO: Initialize app (check auth, load settings, etc.)
    // For now, just show splash for 2 seconds
    const timer = setTimeout(() => {
      // Navigate to next screen
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Text style={[styles.title, { color: '#FFFFFF' }]}>VoiceCode</Text>
      <Text style={[styles.subtitle, { color: '#FFFFFF' }]}>
        Voice to Text, Perfected
      </Text>
      <ActivityIndicator
        size="large"
        color="#FFFFFF"
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

