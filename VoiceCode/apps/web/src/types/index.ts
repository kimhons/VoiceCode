// Core Types for VoiceFlow Pro UI Components

export type PlatformType = 'mac' | 'windows' | 'linux';
export type ThemeType = 'light' | 'dark' | 'auto';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  confidence: number;
  language: string;
  error?: string;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  confidence: number;
  startTime: number;
  endTime: number;
  speaker?: string;
  isFinal: boolean;
  language?: string;
}

export interface AudioVisualizationData {
  timestamp?: number;
  amplitude?: number;
  frequency?: number[];
  waveform?: number[];
  frequencyData?: number[];
  volume?: number;
  pitch?: number;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  supported: boolean;
}

export interface SettingsConfig {
  theme: ThemeType;
  language: string;
  hotkey: string;
  autoStart: boolean;
  soundEnabled: boolean;
  privacy: {
    saveTranscriptions: boolean;
    shareAnalytics: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    voiceFeedback: boolean;
    keyboardNavigation: boolean;
  };
  transcription: {
    autoPunctuation: boolean;
    smartFormatting: boolean;
    detectLanguage: boolean;
    confidenceThreshold: number;
  };
}

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
  'data-testid'?: string;
}

export interface ComponentSize {
  small: Record<string, string>;
  medium: Record<string, string>;
  large: Record<string, string>;
}

export interface ComponentVariants {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  outline: Record<string, string>;
  ghost: Record<string, string>;
  destructive: Record<string, string>;
}

export interface PlatformConfig {
  platform: PlatformType;
  isElectron: boolean;
  isWeb: boolean;
  hasNativeTitleBar: boolean;
  supportsTray: boolean;
  supportsShortcuts: boolean;
}

export interface VoiceCommand {
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
  description: string;
}

export interface UserPreferences {
  id: string;
  settings: SettingsConfig;
  customCommands: VoiceCommand[];
  recentLanguages: string[];
  favoriteTemplates: string[];
  professionalMode?: ProfessionalMode;
}

// Professional Mode Types
export type ProfessionalMode =
  | 'general'
  | 'medical'
  | 'developer'
  | 'legal'
  | 'business'
  | 'education'
  | 'journalism'
  | 'creative';

export interface ProfessionalModeConfig {
  mode: ProfessionalMode;
  displayName: string;
  icon: string;
  description: string;
  features: string[];
  templates: NoteTemplate[];
  // Updated to use VoiceCommandDefinition which is what data layer returns
  voiceCommands: VoiceCommandDefinition[];
  formatting: FormattingRules;
  aiContext: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  mode: ProfessionalMode;
  structure: TemplateSection[];
  formatting: FormattingRules;
  aiPrompt?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
  order: number;
  // Added 'numbered' to align with data usage
  type: 'text' | 'list' | 'structured' | 'freeform' | 'numbered';
  aiGuidance?: string;
}

export interface FormattingRules {
  style: 'formal' | 'professional' | 'casual' | 'technical';
  structure: 'paragraphs' | 'bullets' | 'numbered' | 'sections' | 'mixed';
  terminology: 'standard' | 'medical' | 'legal' | 'technical' | 'business';
  autoFormat: boolean;
  includeTimestamps: boolean;
  includeSpeakerLabels: boolean;
}

// Medical Mode Specific Types
export interface MedicalNoteData {
  patientId?: string;
  visitDate: string;
  chiefComplaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  followUp?: string;
  medications?: string[];
  allergies?: string[];
  vitals?: Record<string, string>;
}

// Developer Mode Specific Types
export interface DeveloperNoteData {
  projectName?: string;
  taskType: 'bug' | 'feature' | 'refactor' | 'documentation' | 'review';
  codeSnippets?: CodeSnippet[];
  technicalDetails?: string;
  dependencies?: string[];
  testingNotes?: string;
  deploymentNotes?: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
  lineNumbers?: boolean;
}

// Voice Command System
export interface VoiceCommandSystem {
  enabled: boolean;
  commands: VoiceCommandDefinition[];
  customCommands: VoiceCommandDefinition[];
  hotword?: string;
}

export interface VoiceCommandDefinition {
  id: string;
  trigger: string[];
  action: VoiceCommandAction;
  parameters?: Record<string, any>;
  description: string;
  mode?: ProfessionalMode;
  requiresConfirmation?: boolean;
}

export type VoiceCommandAction =
  | 'start_recording'
  | 'stop_recording'
  | 'pause_recording'
  | 'save_note'
  | 'new_note'
  | 'switch_mode'
  | 'apply_template'
  | 'format_note'
  | 'insert_section'
  | 'delete_section'
  | 'undo'
  | 'redo'
  | 'export_note'
  | 'search'
  | 'help';

// AI Assistant Integration
export interface AIAssistantConfig {
  enabled: boolean;
  model: string;
  realTimeProcessing: boolean;
  autoSuggestions: boolean;
  contextAwareness: boolean;
  professionalMode: ProfessionalMode;
}

export interface AIProcessingResult {
  originalText: string;
  processedText: string;
  suggestions: AISuggestion[];
  confidence: number;
  processingTime: number;
  changes: AIChange[];
}

export interface AISuggestion {
  id: string;
  type: 'grammar' | 'style' | 'structure' | 'terminology' | 'formatting';
  original: string;
  suggested: string;
  reason: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface AIChange {
  type: string;
  description: string;
  position?: { start: number; end: number };
}