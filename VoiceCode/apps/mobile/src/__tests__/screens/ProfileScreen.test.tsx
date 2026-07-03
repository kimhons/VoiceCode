// VoiceCode Mobile - Profile Screen Tests

import React from 'react';
import { Alert } from 'react-native';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { StackNavigationProp } from '@react-navigation/stack';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import type { ProfileStackParamList } from '../../navigation/types';
import type { User } from '../../types';

type ProfileNav = StackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;

describe('ProfileScreen', () => {
  const navigate = jest.fn();
  const goBack = jest.fn();
  const mockNavigation = { navigate, goBack } as unknown as ProfileNav;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const preloadedState = {
    auth: {
      user: mockUser,
      token: 'token-123',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the user name', () => {
      const { getByText } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      expect(getByText('Test User')).toBeTruthy();
    });

    it('should display user email', () => {
      const { getByText } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  describe('Avatar', () => {
    it('should display user avatar', () => {
      const { getByTestId } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      expect(getByTestId('user-avatar')).toBeTruthy();
    });

    it('should show the user initial in the avatar', () => {
      const { getByText } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      expect(getByText('T')).toBeTruthy();
    });
  });

  describe('Menu navigation', () => {
    it('should navigate to subscription management', () => {
      const { getByText } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      fireEvent.press(getByText('Subscription'));

      expect(navigate).toHaveBeenCalledWith('SubscriptionScreen');
    });

    it('should navigate to account settings', () => {
      const { getByText } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      fireEvent.press(getByText('Account Settings'));

      expect(navigate).toHaveBeenCalledWith('AccountScreen');
    });
  });

  describe('Account Actions', () => {
    it('should show logout confirmation', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      fireEvent.press(getByTestId('logout-button'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Logout',
        'Are you sure you want to logout?',
        expect.any(Array)
      );

      alertSpy.mockRestore();
    });

    it('should clear the session when logout is confirmed', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByTestId, store } = renderWithProviders(
        <ProfileScreen navigation={mockNavigation} />,
        { preloadedState }
      );

      fireEvent.press(getByTestId('logout-button'));

      const buttons = alertSpy.mock.calls[0][2];
      const logoutButton = buttons?.find((b) => b.text === 'Logout');
      logoutButton?.onPress?.();

      await waitFor(() => {
        expect(store.getState().auth.isAuthenticated).toBe(false);
        expect(store.getState().auth.user).toBeNull();
      });

      alertSpy.mockRestore();
    });
  });
});
