// VoiceCode Mobile - Welcome Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import WelcomeScreen from '../../screens/onboarding/WelcomeScreen';

describe('WelcomeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render welcome screen', () => {
      const { getByTestId } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('welcome-screen')).toBeTruthy();
    });

    it('should display app logo', () => {
      const { getByTestId } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('app-logo')).toBeTruthy();
    });

    it('should display welcome message', () => {
      const { getByText } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/welcome/i)).toBeTruthy();
    });

    it('should display app tagline', () => {
      const { getByText } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/voice/i)).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should navigate to login', async () => {
      const { getByTestId } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('login-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });

    it('should navigate to signup', async () => {
      const { getByTestId } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('signup-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
    });

    it('should continue as guest', async () => {
      const { getByText } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/continue as guest/i));

      expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
    });
  });

  describe('Social Login', () => {
    it('should login with Google', async () => {
      const { getByTestId } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('google-login'));
    });

    it('should login with Apple', async () => {
      const { getByTestId } = renderWithProviders(
        <WelcomeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('apple-login'));
    });
  });
});
