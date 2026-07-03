/**
 * Agent UI Components - Shared across Web and Mobile
 * Non-disruptive agent integration components
 */

// Web Components
export { AgentCommandPalette } from './AgentCommandPalette';
export {
  AgentQuickActions,
  TranscriptQuickActions,
  MedicalQuickActions,
  MeetingQuickActions,
} from './AgentQuickActions';
export { AgentInlineAssist, AgentFieldWrapper } from './AgentInlineAssist';
export { AgentSuggestionBanner } from './AgentSuggestionBanner';

// Mobile Components (React Native)
// Note: AgentFAB should be imported separately in RN projects
// export { AgentFAB } from './AgentFAB';

// Re-export types
export type {} from './AgentCommandPalette';
export type {} from './AgentQuickActions';
