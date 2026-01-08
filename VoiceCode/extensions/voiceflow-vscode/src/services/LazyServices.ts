/**
 * Lazy Service Loaders
 * Provides lazy-loaded versions of all services
 * Reduces initial extension activation time by loading services on-demand
 */

import { createLazyService, ServiceTier, serviceLoader } from '../utils/ServiceLoader';

// Re-export ServiceTier for external use
export { ServiceTier } from '../utils/ServiceLoader';

/**
 * FREE TIER SERVICES (Load immediately)
 */

// Core services needed for basic functionality
export const getVoiceRecognitionService = createLazyService(
  'VoiceRecognitionService',
  () => import('./VoiceRecognitionService').then(m => ({ VoiceRecognitionService: m.VoiceRecognitionService }))
);

export const getCommandSuggestionsService = createLazyService(
  'CommandSuggestionsService',
  () => import('./CommandSuggestionsService').then(m => ({ CommandSuggestionsService: m.CommandSuggestionsService }))
);

export const getAuthenticationService = createLazyService(
  'AuthenticationService',
  () => import('./AuthenticationService').then(m => ({ AuthenticationService: m.AuthenticationService }))
);

// WhisperModelManager uses singleton pattern with getInstance()
export async function getWhisperModelManager() {
  const { WhisperModelManager } = await import('./WhisperModelManager');
  return WhisperModelManager.getInstance();
}

export const getOnboardingService = createLazyService(
  'OnboardingService',
  () => import('./OnboardingService').then(m => ({ OnboardingService: m.OnboardingService }))
);

/**
 * PRO TIER SERVICES (Lazy load on-demand)
 */

export const getBillingService = createLazyService(
  'BillingService',
  () => import('./BillingService').then(m => ({ BillingService: m.BillingService }))
);

export const getCloudSyncService = createLazyService(
  'CloudSyncService',
  () => import('./CloudSyncService').then(m => ({ CloudSyncService: m.CloudSyncService }))
);

export const getVoiceTrainingService = createLazyService(
  'VoiceTrainingService',
  () => import('./VoiceTrainingService').then(m => ({ VoiceTrainingService: m.VoiceTrainingService }))
);

/**
 * ENTERPRISE TIER SERVICES (Lazy load on-demand)
 */

export const getTeamCollaborationService = createLazyService(
  'TeamCollaborationService',
  () => import('./TeamCollaborationService').then(m => ({ TeamCollaborationService: m.TeamCollaborationService }))
);

export const getMultiWindowManager = createLazyService(
  'MultiWindowManager',
  () => import('./MultiWindowManager').then(m => ({ MultiWindowManager: m.MultiWindowManager }))
);

/**
 * AI PROVIDER SERVICES (Lazy load on-demand based on user selection)
 */

export const getEnhancedAIBridgeService = createLazyService(
  'EnhancedAIBridgeService',
  () => import('./EnhancedAIBridgeService').then(m => ({ EnhancedAIBridgeService: m.EnhancedAIBridgeService }))
);

export const getMCPIntegrationService = createLazyService(
  'MCPIntegrationService',
  () => import('./MCPIntegrationService').then(m => ({ MCPIntegrationService: m.MCPIntegrationService }))
);

export const getLanguageModelToolsService = createLazyService(
  'LanguageModelToolsService',
  () => import('./LanguageModelToolsService').then(m => ({ LanguageModelToolsService: m.LanguageModelToolsService }))
);

export const getVoiceFlowChatParticipant = createLazyService(
  'VoiceFlowChatParticipant',
  () => import('./VoiceFlowChatParticipant').then(m => ({ VoiceFlowChatParticipant: m.VoiceFlowChatParticipant }))
);

/**
 * UTILITY SERVICES (Lazy load on-demand)
 */

export const getMultiFileEditingService = createLazyService(
  'MultiFileEditingService',
  () => import('./MultiFileEditingService').then(m => ({ MultiFileEditingService: m.MultiFileEditingService }))
);

export const getTelemetryService = createLazyService(
  'TelemetryService',
  () => import('./TelemetryService').then(m => ({ TelemetryService: m.TelemetryService }))
);

/**
 * Service initialization based on user tier
 */
export async function initializeServicesForTier(userTier: ServiceTier): Promise<{
  core: any[];
  tier: any[];
}> {
  console.log(`[LazyServices] Initializing services for ${userTier} tier`);

  // Always load core services (FREE tier)
  const coreServices = await Promise.all([
    getAuthenticationService(),
    getVoiceRecognitionService(),
    getCommandSuggestionsService(),
    getOnboardingService(),
    getTelemetryService(), // Load telemetry to track activation
  ]);

  // Set telemetry in serviceLoader for performance tracking
  const telemetry = coreServices[4]; // TelemetryService is the 5th service
  if (telemetry && typeof telemetry === 'object') {
    serviceLoader.setTelemetry(telemetry);
  }

  // Preload Whisper model in background (non-blocking)
  const modelLoadStart = Date.now();
  getWhisperModelManager()
    .then(manager => {
      const loadTime = Date.now() - modelLoadStart;
      console.log('[LazyServices] Whisper model manager ready');

      // Record model load performance if telemetry is available
      if (telemetry && typeof telemetry.recordModelLoad === 'function') {
        telemetry.recordModelLoad('WhisperModelManager', loadTime, false);
      }
    })
    .catch(error => {
      console.error('[LazyServices] Whisper model manager load failed:', error);
      if (telemetry && typeof telemetry.recordError === 'function') {
        telemetry.recordError(error, { context: 'whisper_model_load' });
      }
    });

  const tierServices: any[] = [];

  // Load tier-specific services
  if (userTier === ServiceTier.PRO || userTier === ServiceTier.ENTERPRISE) {
    // Load Pro services
    const proServices = await Promise.all([
      getBillingService(),
      getCloudSyncService(),
      getVoiceTrainingService(),
    ]);
    tierServices.push(...proServices);
  }

  if (userTier === ServiceTier.ENTERPRISE) {
    // Load Enterprise services
    const enterpriseServices = await Promise.all([
      getTeamCollaborationService(),
      getMultiWindowManager(),
    ]);
    tierServices.push(...enterpriseServices);
  }

  // AI services loaded on first use (not at activation)
  console.log(
    `[LazyServices] Initialized ${coreServices.length} core + ${tierServices.length} tier services`
  );

  return {
    core: coreServices,
    tier: tierServices,
  };
}

/**
 * Preload AI services in background (after activation)
 */
export function preloadAIServices(): void {
  console.log('[LazyServices] Preloading AI services in background...');

  // Non-blocking preload
  setTimeout(async () => {
    try {
      await Promise.allSettled([
        getEnhancedAIBridgeService(),
        getMCPIntegrationService(),
        getLanguageModelToolsService(),
        getVoiceFlowChatParticipant(),
      ]);
      console.log('[LazyServices] AI services preloaded');
    } catch (error) {
      console.error('[LazyServices] AI service preload failed:', error);
    }
  }, 2000); // Delay 2 seconds after activation
}

/**
 * Get service loading statistics
 */
export function getServiceStats() {
  return serviceLoader.getStats();
}
