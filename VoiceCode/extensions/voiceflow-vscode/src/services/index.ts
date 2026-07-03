/**
 * VoiceFlow PRO Services Index
 * Exports all service modules for the extension
 */

// Core Services
export { MCPIntegrationService } from './MCPIntegrationService';
export type {
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPPrompt,
  MCPServerConfig,
  MCPEvents,
} from './MCPIntegrationService';

export { EnhancedAIBridgeService } from './EnhancedAIBridgeService';
export type {
  AIProviderType,
  AIRequest,
  AIContext,
  AIRequestOptions,
  AIResponse,
  AIToolCall,
  ProviderStatus,
} from './EnhancedAIBridgeService';

export { MultiFileEditingService } from './MultiFileEditingService';
export type {
  FileEdit,
  TextEdit,
  EditSession,
  DiffPreview,
  DiffHunk,
  EditResult,
} from './MultiFileEditingService';

export { TelemetryService } from './TelemetryService';
export type {
  TelemetryEventType,
  TelemetryEvent,
  PerformanceMetric,
  UsageStatistics,
  ErrorReport,
} from './TelemetryService';

export { OnboardingService } from './OnboardingService';
export type {
  OnboardingStep,
  Tutorial,
  TutorialStep,
  DiscoverableCommand,
  OnboardingProgress,
} from './OnboardingService';

export { WhisperModelManager } from './WhisperModelManager';

// VS Code Native Integration Services
export { VoiceFlowChatParticipant } from './VoiceFlowChatParticipant';
export { LanguageModelToolsService } from './LanguageModelToolsService';

// Re-export providers
export { VoiceFlowDashboardProvider } from '../providers/VoiceFlowDashboardProvider';
