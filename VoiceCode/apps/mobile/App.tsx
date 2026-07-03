// VoiceCode Mobile - Main App Component
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/store';
import { STRIPE_PUBLISHABLE_KEY } from './src/config/constants';

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.voicecode.app"
          urlScheme="voicecode"
        >
          <ThemeProvider>
            <OnboardingProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </OnboardingProvider>
          </ThemeProvider>
        </StripeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
