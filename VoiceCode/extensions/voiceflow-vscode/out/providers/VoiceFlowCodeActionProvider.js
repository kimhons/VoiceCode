"use strict";
/**
 * VoiceFlow Code Action Provider
 * Provides quick fixes and refactoring actions via voice commands
 * Critical feature for Phase 2: Feature Parity
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
exports.VoiceFlowCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * VoiceFlow Code Action Provider
 * Implements VS Code's CodeActionProvider for quick fixes
 */
class VoiceFlowCodeActionProvider {
    static providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor,
        vscode.CodeActionKind.RefactorExtract,
        vscode.CodeActionKind.RefactorInline,
    ];
    config;
    pendingActions = new Map();
    // Event emitters
    _onActionExecuted = new vscode.EventEmitter();
    onActionExecuted = this._onActionExecuted.event;
    constructor(config) {
        this.config = config;
    }
    /**
     * Provide code actions for a given range
     */
    provideCodeActions(document, range, context, _token) {
        const actions = [];
        // Check if code actions are enabled
        if (!this.config.get('codeActions.enabled', true)) {
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
    createFixAction(document, diagnostic) {
        const action = new vscode.CodeAction(`VoiceFlow: Fix "${diagnostic.message}"`, vscode.CodeActionKind.QuickFix);
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
    createRefactorActions(document, range) {
        const actions = [];
        const selectedText = document.getText(range);
        // Only show refactor options for meaningful selections
        if (selectedText.length < 3) {
            return actions;
        }
        // Extract to function/method
        const extractAction = new vscode.CodeAction('VoiceFlow: Extract to function', vscode.CodeActionKind.RefactorExtract);
        extractAction.command = {
            command: 'voiceflow.extractToFunction',
            title: 'Extract to function',
            arguments: [document.uri, range],
        };
        actions.push(extractAction);
        // Refactor with AI
        const refactorAction = new vscode.CodeAction('VoiceFlow: Refactor with AI', vscode.CodeActionKind.Refactor);
        refactorAction.command = {
            command: 'voiceflow.refactorWithAI',
            title: 'Refactor with AI',
            arguments: [document.uri, range],
        };
        actions.push(refactorAction);
        // Generate tests
        const testAction = new vscode.CodeAction('VoiceFlow: Generate tests', vscode.CodeActionKind.Refactor);
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
    createVoiceActions(document, range) {
        const actions = [];
        // Explain code action
        const explainAction = new vscode.CodeAction('VoiceFlow: Explain this code', vscode.CodeActionKind.Empty);
        explainAction.command = {
            command: 'voiceflow.explainCode',
            title: 'Explain code',
            arguments: [document.uri, range],
        };
        actions.push(explainAction);
        // Add documentation action
        const docAction = new vscode.CodeAction('VoiceFlow: Add documentation', vscode.CodeActionKind.Empty);
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
    registerPendingAction(id, action) {
        this.pendingActions.set(id, action);
    }
    /**
     * Execute a pending action
     */
    executePendingAction(id) {
        const action = this.pendingActions.get(id);
        if (action) {
            this._onActionExecuted.fire(action);
            this.pendingActions.delete(id);
        }
    }
    /**
     * Clear all pending actions
     */
    clearPendingActions() {
        this.pendingActions.clear();
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this._onActionExecuted.dispose();
        this.pendingActions.clear();
    }
}
exports.VoiceFlowCodeActionProvider = VoiceFlowCodeActionProvider;
//# sourceMappingURL=VoiceFlowCodeActionProvider.js.map