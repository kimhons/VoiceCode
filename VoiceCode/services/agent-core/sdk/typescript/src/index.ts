/**
 * VoiceCode Agent SDK
 * Unified SDK for web and mobile applications
 */

// Client
export { VoiceCodeAgent, getAgentClient } from './client';

// Types
export * from './types';

// React Hooks
export {
  useAgent,
  useSuggestions,
  useMedicalScribe,
  useProductivity,
  useTranscription,
} from './hooks';
