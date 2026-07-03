/**
 * Language Model Tools Service
 * Implements VS Code's Language Model Tools API for native AI tool calling
 * Allows VoiceFlow tools to be used by any VS Code AI extension
 *
 * Based on: https://code.visualstudio.com/api/extension-guides/language-model
 */
import * as vscode from 'vscode';
import { MCPIntegrationService } from './MCPIntegrationService';
import { TelemetryService } from './TelemetryService';
/**
 * Language Model Tools Service
 * Registers VoiceFlow tools with VS Code's Language Model API
 */
export declare class LanguageModelToolsService implements vscode.Disposable {
    private mcpService;
    private telemetry;
    private context;
    private registeredTools;
    private disposables;
    private builtInToolHandlers;
    constructor(context: vscode.ExtensionContext, mcpService: MCPIntegrationService, telemetry: TelemetryService);
    /**
     * Initialize built-in tool handlers for LM tools defined in package.json
     */
    private initializeBuiltInToolHandlers;
    /**
     * Register all tools (MCP tools + built-in LM tools)
     */
    private registerAllTools;
    /**
     * Register an MCP tool with VS Code LM API
     */
    private registerMcpTool;
    /**
     * Register a built-in tool with VS Code LM API
     */
    private registerBuiltInTool;
    /**
     * Common tool invocation wrapper with telemetry
     */
    private invokeToolWithResult;
    /**
     * Create a text result for LM tool
     */
    private createTextResult;
    /**
     * Prepare tool invocation with optional confirmation
     */
    private prepareInvocation;
    /**
     * Setup listener for new MCP tool registrations
     */
    private setupToolUpdateListener;
    /**
     * Extract selected code into a new function
     */
    private handleExtractFunction;
    /**
     * Rename a symbol across the workspace
     */
    private handleRenameSymbol;
    /**
     * Optimize imports in the current file
     */
    private handleOptimizeImports;
    /**
     * Generate unit tests for code
     */
    private handleGenerateTests;
    private generateTestTemplate;
    /**
     * Run tests
     */
    private handleRunTests;
    /**
     * Create a test file for a source file
     */
    private handleCreateTestFile;
    /**
     * Generate JSDoc/TSDoc comments
     */
    private handleGenerateJsdoc;
    /**
     * Explain code in detail
     */
    private handleExplainCode;
    /**
     * Generate README sections
     */
    private handleGenerateReadme;
    private handleGitCommit;
    private handleGitBranch;
    private handleGitDiff;
    private handleAnalyzeDependencies;
    private handleAnalyzeComplexity;
    private handleFindPatterns;
    private handleVoiceToCode;
    private handleVoiceNavigate;
    private handleVoiceEdit;
    private handleMultiFileEdit;
    private handleContextGather;
    private handleExecuteCommand;
    private handleInsertCode;
    private handleReadFile;
    private handleSearchWorkspace;
    private handleTerminalRun;
    private handleDebugStart;
    private handleFindReferences;
    private handleTypeHierarchy;
    private handleQuickFix;
    private handleSnippetCreate;
    /**
     * Get tool schemas for external use
     */
    getToolSchemas(): Array<{
        name: string;
        description: string;
        inputSchema: object;
    }>;
    /**
     * Check if Language Model API is available
     */
    static isAvailable(): boolean;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default LanguageModelToolsService;
//# sourceMappingURL=LanguageModelToolsService.d.ts.map