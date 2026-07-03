import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeScreenProps {
  navigation: { navigate: (screen: string) => void; replace: (screen: string) => void };
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container} testID="welcome-screen">
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          testID="app-logo"
        />
        <Text style={styles.heading}>Welcome</Text>
        <Text style={styles.tagline}>Voice-directed coding, anywhere you are.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
          testID="login-button"
        >
          <Text style={styles.primaryText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Signup')}
          testID="signup-button"
        >
          <Text style={styles.secondaryText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => navigation.replace('Home')}
            testID="google-login"
          >
            <Ionicons name="logo-google" size={20} color="#1a1a2e" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => navigation.replace('Home')}
            testID="apple-login"
          >
            <Ionicons name="logo-apple" size={20} color="#1a1a2e" />
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.guestButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.guestText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 96, height: 96, borderRadius: 22, marginBottom: 20 },
  heading: { fontSize: 32, fontWeight: '700', color: '#1a1a2e' },
  tagline: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 12, lineHeight: 24 },
  actions: { paddingBottom: 24 },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  secondaryText: { color: '#667eea', fontSize: 16, fontWeight: '700' },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f2f3f7',
    marginHorizontal: 4,
  },
  socialText: { marginLeft: 8, color: '#1a1a2e', fontWeight: '600' },
  guestButton: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  guestText: { color: '#888', fontWeight: '600' },
});

export default WelcomeScreen;
