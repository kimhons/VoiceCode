// VoiceCode Mobile - Licenses Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import LicensesScreen from '../../screens/settings/LicensesScreen';

describe('LicensesScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render licenses screen', () => {
      const { getByTestId } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('licenses-screen')).toBeTruthy();
    });

    it('should display license list', () => {
      const { getByTestId } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('license-list')).toBeTruthy();
    });
  });

  describe('License Items', () => {
    it('should display package name', () => {
      const { getByText } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/react-native/i)).toBeTruthy();
    });

    it('should display license type', () => {
      const { getByText } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/MIT/i)).toBeTruthy();
    });
  });

  describe('License Detail', () => {
    it('should expand license detail', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('license-1'));

      const detail = await findByTestId('license-detail-1');
      expect(detail).toBeTruthy();
    });

    it('should show full license text', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('license-1'));

      const text = await findByText(/permission is hereby granted/i);
      expect(text).toBeTruthy();
    });
  });

  describe('Search', () => {
    it('should search licenses', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('search-input'), 'expo');

      const results = await findByTestId('search-results');
      expect(results).toBeTruthy();
    });
  });

  describe('Group by License', () => {
    it('should group by license type', async () => {
      const { getByTestId } = renderWithProviders(
        <LicensesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('group-by-license'));
    });
  });
});
