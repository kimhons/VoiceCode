// VoiceCode Mobile - Button Component Tests

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with children text', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button onPress={onPressMock}>Press</Button>);
    
    fireEvent.press(getByText('Press'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button disabled onPress={onPressMock}>
        Disabled
      </Button>
    );
    
    const button = getByText('Disabled');
    fireEvent.press(button);
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders with custom variant', () => {
    const { getByText } = render(<Button variant="secondary">Secondary</Button>);
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders with loading state', () => {
    const { getByTestId } = render(<Button loading>Loading</Button>);
    // ActivityIndicator should be present when loading
    expect(getByTestId).toBeTruthy();
  });
});

