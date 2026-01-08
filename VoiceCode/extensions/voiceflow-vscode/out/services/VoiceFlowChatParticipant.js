"use strict";
/**
 * VoiceFlow Chat Participant
 * Implements VS Code's Chat Participant API for native GitHub Copilot integration
 * Allows users to interact with VoiceFlow via @voiceflow in chat
 *
 * Based on: https://code.visualstudio.com/api/extension-guides/chat
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
exports.VoiceFlowChatParticipant = void 0;
const vscode = __importStar(require("vscode"));
/**
 * VoiceFlow Chat Participant Service
 * Provides @voiceflow chat participant for VS Code chat integration
 */
class VoiceFlowChatParticipant {
    static PARTICIPANT_ID = 'voiceflow-pro.voiceflow';
    static PARTICIPANT_NAME = 'voiceflow';
    participant;
    mcpService;
    aiBridge;
    telemetry;
    disposables = [];
    constructor(context, mcpService, aiBridge, telemetry) {
        this.mcpService = mcpService;
        this.aiBridge = aiBridge;
        this.telemetry = telemetry;
        this.registerParticipant(context);
    }
    /**
     * Register the chat participant with VS Code
     */
    registerParticipant(context) {
        // Create the chat participant
        this.participant = vscode.chat.createChatParticipant(VoiceFlowChatParticipant.PARTICIPANT_ID, this.handleChatRequest.bind(this));
        // Set participant properties
        this.participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icon.png');
        // Register follow-up provider for suggested questions
        this.participant.followupProvider = {
            provideFollowups: this.provideFollowups.bind(this)
        };
        // Track feedback for telemetry
        this.participant.onDidReceiveFeedback((feedback) => {
            this.telemetry.recordEvent('chat_feedback', {
                kind: feedback.kind === vscode.ChatResultFeedbackKind.Helpful ? 'helpful' : 'unhelpful',
            });
        });
        this.disposables.push(this.participant);
    }
    /**
     * Handle incoming chat requests
     */
    async handleChatRequest(request, context, stream, token) {
        const startTime = Date.now();
        const result = {
            metadata: {}
        };
        try {
            // Handle different commands
            if (request.command === 'voice') {
                return await this.handleVoiceCommand(request, stream, token, result);
            }
            else if (request.command === 'explain') {
                return await this.handleExplainCommand(request, stream, token, result);
            }
            else if (request.command === 'refactor') {
                return await this.handleRefactorCommand(request, stream, token, result);
            }
            else if (request.command === 'test') {
                return await this.handleTestCommand(request, stream, token, result);
            }
            else if (request.command === 'tools') {
                return await this.handleToolsCommand(request, stream, token, result);
            }
            else {
                // Default: general conversation
                return await this.handleGeneralRequest(request, context, stream, token, result);
            }
        }
        catch (error) {
            stream.markdown(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.errorDetails = {
                message: error instanceof Error ? error.message : 'Unknown error'
            };
            return result;
        }
        finally {
            result.metadata.duration = Date.now() - startTime;
            this.telemetry.recordEvent('chat_request_completed', {
                command: request.command || 'general',
                duration: result.metadata.duration,
            });
        }
    }
    /**
     * Handle /voice command - Execute voice-like commands
     */
    async handleVoiceCommand(request, stream, token, result) {
        result.metadata.command = 'voice';
        stream.progress('Processing voice command...');
        const prompt = request.prompt;
        // Parse and execute voice command
        const aiRequest = {
            type: 'chat',
            prompt: `Execute this as a voice command for VS Code: "${prompt}". 
               Respond with the action taken and any code changes made.`,
            options: { tools: true }
        };
        const response = await this.aiBridge.sendRequest(aiRequest);
        if (response.success) {
            stream.markdown(`🎤 **Voice Command Executed**\n\n${response.content || 'Command processed successfully.'}`);
            if (response.toolCalls && response.toolCalls.length > 0) {
                stream.markdown('\n\n**Tools Used:**');
                for (const tool of response.toolCalls) {
                    stream.markdown(`\n- \`${tool.name}\``);
                    result.metadata.toolsUsed = result.metadata.toolsUsed || [];
                    result.metadata.toolsUsed.push(tool.name);
                }
            }
        }
        else {
            stream.markdown(`⚠️ Command could not be executed: ${response.error}`);
        }
        result.metadata.provider = response.provider;
        return result;
    }
    /**
     * Handle /explain command - Explain selected code
     */
    async handleExplainCommand(request, stream, token, result) {
        result.metadata.command = 'explain';
        stream.progress('Analyzing code...');
        // Get current editor selection
        const editor = vscode.window.activeTextEditor;
        const code = editor?.document.getText(editor.selection) || request.prompt;
        const language = editor?.document.languageId || 'unknown';
        const aiRequest = {
            type: 'explain',
            prompt: `Explain this ${language} code in detail:\n\n${code}\n\n${request.prompt}`,
            context: { code, language }
        };
        const response = await this.aiBridge.sendRequest(aiRequest);
        if (response.success && response.content) {
            stream.markdown(`## 📖 Code Explanation\n\n${response.content}`);
        }
        else {
            stream.markdown(`Could not explain the code: ${response.error}`);
        }
        result.metadata.provider = response.provider;
        return result;
    }
    /**
     * Handle /refactor command - Suggest code refactoring
     */
    async handleRefactorCommand(request, stream, token, result) {
        result.metadata.command = 'refactor';
        stream.progress('Analyzing code for refactoring opportunities...');
        const editor = vscode.window.activeTextEditor;
        const code = editor?.document.getText(editor.selection) || '';
        const language = editor?.document.languageId || 'unknown';
        const aiRequest = {
            type: 'refactor',
            prompt: `Refactor this ${language} code. ${request.prompt}\n\nCode:\n${code}`,
            context: { code, language }
        };
        const response = await this.aiBridge.sendRequest(aiRequest);
        if (response.success && response.content) {
            stream.markdown(`## 🔧 Refactoring Suggestions\n\n${response.content}`);
            // Add button to apply changes
            stream.button({
                command: 'voiceflow.applyRefactoring',
                title: 'Apply Refactoring',
                arguments: [response.code || response.content]
            });
        }
        else {
            stream.markdown(`Could not generate refactoring suggestions: ${response.error}`);
        }
        result.metadata.provider = response.provider;
        return result;
    }
    /**
     * Handle /test command - Generate tests
     */
    async handleTestCommand(request, stream, token, result) {
        result.metadata.command = 'test';
        stream.progress('Generating tests...');
        const editor = vscode.window.activeTextEditor;
        const code = editor?.document.getText(editor.selection) || '';
        const language = editor?.document.languageId || 'unknown';
        const aiRequest = {
            type: 'test',
            prompt: `Generate comprehensive unit tests for this ${language} code. ${request.prompt}\n\nCode:\n${code}`,
            context: { code, language }
        };
        const response = await this.aiBridge.sendRequest(aiRequest);
        if (response.success && response.content) {
            stream.markdown(`## 🧪 Generated Tests\n\n${response.content}`);
            stream.button({
                command: 'voiceflow.createTestFile',
                title: 'Create Test File',
                arguments: [response.code || response.content, language]
            });
        }
        else {
            stream.markdown(`Could not generate tests: ${response.error}`);
        }
        result.metadata.provider = response.provider;
        return result;
    }
    /**
     * Handle /tools command - Show available tools
     */
    async handleToolsCommand(request, stream, token, result) {
        result.metadata.command = 'tools';
        const tools = this.mcpService.listTools();
        stream.markdown('## 🔧 Available VoiceFlow Tools\n\n');
        for (const tool of tools) {
            stream.markdown(`### \`${tool.name}\`\n`);
            stream.markdown(`${tool.description}\n\n`);
            if (tool.inputSchema.properties) {
                stream.markdown('**Parameters:**\n');
                for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
                    const required = tool.inputSchema.required?.includes(key) ? '*(required)*' : '*(optional)*';
                    stream.markdown(`- \`${key}\` ${required}: ${prop.description}\n`);
                }
                stream.markdown('\n');
            }
        }
        stream.markdown(`\n---\n*Total: ${tools.length} tools available*`);
        return result;
    }
    /**
     * Handle general chat requests
     */
    async handleGeneralRequest(request, context, stream, token, result) {
        stream.progress('Thinking...');
        // Build context from chat history
        const history = context.history
            .filter(h => h instanceof vscode.ChatRequestTurn || h instanceof vscode.ChatResponseTurn)
            .slice(-10); // Last 10 messages
        // Get workspace context
        const editor = vscode.window.activeTextEditor;
        const workspaceContext = editor ? {
            filePath: editor.document.fileName,
            language: editor.document.languageId,
            selection: editor.document.getText(editor.selection),
        } : undefined;
        const aiRequest = {
            type: 'chat',
            prompt: request.prompt,
            context: {
                code: workspaceContext?.selection,
                language: workspaceContext?.language,
                filePath: workspaceContext?.filePath,
            },
            options: { tools: true }
        };
        const response = await this.aiBridge.sendRequest(aiRequest);
        if (response.success && response.content) {
            stream.markdown(response.content);
            // Handle tool calls if present
            if (response.toolCalls && response.toolCalls.length > 0) {
                for (const toolCall of response.toolCalls) {
                    if (toolCall.result) {
                        stream.markdown(`\n\n**Tool Result (${toolCall.name}):**\n`);
                        if (toolCall.result.success) {
                            stream.markdown(`\`\`\`\n${toolCall.result.output}\n\`\`\``);
                        }
                        else {
                            stream.markdown(`⚠️ ${toolCall.result.error}`);
                        }
                    }
                    result.metadata.toolsUsed = result.metadata.toolsUsed || [];
                    result.metadata.toolsUsed.push(toolCall.name);
                }
            }
        }
        else {
            stream.markdown(`I couldn't process your request: ${response.error}`);
        }
        result.metadata.provider = response.provider;
        return result;
    }
    /**
     * Provide follow-up suggestions after responses
     */
    provideFollowups(result, context, token) {
        const followups = [];
        if (result.metadata.command === 'explain') {
            followups.push({
                prompt: 'Can you show me an example of how to use this?',
                label: 'Show usage example'
            });
            followups.push({
                prompt: 'What are the potential issues with this code?',
                label: 'Identify potential issues'
            });
        }
        else if (result.metadata.command === 'refactor') {
            followups.push({
                prompt: 'Can you also add documentation?',
                label: 'Add documentation'
            });
            followups.push({
                prompt: 'What tests should I write for the refactored code?',
                label: 'Suggest tests'
            });
        }
        else if (result.metadata.command === 'test') {
            followups.push({
                prompt: 'Add more edge case tests',
                label: 'Add edge cases'
            });
            followups.push({
                prompt: 'Generate integration tests instead',
                label: 'Integration tests'
            });
        }
        else if (result.metadata.command === 'voice') {
            followups.push({
                prompt: 'What other voice commands are available?',
                label: 'List voice commands'
            });
        }
        else {
            // General follow-ups
            followups.push({
                prompt: 'Tell me more',
                label: 'Elaborate'
            });
            followups.push({
                prompt: 'Show me the code',
                label: 'Show code'
            });
        }
        return followups;
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.participant = undefined;
    }
}
exports.VoiceFlowChatParticipant = VoiceFlowChatParticipant;
exports.default = VoiceFlowChatParticipant;
//# sourceMappingURL=VoiceFlowChatParticipant.js.map