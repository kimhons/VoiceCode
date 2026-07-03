// VoiceCode Mobile - Button Component Tests

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '../Button';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Button consumes useTheme(), which requires a ThemeProvider ancestor
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('Button Component', () => {
  // ThemeProvider renders children only after its async preference load resolves,
  // so queries must await the mounted element (findBy*).
  it('renders correctly with children text', async () => {
    const { findByText } = render(<Button>Click Me</Button>, { wrapper });
    expect(await findByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPressMock = jest.fn();
    const { findByText } = render(<Button onPress={onPressMock}>Press</Button>, { wrapper });

    fireEvent.press(await findByText('Press'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', async () => {
    const onPressMock = jest.fn();
    const { findByText } = render(
      <Button disabled onPress={onPressMock}>
        Disabled
      </Button>,
      { wrapper }
    );

    const button = await findByText('Disabled');
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders with custom variant', async () => {
    const { findByText } = render(<Button variant="secondary">Secondary</Button>, { wrapper });
    expect(await findByText('Secondary')).toBeTruthy();
  });

  it('renders with loading state', async () => {
    const { toJSON } = render(<Button loading>Loading</Button>, { wrapper });
    // Wait for the provider to mount its children, then assert the button rendered.
    await waitFor(() => expect(toJSON()).toBeTruthy());
  });
});

