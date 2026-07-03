// VoiceCode Mobile - Account Settings Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import AccountSettingsScreen from '../../screens/settings/AccountSettingsScreen';

describe('AccountSettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render account settings', () => {
      const { getByTestId } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('account-settings-screen')).toBeTruthy();
    });

    it('should display user email', () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/email/i)).toBeTruthy();
    });
  });

  describe('Profile', () => {
    it('should navigate to edit profile', async () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/edit profile/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditProfile');
    });
  });

  describe('Password', () => {
    it('should navigate to change password', async () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/change password/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ChangePassword');
    });
  });

  describe('Connected Accounts', () => {
    it('should show connected accounts', () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/connected accounts/i)).toBeTruthy();
    });

    it('should navigate to connected accounts', async () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/connected accounts/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ConnectedAccounts');
    });
  });

  describe('Subscription', () => {
    it('should show subscription status', () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/subscription/i)).toBeTruthy();
    });

    it('should navigate to subscription', async () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/manage subscription/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Subscription');
    });
  });

  describe('Logout', () => {
    it('should logout', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('logout-button'));

      const confirmation = await findByText(/are you sure/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Delete Account', () => {
    it('should navigate to delete account', async () => {
      const { getByText } = renderWithProviders(
        <AccountSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/delete account/i));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('DeleteAccount');
    });
  });
});
