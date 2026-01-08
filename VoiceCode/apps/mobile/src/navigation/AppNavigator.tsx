// VoiceFlow Pro Mobile - App Navigator

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens and navigators
import { SplashScreen, OnboardingScreen, PermissionsScreen } from '../screens/onboarding';
import { PricingScreen } from '../screens/pricing';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const ONBOARDING_KEY = '@voiceflow_onboarding_complete';

export const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { isAuthenticated } = useAppSelector(state => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        // Simulate splash screen delay
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    checkOnboarding();
  }, []);

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {isLoading ? (
          // Show splash screen while loading
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !hasCompletedOnboarding ? (
          // Show onboarding flow for first-time users
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Permissions" component={PermissionsScreen} />
          </>
        ) : !isAuthenticated ? (
          // Show auth flow for unauthenticated users
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Show main app for authenticated users
          <Stack.Screen name="Main" component={MainNavigator} />
        )}

        {/* Modal screens available from anywhere */}
        <Stack.Screen
          name="Pricing"
          component={PricingScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Pricing Plans',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

