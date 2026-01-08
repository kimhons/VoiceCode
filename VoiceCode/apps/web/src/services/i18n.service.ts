/**
 * Internationalization (i18n) Service
 * Phase 5.3: Multi-Language UI
 *
 * Comprehensive i18n support with 12 languages
 */

import { getSupabaseService } from './supabase.service';

// Supported languages
export type Language = 
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'ru' // Russian
  | 'zh' // Chinese (Simplified)
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ar' // Arabic (RTL)
  | 'he'; // Hebrew (RTL)

// Language metadata
export interface LanguageMetadata {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

// Translation keys (type-safe)
export type TranslationKey = keyof typeof BASE_EN_TRANSLATIONS;

// User language preferences
export interface UserLanguagePreferences {
  userId: string;
  language: Language;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: 'comma' | 'period' | 'space';
  currency: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Language metadata
export const LANGUAGES: Record<Language, LanguageMetadata> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', flag: '🇺🇸' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', flag: '🇪🇸' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', flag: '🇫🇷' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', flag: '🇩🇪' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', flag: '🇮🇹' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', flag: '🇵🇹' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', flag: '🇷🇺' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', flag: '🇨🇳' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', flag: '🇯🇵' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', flag: '🇰🇷' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', flag: '🇸🇦' },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', flag: '🇮🇱' },
};

// Translations
const BASE_EN_TRANSLATIONS = {
    // Common
    'common.app_name': 'VoiceFlow Pro',
    'common.welcome': 'Welcome',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.settings': 'Settings',
    'common.help': 'Help',
    'common.logout': 'Logout',
    'common.login': 'Login',
    'common.signup': 'Sign Up',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.finish': 'Finish',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.confirm': 'Confirm',
    
    // Navigation
    'nav.home': 'Home',
    'nav.transcripts': 'Transcripts',
    'nav.recordings': 'Recordings',
    'nav.analytics': 'Analytics',
    'nav.collaboration': 'Collaboration',
    'nav.settings': 'Settings',
    
    // Transcription
    'transcription.start': 'Start Recording',
    'transcription.stop': 'Stop Recording',
    'transcription.pause': 'Pause',
    'transcription.resume': 'Resume',
    'transcription.recording': 'Recording...',
    'transcription.processing': 'Processing...',
    'transcription.complete': 'Transcription Complete',
    'transcription.error': 'Transcription Error',
    'transcription.language': 'Language',
    'transcription.mode': 'Mode',
    'transcription.quality': 'Quality',
    
    // Editor
    'editor.title': 'Transcript Editor',
    'editor.save': 'Save Changes',
    'editor.export': 'Export',
    'editor.share': 'Share',
    'editor.comment': 'Add Comment',
    'editor.highlight': 'Highlight',
    'editor.search': 'Search in transcript',
    'editor.replace': 'Replace',
    'editor.undo': 'Undo',
    'editor.redo': 'Redo',
    
    // Export
    'export.format': 'Export Format',
    'export.pdf': 'PDF Document',
    'export.docx': 'Word Document',
    'export.txt': 'Plain Text',
    'export.srt': 'SRT Subtitles',
    'export.vtt': 'WebVTT Subtitles',
    'export.json': 'JSON Data',
    
    // AI Features
    'ai.summarize': 'Summarize',
    'ai.key_points': 'Extract Key Points',
    'ai.action_items': 'Find Action Items',
    'ai.sentiment': 'Analyze Sentiment',
    'ai.topics': 'Detect Topics',
    'ai.search': 'Smart Search',
    'ai.processing': 'AI Processing...',
    'ai.complete': 'AI Analysis Complete',
    
    // Collaboration
    'collab.workspace': 'Workspace',
    'collab.members': 'Members',
    'collab.invite': 'Invite Member',
    'collab.share': 'Share Transcript',
    'collab.comment': 'Comment',
    'collab.annotation': 'Annotation',
    'collab.activity': 'Activity',
    
    // Settings
    'settings.general': 'General',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.account': 'Account',
    'settings.billing': 'Billing',
    
    // Notifications
    'notif.new_transcript': 'New transcript available',
    'notif.processing_complete': 'Processing complete',
    'notif.comment_added': 'New comment added',
    'notif.member_invited': 'You were invited to a workspace',
    'notif.export_ready': 'Export is ready',
    
    // Errors
    'error.network': 'Network error. Please check your connection.',
    'error.auth': 'Authentication error. Please login again.',
    'error.permission': 'You do not have permission to perform this action.',
    'error.not_found': 'Resource not found.',
    'error.server': 'Server error. Please try again later.',
    'error.validation': 'Validation error. Please check your input.',
    
    // Success messages
    'success.saved': 'Successfully saved',
    'success.deleted': 'Successfully deleted',
    'success.exported': 'Successfully exported',
    'success.shared': 'Successfully shared',
    'success.invited': 'Invitation sent',
  } as const;

