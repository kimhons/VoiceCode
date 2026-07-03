import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Session {
  id: string;
  device: string;
  platform: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  icon: string;
}

const SessionManagementScreen: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'iPhone 15 Pro',
      platform: 'iOS 17.2',
      location: 'New York, US',
      lastActive: 'Now',
      isCurrent: true,
      icon: 'phone-portrait',
    },
    {
      id: '2',
      device: 'MacBook Pro',
      platform: 'macOS 14.2',
      location: 'New York, US',
      lastActive: '2 hours ago',
      isCurrent: false,
      icon: 'laptop',
    },
    {
      id: '3',
      device: 'Chrome on Windows',
      platform: 'Windows 11',
      location: 'Chicago, US',
      lastActive: 'Yesterday',
      isCurrent: false,
      icon: 'desktop',
    },
    {
      id: '4',
      device: 'iPad Pro',
      platform: 'iPadOS 17.2',
      location: 'New York, US',
      lastActive: '3 days ago',
      isCurrent: false,
      icon: 'tablet-portrait',
    },
  ]);

  const handleRevokeSession = (sessionId: string) => {
    Alert.alert('Revoke Session', 'Are you sure you want to sign out this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => setSessions(prev => prev.filter(s => s.id !== sessionId)),
      },
    ]);
  };

  const handleRevokeAll = () => {
    Alert.alert(
      'Sign Out All Devices',
      'This will sign out all other devices. You will remain signed in on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: () => setSessions(prev => prev.filter(s => s.isCurrent)),
        },
      ]
    );
  };

  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Active Sessions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#34C759" />
          <Text style={styles.infoText}>
            These are the devices currently signed in to your account. Revoke access to any device
            you don&apos;t recognize.
          </Text>
        </View>

        {currentSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Session</Text>
            <View style={styles.sessionCard}>
              <View style={[styles.sessionIcon, { backgroundColor: '#34C75920' }]}>
                <Ionicons name={currentSession.icon as any} size={24} color="#34C759" />
              </View>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.deviceName}>{currentSession.device}</Text>
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentText}>This device</Text>
                  </View>
                </View>
                <Text style={styles.sessionMeta}>{currentSession.platform}</Text>
                <View style={styles.sessionLocation}>
                  <Ionicons name="location" size={12} color="#8E8E93" />
                  <Text style={styles.locationText}>{currentSession.location}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {otherSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Other Sessions</Text>
              <TouchableOpacity onPress={handleRevokeAll}>
                <Text style={styles.revokeAllText}>Sign Out All</Text>
              </TouchableOpacity>
            </View>
            {otherSessions.map(session => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={[styles.sessionIcon, { backgroundColor: '#007AFF20' }]}>
                  <Ionicons name={session.icon as any} size={24} color="#007AFF" />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.deviceName}>{session.device}</Text>
                  <Text style={styles.sessionMeta}>{session.platform}</Text>
                  <View style={styles.sessionDetails}>
                    <View style={styles.sessionLocation}>
                      <Ionicons name="location" size={12} color="#8E8E93" />
                      <Text style={styles.locationText}>{session.location}</Text>
                    </View>
                    <Text style={styles.lastActive}>Active {session.lastActive}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.revokeButton}
                  onPress={() => handleRevokeSession(session.id)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="key" size={18} color="#FF9500" />
              </View>
              <Text style={styles.tipText}>Use a strong, unique password</Text>
            </View>
            <View style={styles.tipDivider} />
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="shield" size={18} color="#AF52DE" />
              </View>
              <Text style={styles.tipText}>Enable two-factor authentication</Text>
            </View>
            <View style={styles.tipDivider} />
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="eye" size={18} color="#007AFF" />
              </View>
              <Text style={styles.tipText}>Review sessions regularly</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 32 },
  content: { flex: 1 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#34C75915',
    margin: 16,
    borderRadius: 14,
    padding: 16,
  },
  infoText: { flex: 1, fontSize: 14, color: '#34C759', marginLeft: 12, lineHeight: 20 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revokeAllText: { fontSize: 14, color: '#FF3B30', fontWeight: '500' },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: { flex: 1 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center' },
  deviceName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  currentBadge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  currentText: { fontSize: 11, fontWeight: '600', color: '#34C759' },
  sessionMeta: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  sessionDetails: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sessionLocation: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  lastActive: { fontSize: 12, color: '#8E8E93', marginLeft: 12 },
  revokeButton: { padding: 4 },
  tipsCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 4 },
  tipItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipText: { fontSize: 14, color: '#1C1C1E' },
  tipDivider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 12 },
  bottomPadding: { height: 40 },
});

export default SessionManagementScreen;
