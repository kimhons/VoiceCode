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