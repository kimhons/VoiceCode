/**
 * VoiceFlow Pro - Profile Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, logout } from '../store';

export default function ProfileScreen() {
  const user = useSelector((state: RootState) => state.user);
  const recordings = useSelector((state: RootState) => state.recordings.recordings);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const totalMinutes = Math.round(recordings.reduce((acc, r) => acc + r.duration, 0) / 60);
  const transcribedCount = recordings.filter(r => r.transcription).length;

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'cloud-outline', label: 'Cloud Sync', onPress: () => {} },
    { icon: 'shield-checkmark-outline', label: 'Privacy', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'About', onPress: () => {} },
  ];

  const subscriptionColors = { free: '#666', pro: '#007AFF', enterprise: '#9b59b6' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user.user ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.user.name.charAt(0).toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user.user?.name || 'Guest User'}</Text>
          <Text style={styles.email}>{user.user?.email || 'Not signed in'}</Text>
          <View style={[styles.subscriptionBadge, { backgroundColor: subscriptionColors[user.subscription] }]}>
            <Text style={styles.subscriptionText}>{user.subscription.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{recordings.length}</Text>
            <Text style={styles.statLabel}>Recordings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalMinutes}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{transcribedCount}</Text>
            <Text style={styles.statLabel}>Transcribed</Text>
          </View>
        </View>

        {user.subscription === 'free' && (
          <TouchableOpacity style={styles.upgradeCard}>
            <View style={styles.upgradeContent}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <View style={styles.upgradeText}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDescription}>Unlimited recordings & premium features</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={22} color="#666" />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings' as never)}>
          <Ionicons name="settings-outline" size={22} color="#007AFF" />
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>

        {user.isAuthenticated ? (
          <TouchableOpacity style={styles.logoutButton} onPress={() => dispatch(logout())}>
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.signInButton}>
            <Ionicons name="log-in-outline" size={22} color="#007AFF" />
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>VoiceFlow Pro v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff' },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  subscriptionBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  subscriptionText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 16, paddingVertical: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#eee' },
  upgradeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF' },
  upgradeContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  upgradeText: { marginLeft: 12 },
  upgradeTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  upgradeDescription: { fontSize: 12, color: '#666', marginTop: 2 },
  menuSection: { backgroundColor: '#fff', marginTop: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLabel: { fontSize: 16, color: '#333', marginLeft: 12 },
  settingsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginTop: 16, padding: 16 },
  settingsText: { fontSize: 16, color: '#007AFF', marginLeft: 8 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginTop: 8, padding: 16 },
  logoutText: { fontSize: 16, color: '#FF3B30', marginLeft: 8 },
  signInButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginTop: 8, padding: 16 },
  signInText: { fontSize: 16, color: '#007AFF', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, color: '#999', marginVertical: 24 },
});

