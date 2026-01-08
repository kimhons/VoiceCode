"use strict";
/**
 * Lazy Service Loaders
 * Provides lazy-loaded versions of all services
 * Reduces initial extension activation time by loading services on-demand
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTelemetryService = exports.getMultiFileEditingService = exports.getVoiceFlowChatParticipant = exports.getLanguageModelToolsService = exports.getMCPIntegrationService = exports.getEnhancedAIBridgeService = exports.getMultiWindowManager = exports.getTeamCollaborationService = exports.getVoiceTrainingService = exports.getCloudSyncService = exports.getBillingService = exports.getOnboardingService = exports.getAuthenticationService = exports.getCommandSuggestionsService = exports.getVoiceRecognitionService = exports.ServiceTier = void 0;
exports.getWhisperModelManager = getWhisperModelManager;
exports.initializeServicesForTier = initializeServicesForTier;
exports.preloadAIServices = preloadAIServices;
exports.getServiceStats = getServiceStats;
const ServiceLoader_1 = require("../utils/ServiceLoader");
// Re-export ServiceTier for external use
var ServiceLoader_2 = require("../utils/ServiceLoader");
Object.defineProperty(exports, "ServiceTier", { enumerable: true, get: function () { return ServiceLoader_2.ServiceTier; } });
/**
 * FREE TIER SERVICES (Load immediately)
 */
// Core services needed for basic functionality
exports.getVoiceRecognitionService = (0, ServiceLoader_1.createLazyService)('VoiceRecognitionService', () => Promise.resolve().then(() => __importStar(require('./VoiceRecognitionService'))).then(m => ({ VoiceRecognitionService: m.VoiceRecognitionService })));
exports.getCommandSuggestionsService = (0, ServiceLoader_1.createLazyService)('CommandSuggestionsService', () => Promise.resolve().then(() => __importStar(require('./CommandSuggestionsService'))).then(m => ({ CommandSuggestionsService: m.CommandSuggestionsService })));
exports.getAuthenticationService = (0, ServiceLoader_1.createLazyService)('AuthenticationService', () => Promise.resolve().then(() => __importStar(require('./AuthenticationService'))).then(m => ({ AuthenticationService: m.AuthenticationService })));
// WhisperModelManager uses singleton pattern with getInstance()
async function getWhisperModelManager() {
    const { WhisperModelManager } = await Promise.resolve().then(() => __importStar(require('./WhisperModelManager')));
    return WhisperModelManager.getInstance();
}
exports.getOnboardingService = (0, ServiceLoader_1.createLazyService)('OnboardingService', () => Promise.resolve().then(() => __importStar(require('./OnboardingService'))).then(m => ({ OnboardingService: m.OnboardingService })));
/**
 * PRO TIER SERVICES (Lazy load on-demand)
 */
exports.getBillingService = (0, ServiceLoader_1.createLazyService)('BillingService', () => Promise.resolve().then(() => __importStar(require('./BillingService'))).then(m => ({ BillingService: m.BillingService })));
exports.getCloudSyncService = (0, ServiceLoader_1.createLazyService)('CloudSyncService', () => Promise.resolve().then(() => __importStar(require('./CloudSyncService'))).then(m => ({ CloudSyncService: m.CloudSyncService })));
exports.getVoiceTrainingService = (0, ServiceLoader_1.createLazyService)('VoiceTrainingService', () => Promise.resolve().then(() => __importStar(require('./VoiceTrainingService'))).then(m => ({ VoiceTrainingService: m.VoiceTrainingService })));
/**
 * ENTERPRISE TIER SERVICES (Lazy load on-demand)
 */
exports.getTeamCollaborationService = (0, ServiceLoader_1.createLazyService)('TeamCollaborationService', () => Promise.resolve().then(() => __importStar(require('./TeamCollaborationService'))).then(m => ({ TeamCollaborationService: m.TeamCollaborationService })));
exports.getMultiWindowManager = (0, ServiceLoader_1.createLazyService)('MultiWindowManager', () => Promise.resolve().then(() => __importStar(require('./MultiWindowManager'))).then(m => ({ MultiWindowManager: m.MultiWindowManager })));
/**
 * AI PROVIDER SERVICES (Lazy load on-demand based on user selection)
 */
