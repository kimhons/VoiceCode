import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
  showDetails?: boolean;
}

const serializeError = (error: any): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || 'No stack trace available'}`;
  }
  return JSON.stringify(error, null, 2);
};

const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { 
  hasError: boolean; 
  error: Error | null; 
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: any): Partial<{ hasError: boolean; error: Error; errorId: string }> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error: error instanceof Error ? error : new Error(String(error)),
      errorId 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for monitoring (in production, this would send to logging service)
    if (process.env.NODE_ENV === 'production') {
      console.group(`🚨 Error Boundary Caught Error [${this.state.errorId}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleRetry = () => {
    this.resetError();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const ErrorComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <ErrorComponent
          error={this.state.error!}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo || undefined}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorInfo, 
  showDetails = process.env.NODE_ENV === 'development' 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </button>
        </div>

        {/* Error Details (Development or when explicitly enabled) */}
        {showDetails && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Bug className="h-4 w-4 mr-1" />
              {showDetails ? 'Hide' : 'Show'} Error Details
            </button>
            
            {showDetails && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-48">
                  {serializeError(error)}
                </pre>
                {errorInfo && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Component Stack:</p>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for error boundaries in function components
export const useErrorHandler = () => {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Manual error caught:', error, errorInfo);
    
    // In production, you might want to send this to an error reporting service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorInfo
      });
    }
  }, []);
};

// Simple error boundary for specific components
export const SimpleErrorBoundary: React.FC<{
  children: React.ReactNode;
  message?: string;
  className?: string;
}> = ({ children, message = "This component couldn't be loaded", className }) => (
  <ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className={`p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-md ${className || ''}`}>
        <div className="flex items-center justify-between">
          <p className="text-red-800 dark:text-red-200 text-sm">{message}</p>
          <button
            onClick={resetError}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
              Error Details
            </summary>
            <pre className="mt-1 text-xs text-red-700 dark:text-red-300 overflow-auto">
              {serializeError(error)}
            </pre>
          </details>
        )}
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);