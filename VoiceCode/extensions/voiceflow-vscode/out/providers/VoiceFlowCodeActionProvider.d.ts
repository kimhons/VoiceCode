/**
 * VoiceFlow Code Action Provider
 * Provides quick fixes and refactoring actions via voice commands
 * Critical feature for Phase 2: Feature Parity
 */
import * as vscode from 'vscode';
/**
 * Code action types
 */
export type CodeActionType = 'voiceflow.fix' | 'voiceflow.refactor' | 'voiceflow.explain' | 'voiceflow.test' | 'voiceflow.document';
/**
 * Voice-triggered action
 */
export interface VoiceAction {
    type: CodeActionType;
    title: string;
    description: string;
    range: vscode.Range;
    diagnostics?: vscode.Diagnostic[];
}
/**
 * VoiceFlow Code Action Provider
 * Implements VS Code's CodeActionProvider for quick fixes
 */
export declare class VoiceFlowCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds: vscode.CodeActionKind[];
    private config;
    private pendingActions;
    private readonly _onActionExecuted;
    readonly onActionExecuted: vscode.Event<VoiceAction>;
    constructor(config: vscode.WorkspaceConfiguration);
    /**
     * Provide code actions for a given range
     */
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, _token: vscode.CancellationToken): vscode.CodeAction[] | undefined;
    /**
     * Create a fix action for a diagnostic
     */
    private createFixAction;
    /**
     * Create refactor actions for a selection
     */
    private createRefactorActions;
    /**
     * Create voice-specific actions
     */
    private createVoiceActions;
    /**
     * Register a pending voice action
     */
    registerPendingAction(id: string, action: VoiceAction): void;
    /**
     * Execute a pending action
     */
    executePendingAction(id: string): void;
    /**
     * Clear all pending actions
     */
    clearPendingActions(): void;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
//# sourceMappingURL=VoiceFlowCodeActionProvider.d.ts.map