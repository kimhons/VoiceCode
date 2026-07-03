import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AccountSettingsScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ navigation }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userEmail = 'test@example.com';

  const Row = ({
    label,
    icon,
    onPress,
    testID,
    danger,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    testID?: string;
    danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={20} color={danger ? '#e5484d' : '#667eea'} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, danger && styles.dangerLabel]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} testID="account-settings-screen">
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={64} color="#667eea" />
        <Text style={styles.emailLabel}>Email</Text>
        <Text style={styles.emailValue}>{userEmail}</Text>
      </View>

      <View style={styles.section}>
        <Row label="Edit Profile" icon="create-outline" onPress={() => navigation.navigate('EditProfile')} />
        <Row label="Change Password" icon="key-outline" onPress={() => navigation.navigate('ChangePassword')} />
        <Row
          label="Connected Accounts"
          icon="link-outline"
          onPress={() => navigation.navigate('ConnectedAccounts')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.status}>Pro plan · renews monthly</Text>
        <Row
          label="Manage Subscription"
          icon="card-outline"
          onPress={() => navigation.navigate('Subscription')}
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => setShowLogoutConfirm(true)} testID="logout-button">
          <Ionicons name="log-out-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Log Out</Text>
        </TouchableOpacity>
        {showLogoutConfirm ? (
          <View style={styles.confirm} testID="logout-confirm">
            <Text style={styles.confirmText}>Are you sure you want to log out?</Text>
          </View>
        ) : null}
        <Row
          label="Delete Account"
          icon="trash-outline"
          onPress={() => navigation.navigate('DeleteAccount')}
          danger
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { alignItems: 'center', paddingVertical: 28 },
  emailLabel: { fontSize: 12, color: '#888', marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  emailValue: { fontSize: 16, color: '#1a1a2e', marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  status: { fontSize: 13, color: '#667eea', paddingHorizontal: 16, paddingTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  dangerLabel: { color: '#e5484d' },
  confirm: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff5f5' },
  confirmText: { fontSize: 14, color: '#e5484d' },
});

export default AccountSettingsScreen;
