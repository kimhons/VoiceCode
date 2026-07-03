/**
 * Tool Chain Executor
 * Enables tool chaining, parallel execution, and retry logic
 * Orchestrates complex multi-tool workflows
 */
import * as vscode from 'vscode';
import { MCPIntegrationService, MCPToolResult } from './MCPIntegrationService';
import { TelemetryService } from './TelemetryService';
/**
 * Tool execution step
 */
export interface ToolStep {
    toolName: string;
    params: Record<string, any>;
    dependsOn?: string[];
    id: string;
    retryOnFailure?: boolean;
    maxRetries?: number;
}
/**
 * Tool chain definition
 */
export interface ToolChain {
    id: string;
    name: string;
    description: string;
    steps: ToolStep[];
    parallel?: boolean;
}
/**
 * Execution result
 */
export interface ChainExecutionResult {
    chainId: string;
    success: boolean;
    results: Map<string, MCPToolResult>;
    errors: Map<string, Error>;
    duration: number;
    stepsExecuted: number;
    stepsSkipped: number;
}
/**
 * Tool Chain Executor
 * Manages complex tool execution workflows
 */
export declare class ToolChainExecutor implements vscode.Disposable {
    private mcpService;
    private telemetry;
    private config;
    private disposables;
    private readonly _onStepStarted;
    private readonly _onStepCompleted;
    private readonly _onStepFailed;
    private readonly _onChainCompleted;
    readonly onStepStarted: vscode.Event<{
        chainId: string;
        stepId: string;
    }>;
    readonly onStepCompleted: vscode.Event<{
        chainId: string;
        stepId: string;
        result: MCPToolResult;
    }>;
    readonly onStepFailed: vscode.Event<{
        chainId: string;
        stepId: string;
        error: Error;
    }>;
    readonly onChainCompleted: vscode.Event<ChainExecutionResult>;
    constructor(mcpService: MCPIntegrationService, config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Execute a tool chain
     */
    executeChain(chain: ToolChain): Promise<ChainExecutionResult>;
    /**
     * Execute steps sequentially
     */
    private executeSequential;
    /**
     * Execute steps in parallel where possible
     */
    private executeParallel;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Check if step dependencies are met
     */
    private areDependenciesMet;
    /**
     * Resolve parameters with dependency results
     */
    private resolveParameters;
    /**
     * Create a simple chain from tool names
     */
    createSimpleChain(name: string, toolCalls: Array<{
        tool: string;
        params: Record<string, any>;
    }>): ToolChain;
    /**
     * Create a parallel chain
     */
    createParallelChain(name: string, toolCalls: Array<{
        tool: string;
        params: Record<string, any>;
    }>): ToolChain;
    /**
     * Utility delay function
     */
    private delay;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default ToolChainExecutor;
//# sourceMappingURL=ToolChainExecutor.d.ts.map