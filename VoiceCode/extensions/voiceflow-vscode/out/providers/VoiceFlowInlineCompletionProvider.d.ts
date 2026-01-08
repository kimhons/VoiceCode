/**
 * VoiceFlow Inline Completion Provider
 * Provides ghost text suggestions like Copilot
 * Critical feature for Phase 2: Feature Parity
 */
import * as vscode from 'vscode';
/**
 * Completion suggestion with metadata
 */
export interface CompletionSuggestion {
    text: string;
    confidence: number;
    source: 'voice' | 'ai' | 'context';
    metadata?: Record<string, unknown>;
}
/**
 * Voice context for completions
 */
export interface VoiceContext {
    lastTranscript: string | null;
    timestamp: number;
    isActive: boolean;
}
/**
 * VoiceFlow Inline Completion Provider
 * Implements VS Code's InlineCompletionItemProvider for ghost text suggestions
 */
export declare class VoiceFlowInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private voiceContext;
    private config;
    private completionCache;
    private readonly cacheTimeout;
    private readonly _onCompletionAccepted;
    private readonly _onCompletionRejected;
    readonly onCompletionAccepted: vscode.Event<CompletionSuggestion>;
    readonly onCompletionRejected: vscode.Event<CompletionSuggestion>;
    constructor(config: vscode.WorkspaceConfiguration);
    /**
     * Update voice context from voice recognition
     */
    updateVoiceContext(transcript: string): void;
    /**
     * Clear voice context
     */
    clearVoiceContext(): void;
    /**
     * Provide inline completion items
     */
    provideInlineCompletionItems(document: vscode.TextDocument, position: vscode.Position, context: vscode.InlineCompletionContext, token: vscode.CancellationToken): Promise<vscode.InlineCompletionList | null>;
    /**
     * Get suggestions based on context
     */
    private getSuggestions;
    /**
     * Get voice-triggered suggestion
     */
    private getVoiceTriggeredSuggestion;
    /**
     * Get context-based suggestions
     */
    private getContextSuggestions;
    /**
     * Parse code generation intent from transcript
     */
    private parseCodeIntent;
    /**
     * Generate code from intent
     */
    private generateCodeFromIntent;
    /**
     * Get common code patterns for a language
     */
    private getCommonPatterns;
    /**
     * Generate cache key
     */
    private getCacheKey;
    /**
     * Accept a completion
     */
    acceptCompletion(suggestion: CompletionSuggestion): void;
    /**
     * Reject a completion
     */
    rejectCompletion(suggestion: CompletionSuggestion): void;
    /**
     * Clear completion cache
     */
    clearCache(): void;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default VoiceFlowInlineCompletionProvider;
//# sourceMappingURL=VoiceFlowInlineCompletionProvider.d.ts.map