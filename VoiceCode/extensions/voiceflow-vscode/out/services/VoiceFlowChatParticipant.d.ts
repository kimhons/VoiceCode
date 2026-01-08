/**
 * VoiceFlow Chat Participant
 * Implements VS Code's Chat Participant API for native GitHub Copilot integration
 * Allows users to interact with VoiceFlow via @voiceflow in chat
 *
 * Based on: https://code.visualstudio.com/api/extension-guides/chat
 */
import * as vscode from 'vscode';
import { MCPIntegrationService } from './MCPIntegrationService';
import { EnhancedAIBridgeService } from './EnhancedAIBridgeService';
import { TelemetryService } from './TelemetryService';
/**
 * VoiceFlow Chat Participant Service
 * Provides @voiceflow chat participant for VS Code chat integration
 */
export declare class VoiceFlowChatParticipant implements vscode.Disposable {
    static readonly PARTICIPANT_ID = "voiceflow-pro.voiceflow";
    static readonly PARTICIPANT_NAME = "voiceflow";
    private participant;
    private mcpService;
    private aiBridge;
    private telemetry;
    private disposables;
    constructor(context: vscode.ExtensionContext, mcpService: MCPIntegrationService, aiBridge: EnhancedAIBridgeService, telemetry: TelemetryService);
    /**
     * Register the chat participant with VS Code
     */
    private registerParticipant;
    /**
     * Handle incoming chat requests
     */
    private handleChatRequest;
    /**
     * Handle /voice command - Execute voice-like commands
     */
    private handleVoiceCommand;
    /**
     * Handle /explain command - Explain selected code
     */
    private handleExplainCommand;
    /**
     * Handle /refactor command - Suggest code refactoring
     */
    private handleRefactorCommand;
    /**
     * Handle /test command - Generate tests
     */
    private handleTestCommand;
    /**
     * Handle /tools command - Show available tools
     */
    private handleToolsCommand;
    /**
     * Handle general chat requests
     */
    private handleGeneralRequest;
    /**
     * Provide follow-up suggestions after responses
     */
    private provideFollowups;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default VoiceFlowChatParticipant;
//# sourceMappingURL=VoiceFlowChatParticipant.d.ts.map