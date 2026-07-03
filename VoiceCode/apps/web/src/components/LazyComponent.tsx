import React, { Suspense, lazy } from 'react';
import { LoadingState } from './LoadingState';
import { ErrorBoundary, SimpleErrorBoundary } from './ErrorBoundary';

type ErrorFallbackComponent = React.ComponentType<{
  error: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
  showDetails?: boolean;
}>;

export interface LazyComponentProps {
  fallback?: React.ReactNode;
  errorFallback?: ErrorFallbackComponent | null;
  enableErrorBoundary?: boolean;
  enableSuspense?: boolean;
  className?: string;
  // Accept all props for the underlying component
  [key: string]: any;
}

const DefaultLoadingFallback: React.FC<{ message?: string; type?: string }> = ({
  message = 'Loading component...',
  type = 'general',
}) => (
  <div className="flex items-center justify-center p-8">
    <LoadingState type={type} message={message} size="medium" variant="primary" />
  </div>
);

export const LazyComponent: React.FC<
  LazyComponentProps & { component: React.LazyExoticComponent<React.ComponentType<any>> }
> = ({
  component: Component,
  fallback,
  errorFallback,
  enableErrorBoundary = true,
  enableSuspense = true,
  className,
  ...restProps
}) => {
  const renderInner = () => <Component {...restProps} className={className} />;

  const content = (() => {
    if (!enableErrorBoundary) {
      return renderInner();
    }

    if (errorFallback) {
      return <ErrorBoundary fallback={errorFallback}>{renderInner()}</ErrorBoundary>;
    }

    return (
      <SimpleErrorBoundary message="Component failed to load" className={className}>
        {renderInner()}
      </SimpleErrorBoundary>
    );
  })();

  if (!enableSuspense) {
    return <>{content}</>;
  }

  return <Suspense fallback={fallback || <DefaultLoadingFallback />}>{content}</Suspense>;
};

export type PreloadableLazyComponent<P = Record<string, unknown>> = React.FC<
  LazyComponentProps & P
> & { preload: () => void };

export const createLazyComponent = <P extends Record<string, unknown> = Record<string, unknown>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: ErrorFallbackComponent | null;
    preload?: boolean;
  } = {}
): PreloadableLazyComponent<P> => {
  const LazyLoadedComponent = lazy(importFn);

  const preload = () => {
    importFn().catch(() => {
      console.warn('Failed to preload component');
    });
  };

  if (options.preload) {
    preload();
  }

  const WrappedLazyComponent: React.FC<LazyComponentProps & P> = ({
    fallback,
    errorFallback,
    enableErrorBoundary = true,
    enableSuspense = true,
    ...rest
  }) => (
    <LazyComponent
      component={LazyLoadedComponent}
      fallback={fallback ?? options.fallback}
      errorFallback={errorFallback ?? options.errorFallback ?? null}
      enableErrorBoundary={enableErrorBoundary}
      enableSuspense={enableSuspense}
      {...rest}
    />
  );

  const ComponentWithPreload = WrappedLazyComponent as PreloadableLazyComponent<P>;
  ComponentWithPreload.preload = preload;

  return ComponentWithPreload;
};

export const LazyVoiceRecording = createLazyComponent(
  () => import('@/components/VoiceRecording').then((mod) => ({ default: mod.VoiceRecording })),
  {
    fallback: <DefaultLoadingFallback message="Loading voice recording..." type="recording" />,
  }
);

export const LazyTranscriptionDisplay = createLazyComponent(
  () => import('@/components/TranscriptionDisplay').then((mod) => ({ default: mod.TranscriptionDisplay })),
  {
    fallback: <DefaultLoadingFallback message="Loading transcription..." type="general" />,
  }
);

export const LazyLanguageSelector = createLazyComponent(
  () => import('@/components/LanguageSelector').then((mod) => ({ default: mod.LanguageSelector })),
  {
    fallback: <DefaultLoadingFallback message="Loading language options..." type="language-detection" />,
  }
);

export const LazyAudioVisualization = createLazyComponent(
  () => import('@/components/AudioVisualization').then((mod) => ({ default: mod.AudioVisualization })),
  {
    fallback: <DefaultLoadingFallback message="Loading audio visualization..." type="audio-enhancement" />,
  }
);

export const LazySettingsPanel = createLazyComponent(
  () => import('@/components/SettingsPanel').then((mod) => ({ default: mod.SettingsPanel })),
  {
    fallback: <DefaultLoadingFallback message="Loading settings..." type="general" />,
  }
);
