// Export all VoiceFlow Pro UI components

export { VoiceRecording } from './VoiceRecording';
export { TranscriptionDisplay } from './TranscriptionDisplay';
export { LanguageSelector } from './LanguageSelector';
export { AudioVisualization } from './AudioVisualization';
export { SettingsPanel } from './SettingsPanel';

// Export enhanced components
export {
  LoadingState,
  InlineLoading,
  LoadingSkeleton,
  AudioVisualizationLoading,
  LoadingOverlay
} from './LoadingState';
export { ErrorBoundary, SimpleErrorBoundary, useErrorHandler } from './ErrorBoundary';
export {
  LazyComponent,
  createLazyComponent,
  LazyVoiceRecording,
  LazyTranscriptionDisplay,
  LazyLanguageSelector,
  LazyAudioVisualization,
  LazySettingsPanel
} from './LazyComponent';
export { useComponentPreloader, preloadAllComponents, useRouteBasedPreloading } from './componentPreloadUtils';

// Export professional mode components
export { default as ProfessionalModeSelector } from './ProfessionalModeSelector';
export { default as TemplateSelector } from './TemplateSelector';
export { default as SmartNoteEditor } from './SmartNoteEditor';

// Export marketing components
export { default as ProductScreenshots } from './ProductScreenshots';
export { default as SavingsCalculator } from './SavingsCalculator';
export { default as LiveUserCounter } from './LiveUserCounter';
export { default as MobileStickyCTA } from './MobileStickyCTA';
export { default as MobileMenu } from './MobileMenu';
export { default as TrustBadges } from './TrustBadges';