exports.getEnhancedAIBridgeService = (0, ServiceLoader_1.createLazyService)('EnhancedAIBridgeService', () => Promise.resolve().then(() => __importStar(require('./EnhancedAIBridgeService'))).then(m => ({ EnhancedAIBridgeService: m.EnhancedAIBridgeService })));
exports.getMCPIntegrationService = (0, ServiceLoader_1.createLazyService)('MCPIntegrationService', () => Promise.resolve().then(() => __importStar(require('./MCPIntegrationService'))).then(m => ({ MCPIntegrationService: m.MCPIntegrationService })));
exports.getLanguageModelToolsService = (0, ServiceLoader_1.createLazyService)('LanguageModelToolsService', () => Promise.resolve().then(() => __importStar(require('./LanguageModelToolsService'))).then(m => ({ LanguageModelToolsService: m.LanguageModelToolsService })));
exports.getVoiceFlowChatParticipant = (0, ServiceLoader_1.createLazyService)('VoiceFlowChatParticipant', () => Promise.resolve().then(() => __importStar(require('./VoiceFlowChatParticipant'))).then(m => ({ VoiceFlowChatParticipant: m.VoiceFlowChatParticipant })));
/**
 * UTILITY SERVICES (Lazy load on-demand)
 */
exports.getMultiFileEditingService = (0, ServiceLoader_1.createLazyService)('MultiFileEditingService', () => Promise.resolve().then(() => __importStar(require('./MultiFileEditingService'))).then(m => ({ MultiFileEditingService: m.MultiFileEditingService })));
exports.getTelemetryService = (0, ServiceLoader_1.createLazyService)('TelemetryService', () => Promise.resolve().then(() => __importStar(require('./TelemetryService'))).then(m => ({ TelemetryService: m.TelemetryService })));
/**
 * Service initialization based on user tier
 */
async function initializeServicesForTier(userTier) {
    console.log(`[LazyServices] Initializing services for ${userTier} tier`);
    // Always load core services (FREE tier)
    const coreServices = await Promise.all([
        (0, exports.getAuthenticationService)(),
        (0, exports.getVoiceRecognitionService)(),
        (0, exports.getCommandSuggestionsService)(),
        (0, exports.getOnboardingService)(),
        (0, exports.getTelemetryService)(), // Load telemetry to track activation
    ]);
    // Set telemetry in serviceLoader for performance tracking
    const telemetry = coreServices[4]; // TelemetryService is the 5th service
    if (telemetry && typeof telemetry === 'object') {
        ServiceLoader_1.serviceLoader.setTelemetry(telemetry);
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
    const tierServices = [];
    // Load tier-specific services
    if (userTier === ServiceLoader_1.ServiceTier.PRO || userTier === ServiceLoader_1.ServiceTier.ENTERPRISE) {
        // Load Pro services
        const proServices = await Promise.all([
            (0, exports.getBillingService)(),
            (0, exports.getCloudSyncService)(),
            (0, exports.getVoiceTrainingService)(),
        ]);
        tierServices.push(...proServices);
    }
    if (userTier === ServiceLoader_1.ServiceTier.ENTERPRISE) {
        // Load Enterprise services
        const enterpriseServices = await Promise.all([
            (0, exports.getTeamCollaborationService)(),
            (0, exports.getMultiWindowManager)(),
        ]);
        tierServices.push(...enterpriseServices);
    }
    // AI services loaded on first use (not at activation)
    console.log(`[LazyServices] Initialized ${coreServices.length} core + ${tierServices.length} tier services`);
    return {
        core: coreServices,
        tier: tierServices,
    };
}
/**
 * Preload AI services in background (after activation)
 */
function preloadAIServices() {
    console.log('[LazyServices] Preloading AI services in background...');
    // Non-blocking preload
    setTimeout(async () => {
        try {
            await Promise.allSettled([
                (0, exports.getEnhancedAIBridgeService)(),
                (0, exports.getMCPIntegrationService)(),
                (0, exports.getLanguageModelToolsService)(),
                (0, exports.getVoiceFlowChatParticipant)(),
            ]);
            console.log('[LazyServices] AI services preloaded');
        }
        catch (error) {
            console.error('[LazyServices] AI service preload failed:', error);
        }
    }, 2000); // Delay 2 seconds after activation
}
/**
 * Get service loading statistics
 */
function getServiceStats() {
    return ServiceLoader_1.serviceLoader.getStats();
}
//# sourceMappingURL=LazyServices.js.map