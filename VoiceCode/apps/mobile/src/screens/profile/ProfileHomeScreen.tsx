import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileStackNavigationProp } from '@/navigation/types';

const ProfileHomeScreen: React.FC = () => {
  const navigation = useNavigation<ProfileStackNavigationProp>();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#667eea" />
        </View>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Subscription')}>
          <Ionicons name="card-outline" size={24} color="#667eea" />
          <Text style={styles.menuText}>Subscription</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#667eea" />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Ionicons name="shield-outline" size={24} color="#667eea" />
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TermsOfService')}>
          <Ionicons name="document-text-outline" size={24} color="#667eea" />
          <Text style={styles.menuText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { alignItems: 'center', padding: 32, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  email: { fontSize: 14, color: '#999' },
  menu: { paddingTop: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 16 },
  signOutItem: { marginTop: 16 },
  signOutText: { color: '#e74c3c' },
});

export default ProfileHomeScreen;

