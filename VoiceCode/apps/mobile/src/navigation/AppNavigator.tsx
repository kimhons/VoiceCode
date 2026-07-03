// VoiceCode Mobile - App Navigator

import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSelector } from '../store';
import { useOnboarding } from '../contexts/OnboardingContext';
import { AgentProvider } from '../contexts/AgentContext';
import { AgentFAB } from '../components/agent';

// Import screens and navigators
import { SplashScreen, OnboardingScreen, PermissionsScreen } from '../screens/onboarding';
import { PricingScreen } from '../screens/pricing';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const navigationRef = useNavigationContainerRef();

  // Define fonts for web compatibility with bottom tabs
  const navigationFonts = {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900' as const,
    },
  };

  // Show FAB only when authenticated and not in onboarding
  const showAgentFAB = isAuthenticated && hasCompletedOnboarding && !isLoading;

  return (
    <AgentProvider navigation={navigationRef}>
      <NavigationContainer
        ref={navigationRef}
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
          fonts: navigationFonts,
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

        {/* Agent FAB - Global AI assistant access */}
        {showAgentFAB && <AgentFAB />}
      </NavigationContainer>
    </AgentProvider>
  );
};
