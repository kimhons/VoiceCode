import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('AppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      settings: null,
      appInfo: null,
      supportedLanguages: [],
      processingResult: null,
      voice: {
        isListening: false,
        isProcessing: false,
        transcript: '',
        interimTranscript: '',
        response: '',
        confidence: 0,
        error: null,
      },
      ui: {
        showSettings: false,
        showPricing: false,
        showAIPanel: false,
        showGlobalDictationSettings: false,
        showFloatingButton: true,
        floatingButtonPosition: 'bottom-right',
      },
      globalDictation: {
        isActive: false,
        text: '',
      },
    });
  });

  describe('Voice State', () => {
    it('should set isListening', () => {
      const store = useAppStore.getState();
      store.setIsListening(true);
      expect(useAppStore.getState().voice.isListening).toBe(true);
    });

    it('should set transcript', () => {
      const store = useAppStore.getState();
      store.setTranscript('Hello world');
      expect(useAppStore.getState().voice.transcript).toBe('Hello world');
    });

    it('should append transcript', () => {
      const store = useAppStore.getState();
      store.setTranscript('Hello');
      store.appendTranscript('world');
      expect(useAppStore.getState().voice.transcript).toBe('Hello world');
    });

    it('should clear transcript', () => {
      const store = useAppStore.getState();
      store.setTranscript('Hello world');
      store.setResponse('Processed text');
      store.clearTranscript();
      expect(useAppStore.getState().voice.transcript).toBe('');
      expect(useAppStore.getState().voice.response).toBe('');
    });

    it('should set error', () => {
      const store = useAppStore.getState();
      store.setError('Test error');
      expect(useAppStore.getState().voice.error).toBe('Test error');
    });
  });

  describe('UI State', () => {
    it('should toggle settings panel', () => {
      const store = useAppStore.getState();
      expect(useAppStore.getState().ui.showSettings).toBe(false);
      store.toggleSettings();
      expect(useAppStore.getState().ui.showSettings).toBe(true);
      store.toggleSettings();
      expect(useAppStore.getState().ui.showSettings).toBe(false);
    });

    it('should toggle AI panel', () => {
      const store = useAppStore.getState();
      expect(useAppStore.getState().ui.showAIPanel).toBe(false);
      store.toggleAIPanel();
      expect(useAppStore.getState().ui.showAIPanel).toBe(true);
    });

    it('should set floating button position', () => {
      const store = useAppStore.getState();
      store.setFloatingButtonPosition('top-left');
      expect(useAppStore.getState().ui.floatingButtonPosition).toBe('top-left');
    });
  });

  describe('Settings', () => {
    it('should set settings', () => {
      const store = useAppStore.getState();
      const testSettings = {
        language: 'en-US',
        voice_model: 'whisper-base',
        hotkey: 'CmdOrCtrl+Space',
        auto_start: false,
        theme: 'light' as const,
        notifications: true,
        voice_commands_enabled: true,
        voice_recognition: {
          continuous: true,
          interim_results: true,
          max_alternatives: 3,
          confidence_threshold: 0.7,
          noise_reduction: true,
          privacy_mode: false,
        },
        text_processing: {
          context: 'email',
          tone: 'professional',
          aggressiveness: 0.7,
          remove_fillers: true,
          enable_caching: true,
          smart_punctuation: true,
          auto_correct: true,
        },
      };
      store.setSettings(testSettings);
      expect(useAppStore.getState().settings).toEqual(testSettings);
    });

    it('should update partial settings', () => {
      const store = useAppStore.getState();
      store.setSettings({
        language: 'en-US',
        voice_model: 'whisper-base',
        hotkey: 'CmdOrCtrl+Space',
        auto_start: false,
        theme: 'light',
        notifications: true,
        voice_commands_enabled: true,
        voice_recognition: {
          continuous: true,
          interim_results: true,
          max_alternatives: 3,
          confidence_threshold: 0.7,
          noise_reduction: true,
          privacy_mode: false,
        },
        text_processing: {
          context: 'email',
          tone: 'professional',
          aggressiveness: 0.7,
          remove_fillers: true,
          enable_caching: true,
          smart_punctuation: true,
          auto_correct: true,
        },
      });
      store.updateSettings({ language: 'es-ES' });
      expect(useAppStore.getState().settings?.language).toBe('es-ES');
    });
  });

  describe('Global Dictation', () => {
    it('should set global dictation active', () => {
      const store = useAppStore.getState();
      store.setGlobalDictationActive(true);
      expect(useAppStore.getState().globalDictation.isActive).toBe(true);
    });

    it('should set global dictation text', () => {
      const store = useAppStore.getState();
      store.setGlobalDictationText('Test dictation');
      expect(useAppStore.getState().globalDictation.text).toBe(
        'Test dictation'
      );
    });
  });
});
