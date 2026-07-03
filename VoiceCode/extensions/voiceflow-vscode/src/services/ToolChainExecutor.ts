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
  dependsOn?: string[]; // IDs of steps this depends on
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
  parallel?: boolean; // Execute independent steps in parallel
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
 * Execution context
 */
interface ExecutionContext {
  results: Map<string, MCPToolResult>;
  errors: Map<string, Error>;
  completed: Set<string>;
  inProgress: Set<string>;
}

/**
 * Tool Chain Executor
 * Manages complex tool execution workflows
 */
export class ToolChainExecutor implements vscode.Disposable {
  private mcpService: MCPIntegrationService;
  private telemetry: TelemetryService;
  private config: vscode.WorkspaceConfiguration;
  private disposables: vscode.Disposable[] = [];

  // Event emitters
  private readonly _onStepStarted = new vscode.EventEmitter<{ chainId: string; stepId: string }>();
  private readonly _onStepCompleted = new vscode.EventEmitter<{ chainId: string; stepId: string; result: MCPToolResult }>();
  private readonly _onStepFailed = new vscode.EventEmitter<{ chainId: string; stepId: string; error: Error }>();
  private readonly _onChainCompleted = new vscode.EventEmitter<ChainExecutionResult>();

  public readonly onStepStarted = this._onStepStarted.event;
  public readonly onStepCompleted = this._onStepCompleted.event;
  public readonly onStepFailed = this._onStepFailed.event;
  public readonly onChainCompleted = this._onChainCompleted.event;

  constructor(
    mcpService: MCPIntegrationService,
    config: vscode.WorkspaceConfiguration,
    telemetry: TelemetryService
  ) {
    this.mcpService = mcpService;
    this.config = config;
    this.telemetry = telemetry;
  }

  /**
   * Execute a tool chain
   */
  public async executeChain(chain: ToolChain): Promise<ChainExecutionResult> {
    const startTime = Date.now();
    const context: ExecutionContext = {
      results: new Map(),
      errors: new Map(),
      completed: new Set(),
      inProgress: new Set(),
    };

    console.log(`[ToolChain] Executing chain: ${chain.name} (${chain.steps.length} steps)`);

    try {
      if (chain.parallel) {
        await this.executeParallel(chain, context);
      } else {
        await this.executeSequential(chain, context);
      }

      const duration = Date.now() - startTime;
      const result: ChainExecutionResult = {
        chainId: chain.id,
        success: context.errors.size === 0,
        results: context.results,
        errors: context.errors,
        duration,
        stepsExecuted: context.completed.size,
        stepsSkipped: chain.steps.length - context.completed.size,
      };

      this._onChainCompleted.fire(result);

      this.telemetry.recordEvent('tool_chain_executed', {
        chainId: chain.id,
        success: result.success,
        stepsExecuted: result.stepsExecuted,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: ChainExecutionResult = {
        chainId: chain.id,
        success: false,
        results: context.results,
        errors: context.errors,
        duration,
        stepsExecuted: context.completed.size,
        stepsSkipped: chain.steps.length - context.completed.size,
      };

      this.telemetry.recordError(error as Error, { context: 'tool_chain_execution', chainId: chain.id });
      return result;
    }
  }

  /**
   * Execute steps sequentially
   */
  private async executeSequential(chain: ToolChain, context: ExecutionContext): Promise<void> {
    for (const step of chain.steps) {
      // Check dependencies
      if (!this.areDependenciesMet(step, context)) {
        console.log(`[ToolChain] Skipping step ${step.id} - dependencies not met`);
        continue;
      }

      await this.executeStep(chain.id, step, context);
    }
  }

  /**
   * Execute steps in parallel where possible
   */
  private async executeParallel(chain: ToolChain, context: ExecutionContext): Promise<void> {
    const remaining = new Set(chain.steps);
    
    while (remaining.size > 0) {
      // Find steps that can be executed (dependencies met)
      const ready: ToolStep[] = [];
      
      for (const step of remaining) {
        if (this.areDependenciesMet(step, context) && !context.inProgress.has(step.id)) {
          ready.push(step);
        }
      }

      if (ready.length === 0) {
        // No more steps can be executed
        break;
      }

      // Execute ready steps in parallel
      await Promise.all(
        ready.map(async step => {
          context.inProgress.add(step.id);
          await this.executeStep(chain.id, step, context);
          context.inProgress.delete(step.id);
          remaining.delete(step);
        })
      );
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    chainId: string,
    step: ToolStep,
    context: ExecutionContext
  ): Promise<void> {
    this._onStepStarted.fire({ chainId, stepId: step.id });

    const maxRetries = step.maxRetries || (step.retryOnFailure ? 3 : 1);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Resolve parameters with dependency results
        const resolvedParams = this.resolveParameters(step.params, context);

        // Execute the tool
        const result = await this.mcpService.executeTool(step.toolName, resolvedParams);

        if (result.success) {
          context.results.set(step.id, result);
          context.completed.add(step.id);
          this._onStepCompleted.fire({ chainId, stepId: step.id, result });
          return;
        } else {
          lastError = new Error(result.error || 'Tool execution failed');
        }
      } catch (error) {
        lastError = error as Error;
      }

      if (attempt < maxRetries) {
        console.log(`[ToolChain] Retrying step ${step.id} (attempt ${attempt + 1}/${maxRetries})`);
        await this.delay(1000 * attempt); // Exponential backoff
      }
    }

    // All retries failed
    if (lastError) {
      context.errors.set(step.id, lastError);
      this._onStepFailed.fire({ chainId, stepId: step.id, error: lastError });
    }
  }

  /**
   * Check if step dependencies are met
   */
  private areDependenciesMet(step: ToolStep, context: ExecutionContext): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }

    return step.dependsOn.every(depId => context.completed.has(depId));
  }

  /**
   * Resolve parameters with dependency results
   */
  private resolveParameters(
    params: Record<string, any>,
    context: ExecutionContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // Reference to previous step result
        const stepId = value.substring(1);
        const result = context.results.get(stepId);
        resolved[key] = result?.output || result?.data || value;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Create a simple chain from tool names
   */
  public createSimpleChain(name: string, toolCalls: Array<{ tool: string; params: Record<string, any> }>): ToolChain {
    return {
      id: `chain-${Date.now()}`,
      name,
      description: `Simple chain with ${toolCalls.length} steps`,
      steps: toolCalls.map((call, index) => ({
        id: `step-${index}`,
        toolName: call.tool,
        params: call.params,
        dependsOn: index > 0 ? [`step-${index - 1}`] : undefined,
      })),
      parallel: false,
    };
  }

  /**
   * Create a parallel chain
   */
  public createParallelChain(
    name: string,
    toolCalls: Array<{ tool: string; params: Record<string, any> }>
  ): ToolChain {
    return {
      id: `chain-${Date.now()}`,
      name,
      description: `Parallel chain with ${toolCalls.length} steps`,
      steps: toolCalls.map((call, index) => ({
        id: `step-${index}`,
        toolName: call.tool,
        params: call.params,
      })),
      parallel: true,
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this._onStepStarted.dispose();
    this._onStepCompleted.dispose();
    this._onStepFailed.dispose();
    this._onChainCompleted.dispose();
  }
}

export default ToolChainExecutor;
