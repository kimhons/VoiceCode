// Simplified VoiceCode Pro Mobile - For Testing

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [count, setCount] = React.useState(0);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>🎙️ VoiceCode Pro</Text>
          <Text style={styles.subtitle}>Mobile App - Test Version</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✅ App is Working!</Text>
            <Text style={styles.cardText}>
              If you can see this screen, the basic app setup is working correctly.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧪 Interactive Test</Text>
            <Text style={styles.cardText}>Tap count: {count}</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => setCount(count + 1)}
            >
              <Text style={styles.buttonText}>Tap Me!</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Next Steps</Text>
            <Text style={styles.cardText}>
              • ✅ Basic React Native working{'\n'}
              • ✅ SafeAreaProvider working{'\n'}
              • ✅ State management working{'\n'}
              • ⏳ Need to add Redux{'\n'}
              • ⏳ Need to add Navigation{'\n'}
              • ⏳ Need to add Theme Context
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 What This Tests</Text>
            <Text style={styles.cardText}>
              This simplified version tests if the core React Native setup works 
              without Redux, Navigation, or custom contexts. If this works, we can 
              add features one by one to find what&apos;s causing the crash.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

