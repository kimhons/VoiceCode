// VoiceCode Mobile - Reminders Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import RemindersScreen from '../../screens/general/RemindersScreen';

describe('RemindersScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render reminders screen', () => {
      const { getByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('reminders-screen')).toBeTruthy();
    });

    it('should display reminders list', () => {
      const { getByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('reminders-list')).toBeTruthy();
    });
  });

  describe('Reminder Items', () => {
    it('should display reminder title', () => {
      const { getByText } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/reminder/i)).toBeTruthy();
    });

    it('should display reminder time', () => {
      const { getByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('reminder-time-1')).toBeTruthy();
    });
  });

  describe('Create Reminder', () => {
    it('should open create reminder modal', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('create-reminder'));

      const modal = await findByTestId('create-reminder-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should complete reminder', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('complete-reminder-1'));

      await waitFor(() => {
        expect(queryByTestId('reminder-1')).toBeNull();
      });
    });

    it('should snooze reminder', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('snooze-reminder-1'));

      const picker = await findByTestId('snooze-picker');
      expect(picker).toBeTruthy();
    });

    it('should delete reminder', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('delete-reminder-1'));

      await waitFor(() => {
        expect(queryByTestId('reminder-1')).toBeNull();
      });
    });
  });

  describe('Navigate to Transcript', () => {
    it('should navigate to associated transcript', async () => {
      const { getByTestId } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('reminder-transcript-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', expect.any(Object));
    });
  });

  describe('Empty State', () => {
    it('should show empty state', () => {
      const { getByText } = renderWithProviders(
        <RemindersScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/no reminders/i)).toBeTruthy();
    });
  });
});
