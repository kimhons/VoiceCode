// Voice Command Definitions for VoiceFlow Pro
// Profession-specific voice commands for hands-free operation

import { VoiceCommandDefinition, ProfessionalMode } from '@/types';

// General voice commands (available in all modes)
export const generalCommands: VoiceCommandDefinition[] = [
  {
    id: 'start-recording',
    trigger: ['start recording', 'begin recording', 'record'],
    action: 'start_recording',
    description: 'Start voice recording',
  },
  {
    id: 'stop-recording',
    trigger: ['stop recording', 'end recording', 'stop'],
    action: 'stop_recording',
    description: 'Stop voice recording',
  },
  {
    id: 'pause-recording',
    trigger: ['pause recording', 'pause'],
    action: 'pause_recording',
    description: 'Pause voice recording',
  },
  {
    id: 'save-note',
    trigger: ['save note', 'save document', 'save'],
    action: 'save_note',
    description: 'Save current note',
    requiresConfirmation: true,
  },
  {
    id: 'new-note',
    trigger: ['new note', 'create note', 'start new'],
    action: 'new_note',
    description: 'Create a new note',
    requiresConfirmation: true,
  },
  {
    id: 'format-note',
    trigger: ['format note', 'format document', 'apply formatting'],
    action: 'format_note',
    description: 'Apply AI formatting to current note',
  },
  {
    id: 'undo',
    trigger: ['undo', 'undo that'],
    action: 'undo',
    description: 'Undo last action',
  },
  {
    id: 'help',
    trigger: ['help', 'show commands', 'what can I say'],
    action: 'help',
    description: 'Show available voice commands',
  },
];

// Medical practitioner commands
export const medicalCommands: VoiceCommandDefinition[] = [
  {
    id: 'medical-new-patient',
    trigger: ['new patient', 'start patient note'],
    action: 'new_note',
    parameters: { template: 'medical-soap-note' },
    description: 'Start a new patient SOAP note',
    mode: 'medical',
  },
  {
    id: 'medical-subjective',
    trigger: ['subjective section', 'patient history', 'start subjective'],
    action: 'insert_section',
    parameters: { section: 'subjective' },
    description: 'Insert subjective section',
    mode: 'medical',
  },
  {
    id: 'medical-objective',
    trigger: ['objective section', 'examination findings', 'start objective'],
    action: 'insert_section',
    parameters: { section: 'objective' },
    description: 'Insert objective section',
    mode: 'medical',
  },
  {
    id: 'medical-assessment',
    trigger: ['assessment section', 'diagnosis', 'start assessment'],
    action: 'insert_section',
    parameters: { section: 'assessment' },
    description: 'Insert assessment section',
    mode: 'medical',
  },
  {
    id: 'medical-plan',
    trigger: ['plan section', 'treatment plan', 'start plan'],
    action: 'insert_section',
    parameters: { section: 'plan' },
    description: 'Insert plan section',
    mode: 'medical',
  },
  {
    id: 'medical-vitals',
    trigger: ['record vitals', 'vital signs', 'add vitals'],
    action: 'insert_section',
    parameters: { section: 'vitals' },
    description: 'Record vital signs',
    mode: 'medical',
  },
  {
    id: 'medical-medications',
    trigger: ['add medication', 'prescribe', 'medications'],
    action: 'insert_section',
    parameters: { section: 'medications' },
    description: 'Add medication to plan',
    mode: 'medical',
  },
];

// Developer commands
export const developerCommands: VoiceCommandDefinition[] = [
  {
    id: 'dev-bug-report',
    trigger: ['new bug', 'report bug', 'bug report'],
    action: 'new_note',
    parameters: { template: 'dev-bug-report' },
    description: 'Start a new bug report',
    mode: 'developer',
  },
  {
    id: 'dev-feature-spec',
    trigger: ['new feature', 'feature spec', 'feature specification'],
    action: 'new_note',
    parameters: { template: 'dev-feature-spec' },
    description: 'Start a new feature specification',
    mode: 'developer',
  },
  {
    id: 'dev-code-review',
    trigger: ['code review', 'review notes', 'start review'],
    action: 'new_note',
    parameters: { template: 'dev-code-review' },
    description: 'Start code review notes',
    mode: 'developer',
  },
  {
    id: 'dev-code-block',
    trigger: ['insert code', 'code block', 'add code'],
    action: 'insert_section',
    parameters: { section: 'code-snippet', type: 'code' },
    description: 'Insert a code block',
    mode: 'developer',
  },
  {
    id: 'dev-todo',
    trigger: ['add todo', 'todo item', 'action item'],
    action: 'insert_section',
    parameters: { section: 'todo' },
    description: 'Add a TODO item',
    mode: 'developer',
  },
];

