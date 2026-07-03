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
/**
 * Extension activation
 * Called when extension is activated (onStartupFinished)
 */
export declare function activate(context: vscode.ExtensionContext): Promise<void>;
/**
 * Extension deactivation
 */
export declare function deactivate(): void;
//# sourceMappingURL=extension.optimized.d.ts.map