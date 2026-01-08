/**
 * VoiceFlow VSCode Extension - Optimized Entry Point
 *
 * This is an optimized version of extension.ts demonstrating:
 * - Lazy service loading
 * - Progressive initialization
 * - Tier-based feature loading
 * - Performance monitoring
 *
 * BEFORE: All 15 services loaded at activation (~2-3 seconds)
 * AFTER: Only core services loaded, tier services lazy-loaded (<1 second)
 */

import * as vscode from 'vscode';
import {
  initializeServicesForTier,
  preloadAIServices,
  getServiceStats,
  ServiceTier,
  getAuthenticationService,
  getWhisperModelManager,
  getTelemetryService,
} from './services/LazyServices';

/**
 * Extension activation
 * Called when extension is activated (onStartupFinished)
 */
export async function activate(context: vscode.ExtensionContext) {
  const activationStart = Date.now();
  console.log('[VoiceFlow] Extension activating...');

  try {
    // Step 1: Initialize telemetry (to track activation performance)
    const telemetry = await getTelemetryService();
    telemetry.recordEvent('activation', {
      timestamp: activationStart,
    });

    // Step 2: Get user authentication and tier
    const auth = await getAuthenticationService();
    const userTier = await auth.getUserTier(); // Returns FREE, PRO, or ENTERPRISE

    console.log(`[VoiceFlow] User tier: ${userTier}`);

    // Step 3: Initialize services based on tier
    const { core, tier } = await initializeServicesForTier(userTier);

    console.log(
      `[VoiceFlow] Loaded ${core.length} core services + ${tier.length} tier services`
    );

    // Step 4: Preload Whisper model in background (non-blocking)
    getWhisperModelManager()
      .then(async (manager) => {
        // Get model preference from settings
        const config = vscode.workspace.getConfiguration('voiceflow');
        const modelSize = config.get<string>('sttEngine', 'whisper-base');

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
    if (userTier === ServiceTier.PRO || userTier === ServiceTier.ENTERPRISE) {
      registerProCommands(context);
    }

    if (userTier === ServiceTier.ENTERPRISE) {
      registerEnterpriseCommands(context);
    }

    // Step 7: Preload AI services in background (after 2 seconds)
    preloadAIServices();

    // Step 8: Record activation complete
    const activationTime = Date.now() - activationStart;
    telemetry.recordEvent('activation', {
      duration: activationTime,
      userTier,
      servicesLoaded: core.length + tier.length,
    });

    console.log(`[VoiceFlow] Activation complete in ${activationTime}ms`);

    // Step 9: Log service statistics
    const stats = getServiceStats();
    console.log('[VoiceFlow] Service stats:', stats);

    // Step 10: Show welcome message (if first time)
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
      showWelcomeMessage(context, userTier);
      await context.globalState.update('hasShownWelcome', true);
    }

  } catch (error) {
    console.error('[VoiceFlow] Activation failed:', error);
    vscode.window.showErrorMessage(
      `VoiceFlow Pro failed to activate: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    // Record failure for telemetry
    try {
      const telemetry = await getTelemetryService();
      telemetry.recordEvent('activation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - activationStart,
      });
    } catch {
      // Ignore telemetry errors during activation failure
    }
  }
}

/**
 * Register core commands (available to all users)
 */
function registerCoreCommands(context: vscode.ExtensionContext) {
  // Toggle listening
  context.subscriptions.push(
    vscode.commands.registerCommand('voiceflow.toggleListening', async () => {
      const voice = await (await import('./services/LazyServices')).getVoiceRecognitionService();
      await voice.toggleListening();
    })
  );

  // Open dashboard
  context.subscriptions.push(
    vscode.commands.registerCommand('voiceflow.openDashboard', async () => {
      // Dashboard provider is lightweight, load on-demand
      const { VoiceFlowDashboardProvider } = await import('./providers/VoiceFlowDashboardProvider');
      const telemetry = await getTelemetryService();
      const dashboard = new VoiceFlowDashboardProvider(context.extensionUri, telemetry);
      // Show dashboard
    })
  );

  // Show commands
  context.subscriptions.push(
    vscode.commands.registerCommand('voiceflow.showCommands', async () => {
      const suggestions = await (await import('./services/LazyServices')).getCommandSuggestionsService();
      await suggestions.showCommandPalette();
    })
  );

  console.log('[VoiceFlow] Registered core commands');
}

/**
 * Register Pro tier commands
 */
function registerProCommands(context: vscode.ExtensionContext) {
  // Cloud sync
  context.subscriptions.push(
    vscode.commands.registerCommand('voiceflow.syncToCloud', async () => {
      const sync = await (await import('./services/LazyServices')).getCloudSyncService();
      await sync.syncNow();
      vscode.window.showInformationMessage('Cloud sync completed');
    })
  );

  // Voice training
  context.subscriptions.push(
    vscode.commands.registerCommand('voiceflow.trainVoiceModel', async () => {
      const training = await (await import('./services/LazyServices')).getVoiceTrainingService();
      await training.startTrainingSession();
    })
  );

  console.log('[VoiceFlow] Registered Pro commands');
}

/**
 * Register Enterprise tier commands
 */
function registerEnterpriseCommands(context: vscode.ExtensionContext) {
  // Team collaboration
  context.subscriptions.push(
    vscode.commands.registerCommand('voiceflow.shareWithTeam', async () => {
      const team = await (await import('./services/LazyServices')).getTeamCollaborationService();
      await team.shareCurrentFile();
    })
  );

  console.log('[VoiceFlow] Registered Enterprise commands');
}

/**
 * Show welcome message based on user tier
 */
function showWelcomeMessage(context: vscode.ExtensionContext, tier: ServiceTier) {
  const message = tier === ServiceTier.FREE
    ? 'Welcome to VoiceFlow Pro! Press Ctrl+Shift+V to start voice coding.'
    : tier === ServiceTier.PRO
    ? 'Welcome to VoiceFlow Pro! Your Pro features are ready. Press Ctrl+Shift+V to start.'
    : 'Welcome to VoiceFlow Pro Enterprise! All features activated. Press Ctrl+Shift+V to start.';

  vscode.window.showInformationMessage(message, 'Open Dashboard').then((selection) => {
    if (selection === 'Open Dashboard') {
      vscode.commands.executeCommand('voiceflow.openDashboard');
    }
  });
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('[VoiceFlow] Extension deactivating...');

  // Record deactivation for telemetry
  getTelemetryService().then((telemetry) => {
    const stats = getServiceStats();
    telemetry.recordEvent('deactivation', {
      servicesLoaded: stats.loaded,
      averageLoadTime: stats.averageLoadTime,
    });
  });
}
