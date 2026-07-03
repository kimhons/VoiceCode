// VoiceCode Mobile - Edit Profile Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import EditProfileScreen from '../../screens/profile/EditProfileScreen';

describe('EditProfileScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render edit profile screen', () => {
      const { getByTestId } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('edit-profile-screen')).toBeTruthy();
    });

    it('should display current avatar', () => {
      const { getByTestId } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('avatar-image')).toBeTruthy();
    });
  });

  describe('Avatar', () => {
    it('should change avatar from gallery', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('change-avatar'));
      fireEvent.press(getByTestId('choose-from-gallery'));
    });

    it('should take photo for avatar', async () => {
      const { getByTestId } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('change-avatar'));
      fireEvent.press(getByTestId('take-photo'));
    });

    it('should remove avatar', async () => {
      const { getByTestId } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('change-avatar'));
      fireEvent.press(getByTestId('remove-avatar'));
    });
  });

  describe('Name', () => {
    it('should update display name', async () => {
      const { getByTestId } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'New Name');
    });

    it('should validate name', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), '');
      fireEvent.press(getByTestId('save-button'));

      const error = await findByText(/required/i);
      expect(error).toBeTruthy();
    });
  });

  describe('Save', () => {
    it('should save profile changes', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'New Name');
      fireEvent.press(getByTestId('save-button'));

      const success = await findByText(/saved/i);
      expect(success).toBeTruthy();
    });

    it('should go back after save', async () => {
      const { getByTestId } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'New Name');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel', () => {
    it('should go back on cancel', () => {
      const { getByTestId } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('cancel-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('should confirm discard if unsaved changes', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <EditProfileScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('name-input'), 'New Name');
      fireEvent.press(getByTestId('cancel-button'));

      const confirmation = await findByText(/discard/i);
      expect(confirmation).toBeTruthy();
    });
  });
});
