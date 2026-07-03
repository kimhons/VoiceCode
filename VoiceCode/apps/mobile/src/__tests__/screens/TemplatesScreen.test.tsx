// VoiceCode Mobile - Templates Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import TemplatesScreen from '../../screens/library/TemplatesScreen';

describe('TemplatesScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render templates screen', () => {
      const { getByTestId } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('templates-screen')).toBeTruthy();
    });

    it('should display template list', () => {
      const { getByTestId } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('template-list')).toBeTruthy();
    });
  });

  describe('Template Items', () => {
    it('should display template name', () => {
      const { getByText } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/meeting/i)).toBeTruthy();
    });

    it('should display template description', () => {
      const { getByTestId } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('template-description-1')).toBeTruthy();
    });
  });

  describe('Create Template', () => {
    it('should open create template modal', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('create-template'));

      const modal = await findByTestId('create-template-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Edit Template', () => {
    it('should edit template', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('edit-template-1'));

      const modal = await findByTestId('edit-template-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Delete Template', () => {
    it('should delete template', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('delete-template-1'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(queryByTestId('template-1')).toBeNull();
      });
    });
  });

  describe('Set Default', () => {
    it('should set default template', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('set-default-1'));

      const message = await findByText(/default/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Categories', () => {
    it('should filter by category', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <TemplatesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('category-filter'));
      fireEvent.press(getByText(/business/i));
    });
  });
});
