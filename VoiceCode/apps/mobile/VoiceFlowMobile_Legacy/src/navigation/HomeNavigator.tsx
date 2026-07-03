// VoiceCode Pro Mobile - Home Navigator

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from './types';
import { useTheme } from '../contexts/ThemeContext';
import { HomeScreen } from '../screens/home';
import { AudioTestScreen } from '../screens/test/AudioTestScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export const HomeNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false, // Home screen has its own header
        }}
      />
      <Stack.Screen
        name="RecordingScreen"
        component={HomeScreen} // TODO: Create RecordingScreen
        options={{
          title: 'Recording',
        }}
      />
      <Stack.Screen
        name="ReviewScreen"
        component={HomeScreen} // TODO: Create ReviewScreen
        options={{
          title: 'Review Recording',
        }}
      />
      <Stack.Screen
        name="AudioTest"
        component={AudioTestScreen}
        options={{
          title: 'Audio Services Test',
        }}
      />
    </Stack.Navigator>
  );
};

