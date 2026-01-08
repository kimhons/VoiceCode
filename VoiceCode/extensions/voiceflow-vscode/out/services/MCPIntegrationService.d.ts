/**
 * Model Context Protocol (MCP) Integration Service
 * Provides tool integration capabilities for AI coding assistants
 * Enables VoiceFlow PRO to expose tools to Claude, OpenAI, and other AI providers
 */
import * as vscode from 'vscode';
/**
 * MCP Tool Definition
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
            default?: any;
        }>;
        required?: string[];
    };
    handler: (params: Record<string, any>) => Promise<MCPToolResult>;
}
export interface MCPToolResult {
    success: boolean;
    output?: string;
    error?: string;
    data?: any;
}
export interface MCPResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    fetch: () => Promise<string>;
}
export interface MCPPrompt {
    name: string;
    description: string;
    arguments?: Array<{
        name: string;
        description: string;
        required?: boolean;
    }>;
    generate: (args: Record<string, string>) => Promise<string>;
}
/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
    name: string;
    version: string;
    capabilities: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
    };
}
/**
 * MCP Event Types
 */
export interface MCPEvents {
    toolRegistered: MCPTool;
    resourceRegistered: MCPResource;
    promptRegistered: MCPPrompt;
    toolExecuted: {
        tool: string;
        params: Record<string, any>;
        result: MCPToolResult;
    };
    toolError: {
        tool: string;
        params: Record<string, any>;
        error: any;
    };
}
/**
 * MCP Integration Service
 * Implements the Model Context Protocol for AI tool integration
 */
export declare class MCPIntegrationService {
    private config;
    private tools;
    private resources;
    private prompts;
    private isRunning;
    private serverConfig;
    private readonly _onToolRegistered;
    private readonly _onResourceRegistered;
    private readonly _onPromptRegistered;
    private readonly _onToolExecuted;
    private readonly _onToolError;
    readonly onToolRegistered: vscode.Event<MCPTool>;
    readonly onResourceRegistered: vscode.Event<MCPResource>;
    readonly onPromptRegistered: vscode.Event<MCPPrompt>;
    readonly onToolExecuted: vscode.Event<{
        tool: string;
        params: Record<string, any>;
        result: MCPToolResult;
    }>;
    readonly onToolError: vscode.Event<{
        tool: string;
        params: Record<string, any>;
        error: any;
    }>;
    constructor(config: vscode.WorkspaceConfiguration);
    /**
     * Register built-in VoiceFlow PRO tools
     */
    private registerBuiltInTools;
    /**
     * Register built-in prompts for AI assistants
     */
    private registerBuiltInPrompts;
    /**
     * Register a new tool
     */
    registerTool(tool: MCPTool): void;
    /**
     * Register a new resource
     */
    registerResource(resource: MCPResource): void;
    /**
     * Register a new prompt
     */
    registerPrompt(prompt: MCPPrompt): void;
    /**
     * List all available tools
     */
    listTools(): MCPTool[];
    /**
     * List all available resources
     */
    listResources(): MCPResource[];
    /**
     * List all available prompts
     */
    listPrompts(): MCPPrompt[];
    /**
     * Execute a tool by name
     */
    executeTool(toolName: string, params: Record<string, any>): Promise<MCPToolResult>;
    /**
     * Get a prompt by name and generate it with arguments
     */
    generatePrompt(promptName: string, args: Record<string, string>): Promise<string | null>;
    /**
     * Handle file operations
     */
    private handleFileOperation;
    /**
     * Handle code analysis
     */
    private handleCodeAnalysis;
    /**
     * Handle codebase search
     */
    private handleCodebaseSearch;
    /**
     * Handle terminal commands
     */
    private handleTerminalCommand;
    /**
     * Handle Git operations
     */
    private handleGitOperation;
    /**
     * Get server configuration for MCP clients
     */
    getServerConfig(): MCPServerConfig;
    /**
     * Export tools in OpenAI function calling format
     */
    exportToolsAsOpenAIFunctions(): Array<{
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: any;
        };
    }>;
    /**
     * Export tools in Anthropic tool format
     */
    exportToolsAsAnthropicTools(): Array<{
        name: string;
        description: string;
        input_schema: any;
    }>;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default MCPIntegrationService;
//# sourceMappingURL=MCPIntegrationService.d.ts.map