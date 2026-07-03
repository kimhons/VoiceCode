// VoiceCode Pro Mobile - Testing with Theme Context
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={[styles.title, { color: theme.colors.text }]}> VoiceCode Pro</Text>
      <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
        Test Version - With Theme Context!
      </Text>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
        Theme is working! Mode: {isDark ? 'Dark' : 'Light'}
      </Text>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