export const translations = {
  en: BASE_EN_TRANSLATIONS,
  
  es: {
    // Common
    'common.app_name': 'VoiceFlow Pro',
    'common.welcome': 'Bienvenido',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.close': 'Cerrar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.settings': 'Configuración',
    'common.help': 'Ayuda',
    'common.logout': 'Cerrar sesión',
    'common.login': 'Iniciar sesión',
    'common.signup': 'Registrarse',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.finish': 'Finalizar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.confirm': 'Confirmar',
    'nav.home': 'Inicio',
    'nav.transcripts': 'Transcripciones',
    'nav.recordings': 'Grabaciones',
    'nav.analytics': 'Analíticas',
    'nav.collaboration': 'Colaboración',
    'nav.settings': 'Configuración',
    'transcription.start': 'Iniciar grabación',
    'transcription.stop': 'Detener grabación',
    'transcription.pause': 'Pausar',
    'transcription.resume': 'Reanudar',
    'transcription.recording': 'Grabando...',
    'transcription.processing': 'Procesando...',
    'transcription.complete': 'Transcripción completa',
    'transcription.error': 'Error de transcripción',
    'transcription.language': 'Idioma',
    'transcription.mode': 'Modo',
    'transcription.quality': 'Calidad',
    'editor.title': 'Editor de transcripción',
    'editor.save': 'Guardar cambios',
    'editor.export': 'Exportar',
    'editor.share': 'Compartir',
    'editor.comment': 'Añadir comentario',
    'editor.highlight': 'Resaltar',
    'editor.search': 'Buscar en transcripción',
    'editor.replace': 'Reemplazar',
    'editor.undo': 'Deshacer',
    'editor.redo': 'Rehacer',
    'export.format': 'Formato de exportación',
    'export.pdf': 'Documento PDF',
    'export.docx': 'Documento Word',
    'export.txt': 'Texto plano',
    'export.srt': 'Subtítulos SRT',
    'export.vtt': 'Subtítulos WebVTT',
    'export.json': 'Datos JSON',
    'ai.summarize': 'Resumir',
    'ai.key_points': 'Extraer puntos clave',
    'ai.action_items': 'Encontrar elementos de acción',
    'ai.sentiment': 'Analizar sentimiento',
    'ai.topics': 'Detectar temas',
    'ai.search': 'Búsqueda inteligente',
    'ai.processing': 'Procesando IA...',
    'ai.complete': 'Análisis de IA completo',
    'collab.workspace': 'Espacio de trabajo',
    'collab.members': 'Miembros',
    'collab.invite': 'Invitar miembro',
    'collab.share': 'Compartir transcripción',
    'collab.comment': 'Comentario',
    'collab.annotation': 'Anotación',
    'collab.activity': 'Actividad',
    'settings.general': 'General',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.notifications': 'Notificaciones',
    'settings.privacy': 'Privacidad',
    'settings.account': 'Cuenta',
    'settings.billing': 'Facturación',
    'notif.new_transcript': 'Nueva transcripción disponible',
    'notif.processing_complete': 'Procesamiento completo',
    'notif.comment_added': 'Nuevo comentario añadido',
    'notif.member_invited': 'Fuiste invitado a un espacio de trabajo',
    'notif.export_ready': 'Exportación lista',
    'error.network': 'Error de red. Por favor verifica tu conexión.',
    'error.auth': 'Error de autenticación. Por favor inicia sesión nuevamente.',
    'error.permission': 'No tienes permiso para realizar esta acción.',
    'error.not_found': 'Recurso no encontrado.',
    'error.server': 'Error del servidor. Por favor intenta más tarde.',
    'error.validation': 'Error de validación. Por favor verifica tu entrada.',
    'success.saved': 'Guardado exitosamente',
    'success.deleted': 'Eliminado exitosamente',
    'success.exported': 'Exportado exitosamente',
    'success.shared': 'Compartido exitosamente',
    'success.invited': 'Invitación enviada',
  },

  // French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Hebrew
  // (Using English as fallback - these would be professionally translated in production)
  fr: { ...BASE_EN_TRANSLATIONS },
  de: { ...BASE_EN_TRANSLATIONS },
  it: { ...BASE_EN_TRANSLATIONS },
  pt: { ...BASE_EN_TRANSLATIONS },
  ru: { ...BASE_EN_TRANSLATIONS },
  zh: { ...BASE_EN_TRANSLATIONS },
  ja: { ...BASE_EN_TRANSLATIONS },
  ko: { ...BASE_EN_TRANSLATIONS },
  ar: { ...BASE_EN_TRANSLATIONS },
  he: { ...BASE_EN_TRANSLATIONS },
};

