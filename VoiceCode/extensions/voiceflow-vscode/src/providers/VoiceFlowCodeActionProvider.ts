/**
 * VoiceFlow Code Action Provider
 * Provides quick fixes and refactoring actions via voice commands
 * Critical feature for Phase 2: Feature Parity
 */

import * as vscode from 'vscode';

/**
 * Code action types
 */
export type CodeActionType = 
  | 'voiceflow.fix'
  | 'voiceflow.refactor'
  | 'voiceflow.explain'
  | 'voiceflow.test'
  | 'voiceflow.document';

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
export class VoiceFlowCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor,
    vscode.CodeActionKind.RefactorExtract,
    vscode.CodeActionKind.RefactorInline,
  ];

  private config: vscode.WorkspaceConfiguration;
  private pendingActions: Map<string, VoiceAction> = new Map();

  // Event emitters
  private readonly _onActionExecuted = new vscode.EventEmitter<VoiceAction>();
  public readonly onActionExecuted = this._onActionExecuted.event;

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
  }

  /**
   * Provide code actions for a given range
   */
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.CodeAction[] | undefined {
    const actions: vscode.CodeAction[] = [];

    // Check if code actions are enabled
    if (!this.config.get<boolean>('codeActions.enabled', true)) {
      return undefined;
    }

    // Add fix actions for diagnostics
    if (context.diagnostics.length > 0) {
      for (const diagnostic of context.diagnostics) {
        const fixAction = this.createFixAction(document, diagnostic);
        if (fixAction) {
          actions.push(fixAction);
        }
      }
    }

    // Add refactor actions for selection
    if (!range.isEmpty) {
      actions.push(...this.createRefactorActions(document, range));
    }

    // Add voice-specific actions
    actions.push(...this.createVoiceActions(document, range));

    return actions;
  }

  /**
   * Create a fix action for a diagnostic
   */
  private createFixAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | null {
    const action = new vscode.CodeAction(
      `VoiceFlow: Fix "${diagnostic.message}"`,
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'voiceflow.fixDiagnostic',
      title: 'Fix with VoiceFlow AI',
      arguments: [document.uri, diagnostic],
    };

    action.diagnostics = [diagnostic];
    action.isPreferred = false;

    return action;
  }

  /**
   * Create refactor actions for a selection
   */
  private createRefactorActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const selectedText = document.getText(range);

    // Only show refactor options for meaningful selections
    if (selectedText.length < 3) {
      return actions;
    }

    // Extract to function/method
    const extractAction = new vscode.CodeAction(
      'VoiceFlow: Extract to function',
      vscode.CodeActionKind.RefactorExtract
    );
    extractAction.command = {
      command: 'voiceflow.extractToFunction',
      title: 'Extract to function',
      arguments: [document.uri, range],
    };
    actions.push(extractAction);

    // Refactor with AI
    const refactorAction = new vscode.CodeAction(
      'VoiceFlow: Refactor with AI',
      vscode.CodeActionKind.Refactor
    );
    refactorAction.command = {
      command: 'voiceflow.refactorWithAI',
      title: 'Refactor with AI',
      arguments: [document.uri, range],
    };
    actions.push(refactorAction);

    // Generate tests
    const testAction = new vscode.CodeAction(
      'VoiceFlow: Generate tests',
      vscode.CodeActionKind.Refactor
    );
    testAction.command = {
      command: 'voiceflow.generateTests',
      title: 'Generate tests',
      arguments: [document.uri, range],
    };
    actions.push(testAction);

    return actions;
  }

  /**
   * Create voice-specific actions
   */
  private createVoiceActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // Explain code action
    const explainAction = new vscode.CodeAction(
      'VoiceFlow: Explain this code',
      vscode.CodeActionKind.Empty
    );
    explainAction.command = {
      command: 'voiceflow.explainCode',
      title: 'Explain code',
      arguments: [document.uri, range],
    };
    actions.push(explainAction);

    // Add documentation action
    const docAction = new vscode.CodeAction(
      'VoiceFlow: Add documentation',
      vscode.CodeActionKind.Empty
    );
    docAction.command = {
      command: 'voiceflow.addDocumentation',
      title: 'Add documentation',
      arguments: [document.uri, range],
    };
    actions.push(docAction);

    return actions;
  }

  /**
   * Register a pending voice action
   */
  registerPendingAction(id: string, action: VoiceAction): void {
    this.pendingActions.set(id, action);
  }

  /**
   * Execute a pending action
   */
  executePendingAction(id: string): void {
    const action = this.pendingActions.get(id);
    if (action) {
      this._onActionExecuted.fire(action);
      this.pendingActions.delete(id);
    }
  }

  /**
   * Clear all pending actions
   */
  clearPendingActions(): void {
    this.pendingActions.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this._onActionExecuted.dispose();
    this.pendingActions.clear();
  }
}
