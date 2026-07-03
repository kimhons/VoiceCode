// VoiceCode Mobile - Billing History Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import BillingHistoryScreen from '../../screens/settings/BillingHistoryScreen';

describe('BillingHistoryScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render billing history screen', () => {
      const { getByTestId } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('billing-history-screen')).toBeTruthy();
    });

    it('should display invoice list', () => {
      const { getByTestId } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('invoice-list')).toBeTruthy();
    });
  });

  describe('Invoice Items', () => {
    it('should display invoice date', () => {
      const { getByText } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/january/i)).toBeTruthy();
    });

    it('should display invoice amount', () => {
      const { getByText } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/\$/)).toBeTruthy();
    });

    it('should display payment status', () => {
      const { getByText } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/paid/i)).toBeTruthy();
    });
  });

  describe('Invoice Actions', () => {
    it('should view invoice details', async () => {
      const { getByTestId } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('invoice-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('InvoiceDetail', expect.any(Object));
    });

    it('should download invoice', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('download-invoice-1'));

      const message = await findByText(/downloading/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Filtering', () => {
    it('should filter by year', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('year-filter'));
      fireEvent.press(getByText('2024'));
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no invoices', () => {
      const { getByText } = renderWithProviders(
        <BillingHistoryScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/no invoices/i)).toBeTruthy();
    });
  });
});