// I18n Service
class I18nService {
  private currentLanguage: Language = 'en';
  private listeners: Set<(language: Language) => void> = new Set();

  constructor() {
    this.loadLanguageFromStorage();
  }

  // Get current language
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  // Set language
  async setLanguage(language: Language): Promise<void> {
    this.currentLanguage = language;

    // Save to localStorage
    localStorage.setItem('voiceflow_language', language);

    // Update HTML dir attribute for RTL
    const direction = LANGUAGES[language].direction;
    document.documentElement.dir = direction;
    document.documentElement.lang = language;

    // Save to Supabase
    try {
      const supabaseService = getSupabaseService();
      const user = await supabaseService.getCurrentUser();
      if (user) {
        await this.saveUserPreferences({ language });
      }
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }

    // Notify listeners
    this.notifyListeners();
  }

  // Translate
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const lang = this.currentLanguage;
    let translation = (translations[lang] as any)?.[key] || (translations.en as any)[key] || key;
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }
    
    return translation;
  }

  // Get all available languages
  getAvailableLanguages(): LanguageMetadata[] {
    return Object.values(LANGUAGES);
  }

  // Get language metadata
  getLanguageMetadata(language: Language): LanguageMetadata {
    return LANGUAGES[language];
  }

  // Check if language is RTL
  isRTL(language?: Language): boolean {
    const lang = language || this.currentLanguage;
    return LANGUAGES[lang].direction === 'rtl';
  }

  // Subscribe to language changes
  subscribe(listener: (language: Language) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Load language from storage
  private loadLanguageFromStorage(): void {
    const stored = localStorage.getItem('voiceflow_language') as Language;
    if (stored && LANGUAGES[stored]) {
      this.currentLanguage = stored;
      const direction = LANGUAGES[stored].direction;
      document.documentElement.dir = direction;
      document.documentElement.lang = stored;
    }
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }

  // User preferences
  async getUserPreferences(): Promise<UserLanguagePreferences | null> {
    try {
      const supabaseService = getSupabaseService();
      const user = await supabaseService.getCurrentUser();
      if (!user) return null;

      const client = supabaseService.getClient();
      if (!client) return null;

      const { data, error } = await client
        .from('user_language_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as UserLanguagePreferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  async saveUserPreferences(preferences: Partial<UserLanguagePreferences>): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const user = await supabaseService.getCurrentUser();
      if (!user) return;

      const client = supabaseService.getClient();
      if (!client) return;

      const { error } = await client
        .from('user_language_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }
}

// Singleton instance
let i18nServiceInstance: I18nService | null = null;

export function getI18nService(): I18nService {
  if (!i18nServiceInstance) {
    i18nServiceInstance = new I18nService();
  }
  return i18nServiceInstance;
}

export default I18nService;

