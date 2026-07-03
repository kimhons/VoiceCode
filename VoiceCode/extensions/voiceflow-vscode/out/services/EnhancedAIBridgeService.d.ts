/**
 * Enhanced AI Bridge Service
 * Unified interface for 8 AI service providers with deep integration
 * Supports: Copilot, Cursor, Cline, Aider, Augment, Anthropic, OpenAI, Local LLM
 */
import * as vscode from 'vscode';
import { MCPIntegrationService } from './MCPIntegrationService';
import { CostTrackingService } from './CostTrackingService';
import { CodebaseIndexService } from './CodebaseIndexService';
export type AIProviderType = 'copilot' | 'cursor' | 'cline' | 'aider' | 'augment' | 'anthropic' | 'openai' | 'local';
export interface AIRequest {
    type: 'completion' | 'chat' | 'edit' | 'refactor' | 'explain' | 'test' | 'review';
    prompt: string;
    context?: AIContext;
    options?: AIRequestOptions;
}
export interface AIContext {
    code?: string;
    language?: string;
    filePath?: string;
    selection?: {
        start: number;
        end: number;
    };
}
export interface AIRequestOptions {
    provider?: AIProviderType;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    tools?: boolean;
}
export interface AIToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
}
export interface AIResponse {
    success: boolean;
    content?: string;
    code?: string;
    error?: string;
    provider: AIProviderType;
    model?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    toolCalls?: AIToolCall[];
}
export interface ProviderStatus {
    provider: AIProviderType;
    available: boolean;
    configured: boolean;
    error?: string;
}
/**
 * Enhanced AI Bridge Service
 * Provides unified access to multiple AI providers with deep response capture
 */
export declare class EnhancedAIBridgeService {
    private config;
    private mcpService;
    private providerStatus;
    private preferredProvider;
    private costTracking?;
    private codebaseIndex?;
    private rateLimiter;
    private responseCache;
    private readonly _onProviderChanged;
    private readonly _onRequestStarted;
    private readonly _onRequestCompleted;
    private readonly _onStreamChunk;
    readonly onProviderChanged: vscode.Event<AIProviderType>;
    readonly onRequestStarted: vscode.Event<AIRequest>;
    readonly onRequestCompleted: vscode.Event<AIResponse>;
    readonly onStreamChunk: vscode.Event<{
        chunk: string;
        provider: AIProviderType;
    }>;
    constructor(config?: vscode.WorkspaceConfiguration, mcpService?: MCPIntegrationService, costTracking?: CostTrackingService, codebaseIndex?: CodebaseIndexService);
    /**
     * Detect which AI providers are available
     */
    private detectAvailableProviders;
    /**
     * Send request to the appropriate provider
     */
    sendRequest(request: AIRequest): Promise<AIResponse>;
    /**
     * Get default model for provider
     */
    private getDefaultModel;
    /**
     * Estimate token count
     */
    private estimateTokens;
    /**
     * Send request to GitHub Copilot
     * Uses VS Code Language Model API for full response capture
     */
    private sendToCopilot;
    /**
     * Send request to Cursor
     */
    private sendToCursor;
    /**
     * Send request to Cline (Claude Dev)
     */
    private sendToCline;
    /**
     * Send request to Augment
     */
    private sendToAugment;
    /**
     * Send request to Anthropic Claude API
     */
    private sendToAnthropic;
    /**
     * Send request to OpenAI API
     */
    private sendToOpenAI;
    /**
     * Send request to Aider CLI
     */
    private sendToAider;
    /**
     * Send request to local LLM
     */
    private sendToLocal;
    /**
     * Send request using VS Code Language Model API (works with Copilot, etc.)
     * This captures actual responses from the model
     */
    private sendViaLanguageModelAPI;
    /**
     * Fallback: Send to Copilot via command (no response capture)
     */
    private sendToCopilotViaCommand;
    /**
     * Format prompt for specific provider
     */
    private formatPromptForProvider;
    /**
     * Build Anthropic messages array
     */
    private buildAnthropicMessages;
    /**
     * Build OpenAI messages array
     */
    private buildOpenAIMessages;
    /**
     * Parse Anthropic API response
     */
    private parseAnthropicResponse;
    /**
     * Parse OpenAI API response
     */
    private parseOpenAIResponse;
    /**
     * Get all provider statuses
     */
    getProviderStatuses(): ProviderStatus[];
    /**
     * Set preferred provider
     */
    setPreferredProvider(provider: AIProviderType): void;
    /**
     * Get preferred provider
     */
    getPreferredProvider(): AIProviderType;
    /**
     * Utility delay function
     */
    private delay;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default EnhancedAIBridgeService;
//# sourceMappingURL=EnhancedAIBridgeService.d.ts.map