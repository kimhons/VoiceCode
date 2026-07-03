// Simple test App to verify Expo is working
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 VoiceCode Pro</Text>
      <Text style={styles.subtitle}>App is loading successfully!</Text>
      <Text style={styles.info}>If you see this, the setup works!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
  },
});

