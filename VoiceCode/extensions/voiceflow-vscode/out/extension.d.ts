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
//# sourceMappingURL=extension.d.ts.map