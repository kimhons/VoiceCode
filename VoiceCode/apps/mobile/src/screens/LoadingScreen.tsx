/**
 * Loading Screen
 * Displayed while app is initializing
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VoiceCode</Text>
      <ActivityIndicator size="large" color="#667eea" style={styles.loader} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

