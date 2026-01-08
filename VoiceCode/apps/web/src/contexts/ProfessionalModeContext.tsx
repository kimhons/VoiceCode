// Professional Mode Context for VoiceFlow Pro
// Manages profession-specific UI modes, templates, and workflows

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ProfessionalMode,
  ProfessionalModeConfig,
  NoteTemplate,
  VoiceCommandDefinition,
  AIAssistantConfig,
} from '@/types';
import { getTemplatesForMode } from '@/data/professionalTemplates';
import { getCommandsForMode } from '@/data/voiceCommands';

interface ProfessionalModeContextType {
  currentMode: ProfessionalMode;
  modeConfig: ProfessionalModeConfig;
  availableModes: ProfessionalModeConfig[];
  templates: NoteTemplate[];
  activeTemplate: NoteTemplate | null;
  voiceCommands: VoiceCommandDefinition[];
  aiConfig: AIAssistantConfig;
  
  // Actions
  switchMode: (mode: ProfessionalMode) => void;
  selectTemplate: (templateId: string) => void;
  createCustomTemplate: (template: Omit<NoteTemplate, 'id'>) => void;
  updateAIConfig: (config: Partial<AIAssistantConfig>) => void;
  executeVoiceCommand: (command: string) => Promise<boolean>;
  formatNote: (text: string) => Promise<string>;
}

const ProfessionalModeContext = createContext<ProfessionalModeContextType | undefined>(undefined);

export const useProfessionalMode = () => {
  const context = useContext(ProfessionalModeContext);
  if (!context) {
    throw new Error('useProfessionalMode must be used within a ProfessionalModeProvider');
  }
  return context;
};

// Helper function to get built-in templates for a mode
function getBuiltInTemplates(mode: ProfessionalMode): NoteTemplate[] {
  return getTemplatesForMode(mode);
}

// Helper function to get voice commands for a mode
function getVoiceCommandsForMode(mode: ProfessionalMode): VoiceCommandDefinition[] {
  return getCommandsForMode(mode);
}

// Professional Mode Configurations
const professionalModes: ProfessionalModeConfig[] = [
  {
    mode: 'general',
    displayName: 'General',
    icon: '📝',
    description: 'General purpose note-taking and transcription',
    features: ['Basic transcription', 'Simple formatting', 'Quick notes'],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'casual',
      structure: 'paragraphs',
      terminology: 'standard',
      autoFormat: true,
      includeTimestamps: false,
      includeSpeakerLabels: false,
    },
    aiContext: 'general conversation and note-taking',
  },
  {
    mode: 'medical',
    displayName: 'Medical Practitioner',
    icon: '⚕️',
    description: 'Medical consultation notes with SOAP format and medical terminology',
    features: [
      'SOAP note format',
      'Medical terminology recognition',
      'Patient information management',
      'HIPAA-compliant formatting',
      'Vital signs tracking',
      'Medication and allergy tracking',
      'ICD-10 code suggestions',
    ],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'professional',
      structure: 'sections',
      terminology: 'medical',
      autoFormat: true,
      includeTimestamps: true,
      includeSpeakerLabels: true,
    },
    aiContext: 'medical consultation with focus on clinical accuracy, medical terminology, and SOAP note structure',
  },
  {
    mode: 'developer',
    displayName: 'Software Developer',
    icon: '💻',
    description: 'Code dictation, technical documentation, and development notes',
    features: [
      'Code snippet dictation',
      'Technical terminology',
      'Bug report formatting',
      'Feature documentation',
      'Code review notes',
      'API documentation',
      'Git commit messages',
    ],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'technical',
      structure: 'mixed',
      terminology: 'technical',
      autoFormat: true,
      includeTimestamps: false,
      includeSpeakerLabels: false,
    },
    aiContext: 'software development with focus on code accuracy, technical terminology, and structured documentation',
  },
  {
    mode: 'legal',
    displayName: 'Legal Professional',
    icon: '⚖️',
    description: 'Legal documentation, case notes, and client consultations',
    features: [
      'Legal terminology',
      'Case note formatting',
      'Client consultation notes',
      'Contract drafting',
      'Citation formatting',
    ],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'formal',
      structure: 'sections',
      terminology: 'legal',
      autoFormat: true,
      includeTimestamps: true,
      includeSpeakerLabels: true,
    },
    aiContext: 'legal documentation with focus on formal language, legal terminology, and precise formatting',
  },
  {
    mode: 'business',
    displayName: 'Business Professional',
    icon: '💼',
    description: 'Meeting notes, business correspondence, and reports',
    features: [
      'Meeting minutes',
      'Action items tracking',
      'Business correspondence',
      'Report formatting',
      'Presentation notes',
    ],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'professional',
      structure: 'mixed',
      terminology: 'business',
      autoFormat: true,
      includeTimestamps: true,
      includeSpeakerLabels: true,
    },
    aiContext: 'business communication with focus on professional language and structured formatting',
  },
  {
    mode: 'education',
    displayName: 'Educator',
    icon: '🎓',
    description: 'Lecture notes, lesson planning, and student feedback',
    features: [
      'Lecture transcription',
      'Lesson plan formatting',
      'Student feedback notes',
      'Assignment creation',
      'Curriculum notes',
    ],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'professional',
      structure: 'mixed',
      terminology: 'standard',
      autoFormat: true,
      includeTimestamps: false,
      includeSpeakerLabels: false,
    },
    aiContext: 'educational content with focus on clarity and structured learning materials',
  },
  {
    mode: 'journalism',
    displayName: 'Journalist',
    icon: '📰',
    description: 'Interview transcription, article drafting, and research notes',
    features: [
      'Interview transcription',
      'Article formatting',
      'Research notes',
      'Quote attribution',
      'Fact-checking notes',
    ],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'professional',
      structure: 'paragraphs',
      terminology: 'standard',
      autoFormat: true,
      includeTimestamps: true,
      includeSpeakerLabels: true,
    },
    aiContext: 'journalistic writing with focus on clarity, attribution, and factual accuracy',
  },
  {
    mode: 'creative',
    displayName: 'Creative Writer',
    icon: '✍️',
    description: 'Creative writing, storytelling, and content creation',
    features: [
      'Story dictation',
      'Character notes',
      'Plot development',
      'Dialogue formatting',
      'Creative brainstorming',
    ],
    templates: [],
    voiceCommands: [],
    formatting: {
      style: 'casual',
      structure: 'paragraphs',
      terminology: 'standard',
      autoFormat: false,
      includeTimestamps: false,
      includeSpeakerLabels: false,
    },
    aiContext: 'creative writing with focus on narrative flow and expressive language',
  },
];

