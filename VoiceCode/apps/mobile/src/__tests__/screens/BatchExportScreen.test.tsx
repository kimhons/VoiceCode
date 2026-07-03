// VoiceCode Mobile - Batch Export Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders, createMockNavigation } from '../setup/testUtils';
import { BatchExportScreen } from '../../screens/export/BatchExportScreen';

type ScreenProps = React.ComponentProps<typeof BatchExportScreen>;

const navigation = createMockNavigation() as unknown as ScreenProps['navigation'];
const route = {
  key: 'BatchExport',
  name: 'BatchExport',
  params: { transcriptIds: ['1', '2', '3'] },
} as unknown as ScreenProps['route'];

describe('BatchExportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render batch export screen', () => {
      const { getByTestId } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      expect(getByTestId('batch-export-screen')).toBeTruthy();
    });

    it('should display selected count', () => {
      const { getByText } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      expect(getByText(/3 transcripts/i)).toBeTruthy();
    });
  });

  describe('Format Selection', () => {
    it('should select export format', async () => {
      const { getByTestId } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      fireEvent.press(getByTestId('format-pdf'));
    });

    it('should select combined or individual', async () => {
      const { getByTestId } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      fireEvent.press(getByTestId('individual-files'));
    });
  });

  describe('Export Progress', () => {
    it('should show progress during export', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      fireEvent.press(getByTestId('start-export'));

      const progress = await findByTestId('export-progress');
      expect(progress).toBeTruthy();
    });

    it('should show completion message', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      fireEvent.press(getByTestId('start-export'));

      const message = await findByText(/complete/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Cancel', () => {
    it('should cancel export', async () => {
      const { getByTestId } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      fireEvent.press(getByTestId('start-export'));
      fireEvent.press(getByTestId('cancel-export'));
    });
  });

  describe('Download', () => {
    it('should download exported zip', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <BatchExportScreen navigation={navigation} route={route} />
      );

      fireEvent.press(getByTestId('download-button'));

      const message = await findByText(/downloaded/i);
      expect(message).toBeTruthy();
    });
  });
});
