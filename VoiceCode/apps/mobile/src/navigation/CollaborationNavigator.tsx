// VoiceCode Mobile - Collaboration Navigator
// Week 6: Real-time Collaboration Features

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';

// Week 6: Collaboration Screens
import { CollaborationHubScreen } from '../screens/collaboration';
import { TeamManagementScreen } from '../screens/collaboration';
import { LiveCollaborationScreen } from '../screens/collaboration';
import { CollaborationSettingsScreen } from '../screens/collaboration';

export type CollaborationStackParamList = {
  CollaborationHub: undefined;
  TeamManagement: undefined;
  LiveCollaboration: { sessionId?: string };
  CollaborationSettings: undefined;
};

const Stack = createStackNavigator<CollaborationStackParamList>();

export const CollaborationNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontFamily: 'SF Pro Display',
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.4,
          color: theme.colors.textPrimary,
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="CollaborationHub"
        component={CollaborationHubScreen as any}
        options={{
          title: 'Collaboration',
          headerShown: false, // Hub has its own header
        }}
      />
      <Stack.Screen
        name="TeamManagement"
        component={TeamManagementScreen}
        options={{ title: 'Team Management' }}
      />
      <Stack.Screen
        name="LiveCollaboration"
        component={LiveCollaborationScreen as any}
        options={{ title: 'Live Collaboration' }}
      />
      <Stack.Screen
        name="CollaborationSettings"
        component={CollaborationSettingsScreen}
        options={{ title: 'Collaboration Settings' }}
      />
    </Stack.Navigator>
  );
};

