# VoiceFlow Pro Mobile - Testing Guide

## Overview

This document describes the testing infrastructure and best practices for the VoiceFlow Pro Mobile app.

## Testing Stack

- **Jest**: Test runner and assertion library
- **jest-expo**: Expo-specific Jest preset
- **@testing-library/react-native**: React Native testing utilities
- **@testing-library/jest-native**: Additional matchers for React Native
- **react-test-renderer**: React component rendering for tests

## Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run tests in CI mode
yarn test:ci

# Run full validation (type-check + lint + test)
yarn validate
```

## Coverage Thresholds

The project maintains the following minimum coverage thresholds:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Writing Tests

### Component Tests

Place component tests in `__tests__` directories next to the components:

```
src/components/common/
├── Button.tsx
└── __tests__/
    └── Button.test.tsx
```

Example component test:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button onPress={onPressMock}>Press</Button>);
    
    fireEvent.press(getByText('Press'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
```

### Screen Tests

Test screens for rendering and user interactions:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Home')).toBeTruthy();
  });
});
```

### Service Tests

Test services and utilities:

```typescript
import { AudioRecorder } from '../AudioRecorder';

describe('AudioRecorder', () => {
  it('initializes correctly', () => {
    const recorder = new AudioRecorder();
    expect(recorder).toBeDefined();
  });
});
```

## Mocking

### Mocked Modules

The following modules are mocked in `jest.setup.js`:

- `@react-native-async-storage/async-storage`
- `expo-av`
- `expo-file-system`
- `@react-navigation/native`

### Custom Mocks

Add custom mocks in `__mocks__` directories:

```
src/services/
├── AudioRecorder.ts
└── __mocks__/
    └── AudioRecorder.ts
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
4. **Mock External Dependencies**: Mock API calls, file system, and other external dependencies
5. **Test Edge Cases**: Include tests for error states, empty states, and boundary conditions
6. **Keep Tests Fast**: Avoid unnecessary delays and timeouts
7. **Maintain High Coverage**: Aim for >80% coverage on all metrics

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

CI configuration uses `yarn test:ci` which:
- Runs in CI mode (no watch)
- Generates coverage reports
- Limits workers for stability
- Fails on coverage threshold violations

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Check `moduleNameMapper` in `jest.config.js` and ensure path aliases are correct

**Issue**: Expo modules not mocked
**Solution**: Add mocks to `jest.setup.js`

**Issue**: Coverage below threshold
**Solution**: Add tests for uncovered code or adjust thresholds in `jest.config.js`

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)

