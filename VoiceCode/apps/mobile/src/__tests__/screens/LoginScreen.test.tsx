// VoiceCode Mobile - Login Screen Tests

import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, createMockNavigation } from '../setup/testUtils';
import { LoginScreen } from '../../screens/auth/LoginScreen';

describe('LoginScreen', () => {
  const mockNavigation = createMockNavigation();

  it('should render login form', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={{} as any} />
    );

    expect(getByPlaceholderText(/email/i)).toBeTruthy();
    expect(getByPlaceholderText(/password/i)).toBeTruthy();
    expect(getByText(/sign in/i)).toBeTruthy();
  });

  it('should validate email format', async () => {
    const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={{} as any} />
    );

    const emailInput = getByPlaceholderText(/email/i);
    const submitButton = getByText(/sign in/i);

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(submitButton);

    const errorMessage = await findByText(/valid email/i);
    expect(errorMessage).toBeTruthy();
  });

  it('should validate password length', async () => {
    const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={{} as any} />
    );

    const passwordInput = getByPlaceholderText(/password/i);
    const submitButton = getByText(/sign in/i);

    fireEvent.changeText(passwordInput, '123');
    fireEvent.press(submitButton);

    const errorMessage = await findByText(/at least 6 characters/i);
    expect(errorMessage).toBeTruthy();
  });

  it('should submit valid credentials', async () => {
    // The screen authenticates by dispatching loginSuccess to the Redux store
    // (after a simulated network delay), not by navigating. Assert on that real
    // behavior rather than a navigation call the screen never makes.
    const { getByPlaceholderText, getByText, store } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={{} as any} />
    );

    const emailInput = getByPlaceholderText(/email/i);
    const passwordInput = getByPlaceholderText(/password/i);
    const submitButton = getByText(/sign in/i);

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(submitButton);

    await waitFor(
      () => {
        expect(store.getState().auth.isAuthenticated).toBe(true);
      },
      { timeout: 3000 }
    );
  });

  it('should navigate to signup screen', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={{} as any} />
    );

    const signupLink = getByText(/sign up/i);
    fireEvent.press(signupLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
  });

  it('should navigate to forgot password screen', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={{} as any} />
    );

    const forgotLink = getByText(/forgot password/i);
    fireEvent.press(forgotLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('should show loading state during login', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} route={{} as any} />
    );

    const emailInput = getByPlaceholderText(/email/i);
    const passwordInput = getByPlaceholderText(/password/i);
    const submitButton = getByText(/sign in/i);

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(submitButton);

    const loadingIndicator = getByTestId('loading-indicator');
    expect(loadingIndicator).toBeTruthy();
  });
});
