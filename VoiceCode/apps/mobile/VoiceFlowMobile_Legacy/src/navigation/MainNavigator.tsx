// VoiceFlow Pro Mobile - Main Navigator (Bottom Tabs)

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { useTheme } from '../contexts/ThemeContext';
import { Text } from '../components/common';
import { HomeNavigator } from './HomeNavigator';
import { LibraryScreen } from '../screens/library';

// Placeholder components for other tabs

const SettingsPlaceholder = () => {
  const { theme } = useTheme();
  return (
    <Text variant="h2" color={theme.colors.textPrimary} align="center" style={{ marginTop: 100 }}>
      Settings Screen
    </Text>
  );
};

const ProfilePlaceholder = () => {
  const { theme } = useTheme();
  return (
    <Text variant="h2" color={theme.colors.textPrimary} align="center" style={{ marginTop: 100 }}>
      Profile Screen
    </Text>
  );
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsPlaceholder}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfilePlaceholder}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

