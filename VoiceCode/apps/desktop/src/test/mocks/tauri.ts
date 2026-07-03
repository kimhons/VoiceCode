import { vi } from 'vitest';

export const mockSettings = {
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
};

export const mockAppInfo = {
  name: 'VoiceCode',
  version: '1.0.0',
  platform: 'windows',
  description: 'Professional Dictation & Voice Recognition',
};

export const mockLanguages = [
  { code: 'en-US', name: 'English (US)', native_name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Spanish', native_name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', native_name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', native_name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh-CN', name: 'Chinese', native_name: '中文', flag: '🇨🇳' },
];

export const mockProcessingResult = {
  id: 'test-id',
  original_text: 'hello world',
  processed_text: 'Hello, World.',
  confidence_score: 0.95,
  processing_time_ms: 150,
  changes_made: [
    {
      change_type: 'capitalization',
      original: 'hello',
      replacement: 'Hello',
      confidence: 0.99,
    },
  ],
};

export const createTauriMock = () => ({
  invoke: vi.fn().mockImplementation((cmd: string) => {
    switch (cmd) {
      case 'get_settings':
        return Promise.resolve(mockSettings);
      case 'get_app_info':
        return Promise.resolve(mockAppInfo);
      case 'get_supported_languages_tauri':
        return Promise.resolve(mockLanguages);
      case 'initialize_text_processor':
        return Promise.resolve();
      case 'process_speech_with_ai':
        return Promise.resolve(mockProcessingResult);
      case 'start_global_dictation':
        return Promise.resolve();
      case 'stop_global_dictation':
        return Promise.resolve('');
      default:
        return Promise.resolve();
    }
  }),
});