// Business commands
export const businessCommands: VoiceCommandDefinition[] = [
  {
    id: 'business-meeting',
    trigger: ['new meeting', 'meeting notes', 'start meeting'],
    action: 'new_note',
    parameters: { template: 'business-meeting-minutes' },
    description: 'Start meeting minutes',
    mode: 'business',
  },
  {
    id: 'business-action-item',
    trigger: ['action item', 'add action', 'task'],
    action: 'insert_section',
    parameters: { section: 'action-items' },
    description: 'Add an action item',
    mode: 'business',
  },
  {
    id: 'business-decision',
    trigger: ['record decision', 'decision made', 'add decision'],
    action: 'insert_section',
    parameters: { section: 'decisions' },
    description: 'Record a decision',
    mode: 'business',
  },
  {
    id: 'business-attendees',
    trigger: ['add attendee', 'attendees', 'participants'],
    action: 'insert_section',
    parameters: { section: 'attendees' },
    description: 'Add meeting attendees',
    mode: 'business',
  },
];

// Legal commands
export const legalCommands: VoiceCommandDefinition[] = [
  {
    id: 'legal-case-note',
    trigger: ['new case', 'case note', 'client consultation'],
    action: 'new_note',
    parameters: { template: 'legal-case-note' },
    description: 'Start a new case note',
    mode: 'legal',
  },
  {
    id: 'legal-citation',
    trigger: ['add citation', 'cite case', 'legal citation'],
    action: 'insert_section',
    parameters: { section: 'citation' },
    description: 'Add a legal citation',
    mode: 'legal',
  },
];

// Education commands
export const educationCommands: VoiceCommandDefinition[] = [
  {
    id: 'edu-lecture',
    trigger: ['new lecture', 'lecture notes', 'start lecture'],
    action: 'new_note',
    parameters: { template: 'education-lecture' },
    description: 'Start lecture notes',
    mode: 'education',
  },
  {
    id: 'edu-lesson-plan',
    trigger: ['lesson plan', 'new lesson', 'plan lesson'],
    action: 'new_note',
    parameters: { template: 'education-lesson-plan' },
    description: 'Start a lesson plan',
    mode: 'education',
  },
];

// Journalism commands
export const journalismCommands: VoiceCommandDefinition[] = [
  {
    id: 'journalism-interview',
    trigger: ['new interview', 'interview notes', 'start interview'],
    action: 'new_note',
    parameters: { template: 'journalism-interview' },
    description: 'Start interview transcription',
    mode: 'journalism',
  },
  {
    id: 'journalism-quote',
    trigger: ['add quote', 'insert quote', 'quote'],
    action: 'insert_section',
    parameters: { section: 'quote' },
    description: 'Insert a quote',
    mode: 'journalism',
  },
];

// Creative writing commands
export const creativeCommands: VoiceCommandDefinition[] = [
  {
    id: 'creative-story',
    trigger: ['new story', 'start story', 'begin writing'],
    action: 'new_note',
    parameters: { template: 'creative-story' },
    description: 'Start a new story',
    mode: 'creative',
  },
  {
    id: 'creative-character',
    trigger: ['character note', 'new character', 'character description'],
    action: 'insert_section',
    parameters: { section: 'character' },
    description: 'Add character notes',
    mode: 'creative',
  },
  {
    id: 'creative-dialogue',
    trigger: ['add dialogue', 'insert dialogue', 'dialogue'],
    action: 'insert_section',
    parameters: { section: 'dialogue' },
    description: 'Insert dialogue',
    mode: 'creative',
  },
];

// Export commands by mode
export const commandsByMode: Record<ProfessionalMode, VoiceCommandDefinition[]> = {
  general: generalCommands,
  medical: [...generalCommands, ...medicalCommands],
  developer: [...generalCommands, ...developerCommands],
  legal: [...generalCommands, ...legalCommands],
  business: [...generalCommands, ...businessCommands],
  education: [...generalCommands, ...educationCommands],
  journalism: [...generalCommands, ...journalismCommands],
  creative: [...generalCommands, ...creativeCommands],
};

export function getCommandsForMode(mode: ProfessionalMode): VoiceCommandDefinition[] {
  return commandsByMode[mode] || generalCommands;
}

// Voice command matcher
export function matchVoiceCommand(
  spokenText: string,
  mode: ProfessionalMode
): VoiceCommandDefinition | null {
  const commands = getCommandsForMode(mode);
  const normalizedText = spokenText.toLowerCase().trim();

  for (const command of commands) {
    for (const trigger of command.trigger) {
      if (normalizedText.includes(trigger.toLowerCase())) {
        return command;
      }
    }
  }

  return null;
}

