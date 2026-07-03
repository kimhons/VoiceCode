// VoiceCode Mobile - Profile Screen

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Text, Button, Card } from '../../components/common';

type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<ProfileNavigationProp>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: '💳',
      title: 'Subscription',
      subtitle: 'Manage your plan and billing',
      onPress: () => navigation.navigate('SubscriptionScreen'),
    },
    {
      icon: '👤',
      title: 'Account Settings',
      subtitle: 'Update your profile information',
      onPress: () => navigation.navigate('AccountScreen'),
    },
    {
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon!'),
    },
    {
      icon: '🔒',
      title: 'Privacy & Security',
      subtitle: 'Control your data and privacy',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
    },
    {
      icon: '❓',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Support', 'Email: support@VoiceCodepro.com'),
    },
    {
      icon: '📄',
      title: 'Terms & Privacy Policy',
      subtitle: 'Read our terms and privacy policy',
      onPress: () => Alert.alert('Coming Soon', 'Terms and privacy policy coming soon!'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text variant="h2" color={theme.colors.textPrimary} style={styles.userName}>
            {user?.name || 'User'}
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} style={styles.userEmail}>
            {user?.email || 'user@example.com'}
          </Text>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuTextContainer}>
                  <Text variant="body" color={theme.colors.textPrimary} style={styles.menuTitle}>
                    {item.title}
                  </Text>
                  <Text variant="caption" color={theme.colors.textSecondary}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text variant="caption" color={theme.colors.textSecondary} style={styles.appVersion}>
            VoiceCode v1.0.0
          </Text>
        </View>

        {/* Logout Button */}
        <Button
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    marginBottom: 0,
  },
  menuSection: {
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appVersion: {
    textAlign: 'center',
  },
  logoutButton: {
    marginBottom: 20,
  },
});

