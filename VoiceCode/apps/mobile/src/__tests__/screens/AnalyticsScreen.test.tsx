// VoiceCode Mobile - Analytics Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import AnalyticsScreen from '../../screens/profile/AnalyticsScreen';

// AnalyticsScreen loads its data from the analytics service on mount and shows a
// loading spinner until it resolves. Mock the service with deterministic metrics
// so the real screen renders its content (metric cards, charts) under test.
jest.mock('../../services/analyticsService', () => {
  const dashboardMetrics = {
    today: { transcripts: 3, minutes: 12, exports: 1, cost: 0.5 },
    thisWeek: { transcripts: 18, minutes: 240, exports: 5, cost: 8.5 },
    thisMonth: { transcripts: 62, minutes: 900, exports: 20, cost: 30 },
    total: { transcripts: 210, minutes: 5200, words: 84000, cost: 120 },
  };
  const usageStats = [
    { date: '2026-06-01', transcripts_count: 4, audio_uploads_count: 2, exports_count: 1, ai_features_count: 3, total_minutes: 45, total_words: 900 },
    { date: '2026-06-02', transcripts_count: 6, audio_uploads_count: 1, exports_count: 2, ai_features_count: 4, total_minutes: 70, total_words: 1400 },
    { date: '2026-06-03', transcripts_count: 8, audio_uploads_count: 3, exports_count: 2, ai_features_count: 5, total_minutes: 125, total_words: 2100 },
  ];
  const performanceMetrics = [
    { date: '2026-06-01', avg_accuracy: 0.96, avg_latency: 120, error_count: 1, success_count: 40 },
    { date: '2026-06-02', avg_accuracy: 0.97, avg_latency: 110, error_count: 0, success_count: 55 },
    { date: '2026-06-03', avg_accuracy: 0.98, avg_latency: 105, error_count: 1, success_count: 61 },
  ];

  const service = {
    getDashboardMetrics: jest.fn(async () => dashboardMetrics),
    getUsageStats: jest.fn(async () => usageStats),
    getPerformanceMetrics: jest.fn(async () => performanceMetrics),
    generateReport: jest.fn(async () => ({ summary: {} })),
    exportReport: jest.fn(async () => ({})),
  };

  return {
    __esModule: true,
    getAnalyticsService: () => service,
  };
});

// The screen fires haptic feedback on filter/export interactions.
jest.mock('expo-haptics');

describe('AnalyticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render analytics screen', async () => {
      const { findByTestId } = renderWithProviders(<AnalyticsScreen />);

      expect(await findByTestId('analytics-screen')).toBeTruthy();
    });

    it('should display usage summary', async () => {
      const { findByText } = renderWithProviders(<AnalyticsScreen />);

      expect(await findByText(/usage/i)).toBeTruthy();
    });
  });

  describe('Time Period Selection', () => {
    it('should switch to weekly view', async () => {
      const { findByText } = renderWithProviders(<AnalyticsScreen />);

      // Exact label avoids matching the pie chart's "This week's activity" subtitle.
      fireEvent.press(await findByText('Weekly'));
    });

    it('should switch to monthly view', async () => {
      const { findByText } = renderWithProviders(<AnalyticsScreen />);

      fireEvent.press(await findByText('Monthly'));
    });

    // The screen's time periods are Daily / Weekly / Monthly / Custom — there is no
    // "yearly" period. Aligned to the real 'Daily' period to test period switching.
    it('should switch to daily view', async () => {
      const { findByText } = renderWithProviders(<AnalyticsScreen />);

      fireEvent.press(await findByText('Daily'));
    });
  });

  describe('Statistics Display', () => {
    it('should display total transcripts', async () => {
      const { findByTestId } = renderWithProviders(<AnalyticsScreen />);

      expect(await findByTestId('total-transcripts')).toBeTruthy();
    });

    it('should display total minutes', async () => {
      const { findByTestId } = renderWithProviders(<AnalyticsScreen />);

      expect(await findByTestId('total-minutes')).toBeTruthy();
    });

    it('should display average confidence', async () => {
      const { findByTestId } = renderWithProviders(<AnalyticsScreen />);

      expect(await findByTestId('average-confidence')).toBeTruthy();
    });
  });

  describe('Charts', () => {
    it('should display usage chart', async () => {
      const { findByTestId } = renderWithProviders(<AnalyticsScreen />);

      expect(await findByTestId('usage-chart')).toBeTruthy();
    });

    it('should display category breakdown', async () => {
      const { findByTestId } = renderWithProviders(<AnalyticsScreen />);

      expect(await findByTestId('category-chart')).toBeTruthy();
    });
  });

  describe('Export', () => {
    it('should export analytics report', async () => {
      const { findByTestId } = renderWithProviders(<AnalyticsScreen />);

      fireEvent.press(await findByTestId('export-report'));
      // Opens the export panel (handleShowExport).
    });
  });
});
