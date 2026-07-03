// VoiceCode Mobile - Subscription Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import SubscriptionScreen from '../../screens/profile/SubscriptionScreen';

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render subscription screen', () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByTestId('subscription-screen')).toBeTruthy();
    });

    it('should display available plans', () => {
      const { getByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByText(/free/i)).toBeTruthy();
      expect(getByText(/pro/i)).toBeTruthy();
      expect(getByText(/enterprise/i)).toBeTruthy();
    });

    it('should highlight current plan', () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByTestId('current-plan-indicator')).toBeTruthy();
    });
  });

  describe('Plan Details', () => {
    it('should display plan features', () => {
      const { getByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByText(/unlimited transcriptions/i)).toBeTruthy();
    });

    it('should display plan pricing', () => {
      const { getByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByText(/\$9.99/)).toBeTruthy();
    });

    it('should show monthly and yearly options', () => {
      const { getByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByText(/monthly/i)).toBeTruthy();
      expect(getByText(/yearly/i)).toBeTruthy();
    });
  });

  describe('Upgrade Flow', () => {
    it('should select plan', async () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionScreen />
      );

      fireEvent.press(getByTestId('select-pro'));
    });

    it('should show payment sheet', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <SubscriptionScreen />
      );

      fireEvent.press(getByTestId('select-pro'));
      fireEvent.press(getByTestId('subscribe-button'));

      const paymentSheet = await findByTestId('payment-sheet');
      expect(paymentSheet).toBeTruthy();
    });

    it('should handle successful subscription', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      fireEvent.press(getByTestId('select-pro'));
      fireEvent.press(getByTestId('subscribe-button'));
      fireEvent.press(getByTestId('confirm-payment'));

      const success = await findByText(/subscription activated/i);
      expect(success).toBeTruthy();
    });
  });

  describe('Cancellation', () => {
    it('should show cancel option for active subscription', () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByTestId('cancel-subscription')).toBeTruthy();
    });

    it('should confirm cancellation', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      fireEvent.press(getByTestId('cancel-subscription'));

      const confirmation = await findByText(/are you sure/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Restore Purchases', () => {
    it('should restore purchases', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      fireEvent.press(getByTestId('restore-purchases'));

      await waitFor(() => {
        expect(findByText(/restored/i)).toBeTruthy();
      });
    });
  });

  describe('Usage', () => {
    it('should display current usage', () => {
      const { getByTestId } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByTestId('usage-summary')).toBeTruthy();
    });

    it('should show usage limits', () => {
      const { getByText } = renderWithProviders(
        <SubscriptionScreen />
      );

      expect(getByText(/minutes used/i)).toBeTruthy();
    });
  });
});
