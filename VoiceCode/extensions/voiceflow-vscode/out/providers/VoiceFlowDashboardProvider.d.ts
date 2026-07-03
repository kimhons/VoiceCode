/**
 * VoiceFlow Dashboard Provider
 * Implements VS Code's WebviewViewProvider for rich dashboard UI
 * Provides visual controls for voice recognition, command history, and settings
 */
import * as vscode from 'vscode';
import { TelemetryService } from '../services/TelemetryService';
/**
 * VoiceFlow Dashboard View Provider
 */
export declare class VoiceFlowDashboardProvider implements vscode.WebviewViewProvider {
    static readonly viewType = "voiceflow.dashboard";
    private view?;
    private extensionUri;
    private telemetry;
    private state;
    constructor(extensionUri: vscode.Uri, telemetry: TelemetryService);
    /**
     * Resolve the webview view
     */
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void | Thenable<void>;
    /**
     * Update the webview with current state
     */
    updateView(): void;
    /**
     * Set listening state
     */
    setListening(isListening: boolean): void;
    /**
     * Add a command to history
     */
    addCommand(command: string, success: boolean): void;
    /**
     * Generate HTML content for the webview
     */
    private getHtmlContent;
    private getHeaderSection;
    private getControlsSection;
    private getStatsSection;
    private getCommandHistorySection;
    private getInlineStyles;
    private getInlineScript;
    /**
     * Generate a random nonce for CSP
     */
    private getNonce;
}
export default VoiceFlowDashboardProvider;
//# sourceMappingURL=VoiceFlowDashboardProvider.d.ts.map