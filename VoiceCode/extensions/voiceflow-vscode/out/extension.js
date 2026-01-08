"use strict";
/**
 * VoiceFlow VSCode Extension - Main Entry Point
 *
 * This extension provides voice-powered AI coding assistance with:
 * - Lazy service loading for fast activation
 * - Tier-based feature loading (FREE, PRO, ENTERPRISE)
 * - Multi-provider AI support (Copilot, Cursor, Cline, etc.)
 * - Local Whisper.js for offline transcription
 *
 * PERFORMANCE OPTIMIZATION:
 * - Uses lazy loading to reduce activation time from 2-3s to <1s
 * - Only loads services needed for user's tier
 * - Preloads AI services in background after activation
 * - Whisper model loaded on-demand
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const LazyServices_1 = require("./services/LazyServices");
/**
 * Extension activation
 * Called when extension is activated (onStartupFinished)
 */
async function activate(context) {
    const activationStart = Date.now();
    console.log('[VoiceFlow] Extension activating...');
    try {
        // Step 1: Initialize telemetry (to track activation performance)
        const telemetry = await (0, LazyServices_1.getTelemetryService)();
        telemetry.recordEvent('activation', {
            stage: 'started',
            timestamp: activationStart,
        });
        // Step 2: Get user authentication and tier
        const auth = await (0, LazyServices_1.getAuthenticationService)();
        auth.initialize(context); // Pass context for state management
        const userTier = await auth.getUserTier(); // Returns FREE, PRO, or ENTERPRISE
        console.log(`[VoiceFlow] User tier: ${userTier}`);
        // Step 3: Initialize services based on tier
        const { core, tier } = await (0, LazyServices_1.initializeServicesForTier)(userTier);
        console.log(`[VoiceFlow] Loaded ${core.length} core services + ${tier.length} tier services`);
        // Step 4: Preload Whisper model in background (non-blocking)
        (0, LazyServices_1.getWhisperModelManager)()
            .then(async (manager) => {
            // Get model preference from settings
            const config = vscode.workspace.getConfiguration('voiceflow');
            const modelSize = config.get('sttEngine', 'whisper-base');
            // Preload model (non-blocking)
            await manager.preloadModel(modelSize);
            console.log(`[VoiceFlow] Whisper model (${modelSize}) preloaded`);
        })
            .catch((error) => {
            console.error('[VoiceFlow] Whisper preload failed:', error);
            // Extension still works, will use cloud fallback
        });
        // Step 5: Register core commands (always available)
        registerCoreCommands(context);
        // Step 6: Register tier-specific commands
        if (userTier === LazyServices_1.ServiceTier.PRO || userTier === LazyServices_1.ServiceTier.ENTERPRISE) {
            registerProCommands(context);
        }
        if (userTier === LazyServices_1.ServiceTier.ENTERPRISE) {
            registerEnterpriseCommands(context);
        }
        // Step 7: Register AI provider integrations
        registerAIProviderIntegrations(context);
        // Step 8: Preload AI services in background (after 2 seconds)
        (0, LazyServices_1.preloadAIServices)();
        // Step 9: Record activation complete with performance metrics
        const activationTime = Date.now() - activationStart;
        const servicesLoaded = core.length + tier.length;
        // Record activation performance
        telemetry.recordActivationPerformance(activationTime, userTier, servicesLoaded);
        // Also record as standard event for backward compatibility
        telemetry.recordEvent('activation', {
            duration: activationTime,
            userTier,
            servicesLoaded,
        });
        console.log(`[VoiceFlow] Activation complete in ${activationTime}ms`);
        // Step 10: Log service statistics
        const stats = (0, LazyServices_1.getServiceStats)();
        console.log('[VoiceFlow] Service stats:', stats);
        // Step 11: Show welcome message (if first time)
        const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
        if (!hasShownWelcome) {
            showWelcomeMessage(context, userTier);
            await context.globalState.update('hasShownWelcome', true);
        }
        // Set context for when clauses
        vscode.commands.executeCommand('setContext', 'voiceflow.enabled', true);
        vscode.commands.executeCommand('setContext', 'voiceflow.isListening', false);
    }
    catch (error) {
        console.error('[VoiceFlow] Activation failed:', error);
        vscode.window.showErrorMessage(`VoiceFlow Pro failed to activate: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Record failure for telemetry
        try {
            const telemetry = await (0, LazyServices_1.getTelemetryService)();
            telemetry.recordEvent('activation', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - activationStart,
            });
        }
        catch {
            // Ignore telemetry errors during activation failure
        }
    }
}
/**
 * Register core commands (available to all users)
 */
function registerCoreCommands(context) {
    // Toggle listening
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.toggleListening', async () => {
        const voice = await (0, LazyServices_1.getVoiceRecognitionService)();
        await voice.toggleListening();
        const isListening = voice.getIsListening();
        vscode.commands.executeCommand('setContext', 'voiceflow.isListening', isListening);
        vscode.window.showInformationMessage(isListening ? 'VoiceFlow: Listening...' : 'VoiceFlow: Stopped listening');
    }));
    // Start listening
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.startListening', async () => {
        const voice = await (0, LazyServices_1.getVoiceRecognitionService)();
        await voice.startListening();
        vscode.commands.executeCommand('setContext', 'voiceflow.isListening', true);
    }));
    // Stop listening
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.stopListening', async () => {
        const voice = await (0, LazyServices_1.getVoiceRecognitionService)();
        await voice.stopListening();
        vscode.commands.executeCommand('setContext', 'voiceflow.isListening', false);
    }));
    // Open dashboard
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.openDashboard', async () => {
        // Dashboard provider is lightweight, load on-demand
        const { VoiceFlowDashboardProvider } = await Promise.resolve().then(() => __importStar(require('./providers/VoiceFlowDashboardProvider')));
        const telemetry = await (0, LazyServices_1.getTelemetryService)();
        const dashboard = new VoiceFlowDashboardProvider(context.extensionUri, telemetry);
        const panel = vscode.window.createWebviewPanel('voiceflowDashboard', 'VoiceFlow Pro Dashboard', vscode.ViewColumn.One, {
            enableScripts: true,
        });
        panel.webview.html = dashboard['getHtmlContent'](panel.webview);
    }));
    // Show commands
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.showCommands', async () => {
        const suggestions = await (0, LazyServices_1.getCommandSuggestionsService)();
        await suggestions.showCommandPalette();
    }));
    // Open settings
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'voiceflow');
    }));
    // Show chatbox (open chat participant)
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.showChatbox', async () => {
        await vscode.commands.executeCommand('workbench.action.chat.open', '@voiceflow');
    }));
    // Sign in
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.signIn', async () => {
        const auth = await (0, LazyServices_1.getAuthenticationService)();
        await auth.signIn();
    }));
    // Sign out
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.signOut', async () => {
        const auth = await (0, LazyServices_1.getAuthenticationService)();
        await auth.signOut();
    }));
    console.log('[VoiceFlow] Registered core commands');
}
/**
 * Register Pro tier commands
 */
function registerProCommands(context) {
    // Cloud sync
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.syncToCloud', async () => {
        const sync = await (0, LazyServices_1.getCloudSyncService)();
        await sync.syncNow();
        vscode.window.showInformationMessage('Cloud sync completed');
    }));
    // Voice training
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.trainVoiceModel', async () => {
        const training = await (0, LazyServices_1.getVoiceTrainingService)();
        await training.startTrainingSession();
    }));
    // Billing dashboard
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.showBilling', async () => {
        const billing = await (0, LazyServices_1.getBillingService)();
        await billing.showDashboard();
    }));
    console.log('[VoiceFlow] Registered Pro commands');
}
/**
 * Register Enterprise tier commands
 */
function registerEnterpriseCommands(context) {
    // Team collaboration
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.shareWithTeam', async () => {
        const team = await (0, LazyServices_1.getTeamCollaborationService)();
        await team.shareCurrentFile();
    }));
    // Invite team member
    context.subscriptions.push(vscode.commands.registerCommand('voiceflow.inviteTeamMember', async () => {
        const team = await (0, LazyServices_1.getTeamCollaborationService)();
        await team.inviteMember();
    }));
    console.log('[VoiceFlow] Registered Enterprise commands');
}
/**
 * Register AI provider integrations (Language Model Tools and Chat Participant)
 */
function registerAIProviderIntegrations(context) {
    // Register Chat Participant
    (0, LazyServices_1.getVoiceFlowChatParticipant)()
        .then((participant) => {
        console.log('[VoiceFlow] Chat participant registered');
    })
        .catch((error) => {
        console.error('[VoiceFlow] Failed to register chat participant:', error);
    });
    // Register Language Model Tools
    (0, LazyServices_1.getLanguageModelToolsService)()
        .then((lmTools) => {
        console.log('[VoiceFlow] Language Model Tools registered');
    })
        .catch((error) => {
        console.error('[VoiceFlow] Failed to register Language Model Tools:', error);
    });
    console.log('[VoiceFlow] AI provider integrations initiated');
}
/**
 * Show welcome message based on user tier
 */
function showWelcomeMessage(context, tier) {
    const message = tier === LazyServices_1.ServiceTier.FREE
        ? 'Welcome to VoiceFlow Pro! Press Ctrl+Shift+V to start voice coding.'
        : tier === LazyServices_1.ServiceTier.PRO
            ? 'Welcome to VoiceFlow Pro! Your Pro features are ready. Press Ctrl+Shift+V to start.'
            : 'Welcome to VoiceFlow Pro Enterprise! All features activated. Press Ctrl+Shift+V to start.';
    vscode.window
        .showInformationMessage(message, 'Open Dashboard', 'View Commands')
        .then((selection) => {
        if (selection === 'Open Dashboard') {
            vscode.commands.executeCommand('voiceflow.openDashboard');
        }
        else if (selection === 'View Commands') {
            vscode.commands.executeCommand('voiceflow.showCommands');
        }
    });
}
/**
 * Extension deactivation
 */
function deactivate() {
    console.log('[VoiceFlow] Extension deactivating...');
    // Record deactivation for telemetry
    (0, LazyServices_1.getTelemetryService)()
        .then((telemetry) => {
        const stats = (0, LazyServices_1.getServiceStats)();
        telemetry.recordEvent('deactivation', {
            servicesLoaded: stats.loaded,
            averageLoadTime: stats.averageLoadTime,
        });
    })
        .catch(() => {
        // Ignore errors during deactivation
    });
}
//# sourceMappingURL=extension.js.map