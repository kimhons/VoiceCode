import React from 'react';
import {
  LazyVoiceRecording,
  LazyTranscriptionDisplay,
  LazyLanguageSelector,
  LazyAudioVisualization,
  LazySettingsPanel,
} from './LazyComponent';

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

export const useRouteBasedPreloading = () => {
  const [currentRoute, setCurrentRoute] = React.useState('');
  const { preloadComponents } = useComponentPreloader();

  React.useEffect(() => {
    // Preload components based on current route
    const preloadByRoute = () => {
      const path = globalThis.location.pathname;
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
  }, [preloadComponents]);

  return { currentRoute };
};
