// VoiceCode Mobile - Onboarding Screen Tests

import React from 'react';
import { Dimensions } from 'react-native';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { StackScreenProps } from '@react-navigation/stack';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { OnboardingScreen } from '../../screens/onboarding/OnboardingScreen';
import type { RootStackParamList } from '../../navigation/types';

type OnboardingNavigation = StackScreenProps<RootStackParamList, 'Onboarding'>['navigation'];

// The real screen prefers the `navigation` prop that React Navigation injects for
// screens registered via `component={OnboardingScreen}`. We supply a minimal spy and
// cast through `unknown` so navigation calls are directly assertable.
function createNavigation() {
  const navigate = jest.fn();
  const navigation = { navigate } as unknown as OnboardingNavigation;
  return { navigate, navigation };
}

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render first onboarding slide', () => {
      const { navigation } = createNavigation();
      const { getByText } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      expect(getByText('Record Anywhere')).toBeTruthy();
    });

    it('should display pagination dots', () => {
      const { navigation } = createNavigation();
      const { getAllByTestId } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      const dots = getAllByTestId(/pagination-dot/);
      expect(dots.length).toBeGreaterThan(1);
    });

    it('should show skip button', () => {
      const { navigation } = createNavigation();
      const { getByText } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      expect(getByText(/skip/i)).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should advance the active slide on horizontal scroll', () => {
      const { navigation } = createNavigation();
      const { getByTestId } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      expect(getByTestId('pagination-dot-0').props.accessibilityState.selected).toBe(true);

      const { width } = Dimensions.get('window');
      const slider = getByTestId('onboarding-slider');
      fireEvent.scroll(slider, {
        nativeEvent: {
          contentOffset: { x: width, y: 0 },
          contentSize: { width: width * 4, height: 100 },
          layoutMeasurement: { width, height: 100 },
        },
      });

      expect(getByTestId('pagination-dot-1').props.accessibilityState.selected).toBe(true);
    });

    it('should advance the active slide on next button press', () => {
      const { navigation } = createNavigation();
      const { getByTestId } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      expect(getByTestId('pagination-dot-1').props.accessibilityState.selected).toBe(false);

      fireEvent.press(getByTestId('next-button'));

      expect(getByTestId('pagination-dot-1').props.accessibilityState.selected).toBe(true);
    });

    it('should reach the final slide via repeated next presses', () => {
      const { navigation } = createNavigation();
      const { getByTestId, queryByTestId, queryByText } = renderWithProviders(
        <OnboardingScreen navigation={navigation} />
      );

      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('next-button'));

      // On the last slide the CTA becomes "Get Started" and Skip disappears.
      expect(getByTestId('get-started-button')).toBeTruthy();
      expect(queryByTestId('next-button')).toBeNull();
      expect(queryByText(/skip/i)).toBeNull();
    });
  });

  describe('Completion', () => {
    // The real onboarding delegates completion to the Permissions screen (via
    // OnboardingContext, key '@voicecode_onboarding_complete'). The screen itself
    // routes forward to 'Permissions'; it never writes AsyncStorage('onboarding_complete')
    // nor replaces to 'Auth', so those assertions are aligned to the real navigation contract.
    it('should route to Permissions when Skip is pressed', () => {
      const { navigate, navigation } = createNavigation();
      const { getByTestId } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('skip-button'));

      expect(navigate).toHaveBeenCalledWith('Permissions');
    });

    it('should route to Permissions when Get Started is pressed', () => {
      const { navigate, navigation } = createNavigation();
      const { getByTestId } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('next-button'));
      fireEvent.press(getByTestId('get-started-button'));

      expect(navigate).toHaveBeenCalledWith('Permissions');
    });
  });

  describe('Slides Content', () => {
    // All four slides mount in the horizontal carousel, so each slide's title and
    // image are asserted directly against the real slide definitions.
    it('should display slide 1 content - Record Anywhere', () => {
      const { navigation } = createNavigation();
      const { getByText, getByTestId } = renderWithProviders(
        <OnboardingScreen navigation={navigation} />
      );

      expect(getByText('Record Anywhere')).toBeTruthy();
      expect(getByTestId('slide-1-image')).toBeTruthy();
    });

    it('should display slide 2 content - Instant Transcription', () => {
      const { navigation } = createNavigation();
      const { getByText, getByTestId } = renderWithProviders(
        <OnboardingScreen navigation={navigation} />
      );

      expect(getByText('Instant Transcription')).toBeTruthy();
      expect(getByTestId('slide-2-image')).toBeTruthy();
    });

    it('should display slide 3 content - AI-Powered Enhancement', () => {
      const { navigation } = createNavigation();
      const { getByText, getByTestId } = renderWithProviders(
        <OnboardingScreen navigation={navigation} />
      );

      expect(getByText('AI-Powered Enhancement')).toBeTruthy();
      expect(getByTestId('slide-3-image')).toBeTruthy();
    });

    it('should display slide 4 content - Sync Everywhere', () => {
      const { navigation } = createNavigation();
      const { getByText, getByTestId } = renderWithProviders(
        <OnboardingScreen navigation={navigation} />
      );

      expect(getByText('Sync Everywhere')).toBeTruthy();
      expect(getByTestId('slide-4-image')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      const { navigation } = createNavigation();
      const { getByLabelText } = renderWithProviders(<OnboardingScreen navigation={navigation} />);

      expect(getByLabelText(/next slide/i)).toBeTruthy();
      expect(getByLabelText(/skip onboarding/i)).toBeTruthy();
    });
  });
});