interface ProfessionalModeProviderProps {
  children: React.ReactNode;
  defaultMode?: ProfessionalMode;
}

export const ProfessionalModeProvider: React.FC<ProfessionalModeProviderProps> = ({
  children,
  defaultMode = 'general',
}) => {
  console.log('🎯 ProfessionalModeProvider initializing with mode:', defaultMode);

  const [currentMode, setCurrentMode] = useState<ProfessionalMode>(defaultMode);
  const [modeConfig, setModeConfig] = useState<ProfessionalModeConfig>(
    professionalModes.find(m => m.mode === defaultMode) || professionalModes[0]
  );
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<NoteTemplate | null>(null);
  const [aiConfig, setAIConfig] = useState<AIAssistantConfig>({
    enabled: true,
    model: 'gpt-4',
    realTimeProcessing: true,
    autoSuggestions: true,
    contextAwareness: true,
    professionalMode: defaultMode,
  });

  // Define functions before useEffect hooks
  const loadTemplatesForMode = useCallback((mode: ProfessionalMode) => {
    try {
      // Load built-in templates and custom templates from localStorage
      const builtInTemplates = getBuiltInTemplates(mode);
      const customTemplatesJson = localStorage.getItem(`voiceflow-templates-${mode}`);
      const customTemplates = customTemplatesJson ? JSON.parse(customTemplatesJson) : [];

      setTemplates([...builtInTemplates, ...customTemplates]);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  }, []);

  const switchMode = useCallback((mode: ProfessionalMode) => {
    try {
      const config = professionalModes.find(m => m.mode === mode);
      if (config) {
        // Update voice commands for the new mode
        const voiceCommands = getVoiceCommandsForMode(mode);
        const updatedConfig = { ...config, voiceCommands };

        setCurrentMode(mode);
        setModeConfig(updatedConfig);
        setActiveTemplate(null);
        localStorage.setItem('voiceflow-professional-mode', mode);

        // Update AI config
        setAIConfig(prev => ({
          ...prev,
          professionalMode: mode,
        }));
      }
    } catch (error) {
      console.error('Error switching mode:', error);
    }
  }, []);

  // Load saved mode from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('voiceflow-professional-mode');
      if (savedMode && professionalModes.some(m => m.mode === savedMode)) {
        switchMode(savedMode as ProfessionalMode);
      }
    } catch (error) {
      console.error('Error loading saved mode:', error);
    }
  }, [switchMode]);

  // Load templates for current mode
  useEffect(() => {
    loadTemplatesForMode(currentMode);
  }, [currentMode, loadTemplatesForMode]);

  const selectTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setActiveTemplate(template);
    }
  }, [templates]);

  const createCustomTemplate = useCallback((template: Omit<NoteTemplate, 'id'>) => {
    const newTemplate: NoteTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
    };
    
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    
    // Save to localStorage
    const customTemplates = updatedTemplates.filter(t => t.id.startsWith('custom-'));
    localStorage.setItem(
      `voiceflow-templates-${currentMode}`,
      JSON.stringify(customTemplates)
    );
  }, [templates, currentMode]);

  const updateAIConfig = useCallback((config: Partial<AIAssistantConfig>) => {
    setAIConfig(prev => ({ ...prev, ...config }));
  }, []);

  const executeVoiceCommand = useCallback(async (command: string): Promise<boolean> => {
    // Voice command execution logic will be implemented
    console.log('Executing voice command:', command);
    return true;
  }, []);

  const formatNote = useCallback(async (text: string): Promise<string> => {
    // Note formatting logic based on current mode
    // This will integrate with the AI processor service
    return text;
  }, []);

  const value = React.useMemo<ProfessionalModeContextType>(() => ({
    currentMode,
    modeConfig,
    availableModes: professionalModes,
    templates,
    activeTemplate,
    voiceCommands: modeConfig.voiceCommands,
    aiConfig,
    switchMode,
    selectTemplate,
    createCustomTemplate,
    updateAIConfig,
    executeVoiceCommand,
    formatNote,
  }), [
    currentMode,
    modeConfig,
    templates,
    activeTemplate,
    aiConfig,
    switchMode,
    selectTemplate,
    createCustomTemplate,
    updateAIConfig,
    executeVoiceCommand,
    formatNote,
  ]);

  return (
    <ProfessionalModeContext.Provider value={value}>
      {children}
    </ProfessionalModeContext.Provider>
  );
};
