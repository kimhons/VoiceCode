/**
 * Lazy Service Loaders
 * Provides lazy-loaded versions of all services
 * Reduces initial extension activation time by loading services on-demand
 */
import { ServiceTier } from '../utils/ServiceLoader';
export { ServiceTier } from '../utils/ServiceLoader';
/**
 * FREE TIER SERVICES (Load immediately)
 */
export declare const getVoiceRecognitionService: () => Promise<import("./VoiceRecognitionService").VoiceRecognitionService>;
export declare const getCommandSuggestionsService: () => Promise<import("./CommandSuggestionsService").CommandSuggestionsService>;
export declare const getAuthenticationService: () => Promise<import("./AuthenticationService").AuthenticationService>;
export declare function getWhisperModelManager(): Promise<import("./WhisperModelManager").WhisperModelManager>;
export declare const getOnboardingService: () => Promise<import("./OnboardingService").OnboardingService>;
/**
 * PRO TIER SERVICES (Lazy load on-demand)
 */
export declare const getBillingService: () => Promise<import("./BillingService").BillingService>;
export declare const getPricingService: () => Promise<import("./PricingService").PricingService>;
export declare const getCloudSyncService: () => Promise<import("./CloudSyncService").CloudSyncService>;
export declare const getVoiceTrainingService: () => Promise<import("./VoiceTrainingService").VoiceTrainingService>;
/**
 * ENTERPRISE TIER SERVICES (Lazy load on-demand)
 */
export declare const getTeamCollaborationService: () => Promise<import("./TeamCollaborationService").TeamCollaborationService>;
export declare const getMultiWindowManager: () => Promise<import("./MultiWindowManager").MultiWindowManager>;
/**
 * AI PROVIDER SERVICES (Lazy load on-demand based on user selection)
 */
export declare const getEnhancedAIBridgeService: () => Promise<import("./EnhancedAIBridgeService").EnhancedAIBridgeService>;
export declare const getMCPIntegrationService: () => Promise<import("./MCPIntegrationService").MCPIntegrationService>;
export declare const getLanguageModelToolsService: () => Promise<import("./LanguageModelToolsService").LanguageModelToolsService>;
export declare const getVoiceFlowChatParticipant: () => Promise<import("./VoiceFlowChatParticipant").VoiceFlowChatParticipant>;
/**
 * UTILITY SERVICES (Lazy load on-demand)
 */
export declare const getMultiFileEditingService: () => Promise<import("./MultiFileEditingService").MultiFileEditingService>;
export declare const getTelemetryService: () => Promise<import("./TelemetryService").TelemetryService>;
/**
 * ENHANCED AGENTIC SERVICES (New)
 */
export declare const getCodebaseIndexService: () => Promise<import("./CodebaseIndexService").CodebaseIndexService>;
export declare const getConversationMemoryService: () => Promise<import("./ConversationMemoryService").ConversationMemoryService>;
export declare const getCostTrackingService: () => Promise<import("./CostTrackingService").CostTrackingService>;
export declare const getToolChainExecutor: () => Promise<import("./ToolChainExecutor").ToolChainExecutor>;
export declare const getHumanApprovalService: () => Promise<import("./HumanApprovalService").HumanApprovalService>;
export declare const getAgentFactory: () => Promise<import("./SpecializedAgents").AgentFactory>;
export declare const getAgentRegistry: () => Promise<import("./AgentRegistry").AgentRegistry>;
export declare const getAgentCommunicationHub: () => Promise<import("./AgentCommunicationHub").AgentCommunicationHub>;
export declare const getVoiceSettingsService: () => Promise<import("./VoiceSettingsService").VoiceSettingsService>;
/**
 * Service initialization based on user tier
 */
export declare function initializeServicesForTier(userTier: ServiceTier): Promise<{
    core: any[];
    tier: any[];
}>;
/**
 * Preload AI services in background (after activation)
 */
export declare function preloadAIServices(): void;
/**
 * Get service loading statistics
 */
export declare function getServiceStats(): {
    total: number;
    loaded: number;
    byTier: Record<ServiceTier, number>;
    averageLoadTime: number;
};
//# sourceMappingURL=LazyServices.d.ts.map