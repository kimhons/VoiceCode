"use strict";
/**
 * Tool Chain Executor
 * Enables tool chaining, parallel execution, and retry logic
 * Orchestrates complex multi-tool workflows
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
exports.ToolChainExecutor = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Tool Chain Executor
 * Manages complex tool execution workflows
 */
class ToolChainExecutor {
    mcpService;
    telemetry;
    config;
    disposables = [];
    // Event emitters
    _onStepStarted = new vscode.EventEmitter();
    _onStepCompleted = new vscode.EventEmitter();
    _onStepFailed = new vscode.EventEmitter();
    _onChainCompleted = new vscode.EventEmitter();
    onStepStarted = this._onStepStarted.event;
    onStepCompleted = this._onStepCompleted.event;
    onStepFailed = this._onStepFailed.event;
    onChainCompleted = this._onChainCompleted.event;
    constructor(mcpService, config, telemetry) {
        this.mcpService = mcpService;
        this.config = config;
        this.telemetry = telemetry;
    }
    /**
     * Execute a tool chain
     */
    async executeChain(chain) {
        const startTime = Date.now();
        const context = {
            results: new Map(),
            errors: new Map(),
            completed: new Set(),
            inProgress: new Set(),
        };
        console.log(`[ToolChain] Executing chain: ${chain.name} (${chain.steps.length} steps)`);
        try {
            if (chain.parallel) {
                await this.executeParallel(chain, context);
            }
            else {
                await this.executeSequential(chain, context);
            }
            const duration = Date.now() - startTime;
            const result = {
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const result = {
                chainId: chain.id,
                success: false,
                results: context.results,
                errors: context.errors,
                duration,
                stepsExecuted: context.completed.size,
                stepsSkipped: chain.steps.length - context.completed.size,
            };
            this.telemetry.recordError(error, { context: 'tool_chain_execution', chainId: chain.id });
            return result;
        }
    }
    /**
     * Execute steps sequentially
     */
    async executeSequential(chain, context) {
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
    async executeParallel(chain, context) {
        const remaining = new Set(chain.steps);
        while (remaining.size > 0) {
            // Find steps that can be executed (dependencies met)
            const ready = [];
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
            await Promise.all(ready.map(async (step) => {
                context.inProgress.add(step.id);
                await this.executeStep(chain.id, step, context);
                context.inProgress.delete(step.id);
                remaining.delete(step);
            }));
        }
    }
    /**
     * Execute a single step
     */
    async executeStep(chainId, step, context) {
        this._onStepStarted.fire({ chainId, stepId: step.id });
        const maxRetries = step.maxRetries || (step.retryOnFailure ? 3 : 1);
        let lastError = null;
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
                }
                else {
                    lastError = new Error(result.error || 'Tool execution failed');
                }
            }
            catch (error) {
                lastError = error;
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
    areDependenciesMet(step, context) {
        if (!step.dependsOn || step.dependsOn.length === 0) {
            return true;
        }
        return step.dependsOn.every(depId => context.completed.has(depId));
    }
    /**
     * Resolve parameters with dependency results
     */
    resolveParameters(params, context) {
        const resolved = {};
        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string' && value.startsWith('$')) {
                // Reference to previous step result
                const stepId = value.substring(1);
                const result = context.results.get(stepId);
                resolved[key] = result?.output || result?.data || value;
            }
            else {
                resolved[key] = value;
            }
        }
        return resolved;
    }
    /**
     * Create a simple chain from tool names
     */
    createSimpleChain(name, toolCalls) {
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
    createParallelChain(name, toolCalls) {
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onStepStarted.dispose();
        this._onStepCompleted.dispose();
        this._onStepFailed.dispose();
        this._onChainCompleted.dispose();
    }
}
exports.ToolChainExecutor = ToolChainExecutor;
exports.default = ToolChainExecutor;
//# sourceMappingURL=ToolChainExecutor.js.map