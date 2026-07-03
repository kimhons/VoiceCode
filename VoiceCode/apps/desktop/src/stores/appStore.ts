import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface VoiceRecognitionSettings {
  continuous: boolean;
  interim_results: boolean;
  max_alternatives: number;
  confidence_threshold: number;
  noise_reduction: boolean;
  privacy_mode: boolean;
}

export interface TextProcessingSettings {
  context: string;
  tone: string;
  aggressiveness: number;
  remove_fillers: boolean;
  enable_caching: boolean;
  smart_punctuation: boolean;
  auto_correct: boolean;
}

export interface Settings {
  language: string;
  voice_model: string;
  hotkey: string;
  auto_start: boolean;
  theme: ThemeMode;
  notifications: boolean;
  voice_commands_enabled: boolean;
  voice_recognition: VoiceRecognitionSettings;
  text_processing: TextProcessingSettings;
}

export interface ProcessingResult {
  id: string;
  original_text: string;
  processed_text: string;
  confidence_score: number;
  processing_time_ms: number;
  changes_made: Array<{
    change_type: string;
    original: string;
    replacement: string;
    confidence: number;
  }>;
}

export interface Language {
  code: string;
  name: string;
  native_name: string;
  flag: string;
}

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  description: string;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string;
  response: string;
  confidence: number;
  error: string | null;
}

interface UIState {
  showSettings: boolean;
  showPricing: boolean;
  showAIPanel: boolean;
  showGlobalDictationSettings: boolean;
  showFloatingButton: boolean;
  floatingButtonPosition:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left';
}

interface GlobalDictationState {
  isActive: boolean;
  text: string;
}

interface AppState {
  settings: Settings | null;
  appInfo: AppInfo | null;
  supportedLanguages: Language[];
  processingResult: ProcessingResult | null;
  voice: VoiceState;
  ui: UIState;
  globalDictation: GlobalDictationState;

  // Settings actions
  setSettings: (settings: Settings) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  setAppInfo: (appInfo: AppInfo) => void;
  setSupportedLanguages: (languages: Language[]) => void;

  // Voice actions
  setIsListening: (isListening: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setTranscript: (transcript: string) => void;
  appendTranscript: (text: string) => void;
  setInterimTranscript: (transcript: string) => void;
  setResponse: (response: string) => void;
  setConfidence: (confidence: number) => void;
  setError: (error: string | null) => void;
  clearTranscript: () => void;

  // Processing actions
  setProcessingResult: (result: ProcessingResult | null) => void;

  // UI actions
  toggleSettings: () => void;
  togglePricing: () => void;
  toggleAIPanel: () => void;
  toggleGlobalDictationSettings: () => void;
  setShowFloatingButton: (show: boolean) => void;
  setFloatingButtonPosition: (
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  ) => void;

  // Global dictation actions
  setGlobalDictationActive: (isActive: boolean) => void;
  setGlobalDictationText: (text: string) => void;

  // Theme actions
  setTheme: (theme: ThemeMode) => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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

      // Settings actions
      setSettings: (settings) => set({ settings }),
      updateSettings: (partial) =>
        set((state) => ({
          settings: state.settings ? { ...state.settings, ...partial } : null,
        })),
      setAppInfo: (appInfo) => set({ appInfo }),
      setSupportedLanguages: (languages) =>
        set({ supportedLanguages: languages }),

      // Voice actions
      setIsListening: (isListening) =>
        set((state) => ({ voice: { ...state.voice, isListening } })),
      setIsProcessing: (isProcessing) =>
        set((state) => ({ voice: { ...state.voice, isProcessing } })),
      setTranscript: (transcript) =>
        set((state) => ({ voice: { ...state.voice, transcript } })),
      appendTranscript: (text) =>
        set((state) => ({
          voice: {
            ...state.voice,
            transcript:
              state.voice.transcript +
              (state.voice.transcript ? ' ' : '') +
              text,
          },
        })),
      setInterimTranscript: (interimTranscript) =>
        set((state) => ({ voice: { ...state.voice, interimTranscript } })),
      setResponse: (response) =>
        set((state) => ({ voice: { ...state.voice, response } })),
      setConfidence: (confidence) =>
        set((state) => ({ voice: { ...state.voice, confidence } })),
      setError: (error) =>
        set((state) => ({ voice: { ...state.voice, error } })),
      clearTranscript: () =>
        set((state) => ({
          voice: {
            ...state.voice,
            transcript: '',
            interimTranscript: '',
            response: '',
          },
        })),

      // Processing actions
      setProcessingResult: (result) => set({ processingResult: result }),

      // UI actions
      toggleSettings: () =>
        set((state) => ({
          ui: { ...state.ui, showSettings: !state.ui.showSettings },
        })),
      togglePricing: () =>
        set((state) => ({
          ui: { ...state.ui, showPricing: !state.ui.showPricing },
        })),
      toggleAIPanel: () =>
        set((state) => ({
          ui: { ...state.ui, showAIPanel: !state.ui.showAIPanel },
        })),
      toggleGlobalDictationSettings: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            showGlobalDictationSettings: !state.ui.showGlobalDictationSettings,
          },
        })),
      setShowFloatingButton: (show) =>
        set((state) => ({ ui: { ...state.ui, showFloatingButton: show } })),
      setFloatingButtonPosition: (position) =>
        set((state) => ({
          ui: { ...state.ui, floatingButtonPosition: position },
        })),

      // Global dictation actions
      setGlobalDictationActive: (isActive) =>
        set((state) => ({
          globalDictation: { ...state.globalDictation, isActive },
        })),
      setGlobalDictationText: (text) =>
        set((state) => ({
          globalDictation: { ...state.globalDictation, text },
        })),

      // Theme actions
      setTheme: (theme) =>
        set((state) => ({
          settings: state.settings ? { ...state.settings, theme } : null,
        })),
      getEffectiveTheme: () => {
        const { settings } = get();
        if (!settings || settings.theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }
        return settings.theme;
      },
    }),
    {
      name: 'voicecode-app-storage',
      partialize: (state) => ({
        settings: state.settings,
        ui: {
          showFloatingButton: state.ui.showFloatingButton,
          floatingButtonPosition: state.ui.floatingButtonPosition,
        },
      }),
    }
  )
);

export default useAppStore;
