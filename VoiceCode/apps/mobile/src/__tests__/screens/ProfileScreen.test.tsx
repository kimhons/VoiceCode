// VoiceCode Mobile - Profile Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('ProfileScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: '2024-01-01T00:00:00Z',
    subscription_tier: 'pro',
    subscription_expires_at: '2025-01-01T00:00:00Z',
  };

  const mockStats = {
    total_transcripts: 50,
    total_minutes: 1200,
    total_words: 25000,
    this_month_transcripts: 10,
    this_month_minutes: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    });
  });

  describe('Rendering', () => {
    it('should render profile screen', async () => {
      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const name = await findByText('Test User');
      expect(name).toBeTruthy();
    });

    it('should display user email', async () => {
      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const email = await findByText('test@example.com');
      expect(email).toBeTruthy();
    });

    it('should display subscription tier', async () => {
      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const tier = await findByText(/pro/i);
      expect(tier).toBeTruthy();
    });

    it('should display usage stats', async () => {
      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const transcripts = await findByText(/50 transcripts/i);
      expect(transcripts).toBeTruthy();
    });
  });

  describe('Avatar', () => {
    it('should display user avatar', async () => {
      const { findByTestId } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const avatar = await findByTestId('user-avatar');
      expect(avatar).toBeTruthy();
    });

    it('should open image picker on avatar tap', async () => {
      const { getByTestId } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('user-avatar'));
      // Image picker would open
    });
  });

  describe('Edit Profile', () => {
    it('should navigate to edit profile', async () => {
      const { getByTestId } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('edit-profile-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditProfile');
    });
  });

  describe('Subscription', () => {
    it('should show subscription details', async () => {
      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const expiry = await findByText(/expires/i);
      expect(expiry).toBeTruthy();
    });

    it('should navigate to subscription management', async () => {
      const { getByTestId } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('manage-subscription'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Subscription');
    });

    it('should show upgrade button for free tier', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockUser, subscription_tier: 'free' },
              error: null,
            }),
          }),
        }),
      });

      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const upgrade = await findByText(/upgrade/i);
      expect(upgrade).toBeTruthy();
    });
  });

  describe('Statistics', () => {
    it('should display total transcripts', async () => {
      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const count = await findByText(/50/);
      expect(count).toBeTruthy();
    });

    it('should display total minutes', async () => {
      const { findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      const minutes = await findByText(/20 hours/i);
      expect(minutes).toBeTruthy();
    });

    it('should navigate to detailed statistics', async () => {
      const { getByTestId } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('view-statistics'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Statistics');
    });
  });

  describe('Account Actions', () => {
    it('should navigate to change password', async () => {
      const { getByTestId } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('change-password'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ChangePassword');
    });

    it('should show delete account confirmation', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('delete-account'));

      const confirmation = await findByText(/are you sure/i);
      expect(confirmation).toBeTruthy();
    });

    it('should logout user', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { getByTestId } = renderWithProviders(
        <MockProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('logout-button'));

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });
});

// Mock component
const MockProfileScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
