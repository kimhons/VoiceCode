// Lazy Component Wrapper for Code Splitting and Performance Optimization
import React, { Suspense, lazy } from 'react';
import { LoadingState, SimpleErrorBoundary } from '@/components';

// Props for lazy component wrapper
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  enableErrorBoundary?: boolean;
  enableSuspense?: boolean;
  preload?: boolean;
  className?: string;
}

// Default loading fallback
const DefaultLoadingFallback: React.FC<{ message?: string; type?: any }> = ({ 
  message = 'Loading component...', 
  type = 'general' 
}) => (
  <div className="flex items-center justify-center p-8">
    <LoadingState
      type={type}
      message={message}
      size="medium"
      variant="primary"
    />
  </div>
);

// Default error fallback
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="p-4 border border-red-200 bg-red-50 rounded-md">
    <h3 className="text-red-800 font-medium">Component failed to load</h3>
    <p className="text-red-600 text-sm mt-1">{error.message}</p>
    <button
      onClick={resetError}
      className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
    >
      Try Again
    </button>
  </div>
);

// Main lazy component wrapper
export const LazyComponent: React.FC<LazyComponentProps & { 
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}> = ({
  component: LazyComponent,
  children,
  fallback,
  errorFallback: ErrorFallback = DefaultErrorFallback,
  enableErrorBoundary = true,
  enableSuspense = true,
  className
}) => {
  const WrappedComponent = enableErrorBoundary 
    ? (props: any) => (
        <SimpleErrorBoundary
          fallback={ErrorFallback}
          className={className}
        >
          <LazyComponent {...props} />
        </SimpleErrorBoundary>
      )
    : LazyComponent;

  if (!enableSuspense) {
    return <WrappedComponent>{children}</WrappedComponent>;
  }

  return (
    <Suspense 
      fallback={
        fallback || <DefaultLoadingFallback />
      }
    >
      <WrappedComponent>{children}</WrappedComponent>
    </Suspense>
  );
};

// Higher-order function for creating lazy components
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    preload?: boolean;
  } = {}
) => {
  const LazyComponent = lazy(importFn);

  const ComponentWithFallback: React.FC<any> = (props) => (
    <LazyComponent
      {...props}
    />
  );

  // Preload function for better UX
  const preload = () => {
    importFn().catch(() => {
      // Preload failed, but don't throw to avoid console errors
      console.warn('Failed to preload component');
    });
  };

  // Component wrapper with error boundary and loading states
  const WrappedLazyComponent: React.FC<LazyComponentProps & { [key: string]: any }> = ({
    children,
    fallback,
    errorFallback = options.errorFallback,
    enableErrorBoundary = true,
    enableSuspense = true,
    className,
    ...componentProps
  }) => (
    <LazyComponent
      component={LazyComponent}
      children={children}
      fallback={fallback || options.fallback}
      errorFallback={errorFallback}
      enableErrorBoundary={enableErrorBoundary}
      enableSuspense={enableSuspense}
      className={className}
      {...componentProps}
    />
  );

  // Attach preload method
  WrappedLazyComponent.preload = preload;

  return WrappedLazyComponent;
};

// Specific lazy components for VoiceFlow Pro
export const LazyVoiceRecording = createLazyComponent(
  () => import('@/components/VoiceRecording'),
  {
    fallback: <DefaultLoadingFallback message="Loading voice recording..." type="recording" />
  }
);

export const LazyTranscriptionDisplay = createLazyComponent(
  () => import('@/components/TranscriptionDisplay'),
  {
    fallback: <DefaultLoadingFallback message="Loading transcription..." type="general" />
  }
);

export const LazyLanguageSelector = createLazyComponent(
  () => import('@/components/LanguageSelector'),
  {
    fallback: <DefaultLoadingFallback message="Loading language options..." type="language-detection" />
  }
);

export const LazyAudioVisualization = createLazyComponent(
  () => import('@/components/AudioVisualization'),
  {
    fallback: <DefaultLoadingFallback message="Loading audio visualization..." type="audio-enhancement" />
  }
);

export const LazySettingsPanel = createLazyComponent(
  () => import('@/components/SettingsPanel'),
  {
    fallback: <DefaultLoadingFallback message="Loading settings..." type="general" />
  }
);

// Preload all components for better initial load performance
export const preloadAllComponents = () => {
  const preloadPromises = [
    LazyVoiceRecording.preload?.(),
    LazyTranscriptionDisplay.preload?.(),
    LazyLanguageSelector.preload?.(),
    LazyAudioVisualization.preload?.(),
    LazySettingsPanel.preload?.(),
  ].filter(Boolean);

  return Promise.all(preloadPromises);
};

// Component preloader hook
export const useComponentPreloader = () => {
  const [isPreloading, setIsPreloading] = React.useState(false);
  const [preloadProgress, setPreloadProgress] = React.useState(0);

  const preloadComponents = async (components?: string[]) => {
    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      // If specific components are requested, preload only those
      if (components && components.length > 0) {
        const preloadFns = components.map(componentName => {
          switch (componentName) {
            case 'voice-recording':
              return LazyVoiceRecording.preload;
            case 'transcription-display':
              return LazyTranscriptionDisplay.preload;
            case 'language-selector':
              return LazyLanguageSelector.preload;
            case 'audio-visualization':
              return LazyAudioVisualization.preload;
            case 'settings-panel':
              return LazySettingsPanel.preload;
            default:
              return null;
          }
        }).filter(Boolean);

        let completed = 0;
        for (const preloadFn of preloadFns) {
          await preloadFn();
          completed++;
          setPreloadProgress((completed / preloadFns.length) * 100);
        }
      } else {
        // Preload all components
        await preloadAllComponents();
        setPreloadProgress(100);
      }
    } catch (error) {
      console.warn('Some components failed to preload:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  return {
    preloadComponents,
    isPreloading,
    preloadProgress
  };
};

// Route-based code splitting helper
export const useRouteBasedPreloading = () => {
  const [currentRoute, setCurrentRoute] = React.useState('');
  
  React.useEffect(() => {
    // Preload components based on current route
    const preloadByRoute = () => {
      const path = window.location.pathname;
      setCurrentRoute(path);

      // Define which components to preload for each route
      const routeComponentMap: Record<string, string[]> = {
        '/': ['voice-recording', 'transcription-display'],
        '/recording': ['voice-recording', 'audio-visualization'],
        '/transcription': ['transcription-display', 'language-selector'],
        '/settings': ['settings-panel'],
      };

      const componentsToPreload = routeComponentMap[path] || [];
      if (componentsToPreload.length > 0) {
        // Use a small delay to avoid blocking initial render
        setTimeout(() => {
          preloadComponents(componentsToPreload);
        }, 100);
      }
    };

    preloadByRoute();
  }, []);

  return { currentRoute };
};