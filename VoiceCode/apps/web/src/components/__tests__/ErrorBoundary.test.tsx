import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, SimpleErrorBoundary } from '../ErrorBoundary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Component that always throws on render. */
const ThrowingChild: React.FC<{ message?: string }> = ({ message = 'Test error' }) => {
  throw new Error(message);
};

/** Component that renders normally. */
const GoodChild: React.FC = () => <div data-testid="good-child">All good</div>;

/**
 * Component that can be toggled to throw.
 * We use this to test resetError: after reset the boundary re-renders children,
 * and on the second render the component no longer throws.
 */
let shouldThrow = false;
const ConditionalThrower: React.FC = () => {
  if (shouldThrow) {
    throw new Error('Conditional error');
  }
  return <div data-testid="recovered">Recovered</div>;
};

// ---------------------------------------------------------------------------
// Suite: ErrorBoundary
// ---------------------------------------------------------------------------
describe('ErrorBoundary', () => {
  // Silence React's console.error for caught errors during these tests
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    shouldThrow = false;
  });

  // --- Happy path ---
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('good-child')).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('does not render fallback UI when children are healthy', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
  });

  // --- Error catching ---
  it('catches errors and renders default fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild message="Kaboom" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Kaboom')).toBeInTheDocument();
  });

  it('displays "Try Again" and "Go Home" buttons in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  // --- onError callback ---
  it('calls onError callback with error and errorInfo', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild message="callback test" />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [error, errorInfo] = onError.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('callback test');
    expect(errorInfo).toBeDefined();
    expect(typeof errorInfo.componentStack).toBe('string');
  });

  // --- Custom fallback ---
  it('renders a custom fallback component when provided', () => {
    const CustomFallback: React.FC<{ error: Error; resetError: () => void }> = ({
      error,
      resetError,
    }) => (
      <div data-testid="custom-fallback">
        <span>Custom: {error.message}</span>
        <button onClick={resetError}>Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowingChild message="custom fallback test" />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom: custom fallback test')).toBeInTheDocument();
    // Default fallback elements should NOT appear
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
  });

  // --- resetError ---
  it('resets error state when "Try Again" is clicked', () => {
    // First render: throws. After reset, ConditionalThrower will not throw.
    shouldThrow = true;
    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    // Verify error state
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    // Stop throwing before clicking reset
    shouldThrow = false;

    // Click "Try Again"
    fireEvent.click(screen.getByText('Try Again'));

    // After reset, ConditionalThrower should render normally
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
    expect(screen.getByText('Recovered')).toBeInTheDocument();
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
  });

  // --- Non-Error thrown ---
  it('handles non-Error thrown values by wrapping them', () => {
    const StringThrower: React.FC = () => {
      throw 'a string error'; // eslint-disable-line no-throw-literal
    };

    render(
      <ErrorBoundary>
        <StringThrower />
      </ErrorBoundary>
    );

    // getDerivedStateFromError wraps non-Error values with String()
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('a string error')).toBeInTheDocument();
  });

  // --- "Go Home" button ---
  it('"Go Home" navigates to /', () => {
    // Mock window.location
    const originalLocation = window.location;
    const mockLocation = { ...originalLocation, href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Go Home'));
    expect(mockLocation.href).toBe('/');

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  // --- Multiple children ---
  it('catches error from one of multiple children', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
        <ThrowingChild message="multi-child error" />
      </ErrorBoundary>
    );

    // The entire boundary should be in error state
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('multi-child error')).toBeInTheDocument();
    // Good child should NOT be visible since the whole boundary caught the error
    expect(screen.queryByTestId('good-child')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Suite: SimpleErrorBoundary
// ---------------------------------------------------------------------------
describe('SimpleErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    shouldThrow = false;
  });

  it('renders children normally when no error occurs', () => {
    render(
      <SimpleErrorBoundary>
        <GoodChild />
      </SimpleErrorBoundary>
    );
    expect(screen.getByTestId('good-child')).toBeInTheDocument();
  });

  it('renders default error message on error', () => {
    render(
      <SimpleErrorBoundary>
        <ThrowingChild />
      </SimpleErrorBoundary>
    );
    expect(screen.getByText("This component couldn't be loaded")).toBeInTheDocument();
  });

  it('renders custom error message when provided', () => {
    render(
      <SimpleErrorBoundary message="Widget failed to load">
        <ThrowingChild />
      </SimpleErrorBoundary>
    );
    expect(screen.getByText('Widget failed to load')).toBeInTheDocument();
  });

  it('has a retry button with aria-label', () => {
    render(
      <SimpleErrorBoundary>
        <ThrowingChild />
      </SimpleErrorBoundary>
    );
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();
  });

  it('recovers after clicking retry when error condition is resolved', () => {
    shouldThrow = true;
    render(
      <SimpleErrorBoundary>
        <ConditionalThrower />
      </SimpleErrorBoundary>
    );

    expect(screen.getByText("This component couldn't be loaded")).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByTestId('recovered')).toBeInTheDocument();
    expect(screen.queryByText("This component couldn't be loaded")).not.toBeInTheDocument();
  });

  it('applies custom className to the error container', () => {
    const { container } = render(
      <SimpleErrorBoundary className="my-custom-class">
        <ThrowingChild />
      </SimpleErrorBoundary>
    );
    // The outermost div of the SimpleErrorBoundary fallback should contain the className
    const errorDiv = container.querySelector('.my-custom-class');
    expect(errorDiv).toBeInTheDocument();
  });
});
