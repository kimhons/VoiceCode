/**
 * Specialized Agents
 * Provides specialized agents for planning, coding, and reviewing
 * Each agent has specific expertise and capabilities
 */
import * as vscode from 'vscode';
import { EnhancedAIBridgeService } from './EnhancedAIBridgeService';
import { CodebaseIndexService } from './CodebaseIndexService';
import { ConversationMemoryService } from './ConversationMemoryService';
/**
 * Agent task
 */
export interface AgentTask {
    id: string;
    type: 'plan' | 'code' | 'review' | 'refactor' | 'test' | 'explain';
    description: string;
    context?: string;
    requirements?: string[];
}
/**
 * Agent result
 */
export interface AgentResult {
    success: boolean;
    output: string;
    code?: string;
    suggestions?: string[];
    errors?: string[];
    confidence: number;
}
/**
 * Base Agent class
 */
declare abstract class BaseAgent {
    protected aiBridge: EnhancedAIBridgeService;
    protected codebaseIndex?: CodebaseIndexService;
    protected memory?: ConversationMemoryService;
    protected config: vscode.WorkspaceConfiguration;
    constructor(aiBridge: EnhancedAIBridgeService, config: vscode.WorkspaceConfiguration, codebaseIndex?: CodebaseIndexService, memory?: ConversationMemoryService);
    abstract execute(task: AgentTask): Promise<AgentResult>;
    protected getRelevantContext(task: AgentTask): Promise<string>;
}
/**
 * Planner Agent
 * Specializes in task decomposition and planning
 */
export declare class PlannerAgent extends BaseAgent {
    execute(task: AgentTask): Promise<AgentResult>;
    private parsePlan;
}
/**
 * Coder Agent
 * Specializes in code generation and implementation
 */
export declare class CoderAgent extends BaseAgent {
    execute(task: AgentTask): Promise<AgentResult>;
    private extractCode;
}
/**
 * Reviewer Agent
 * Specializes in code review and quality assurance
 */
export declare class ReviewerAgent extends BaseAgent {
    execute(task: AgentTask): Promise<AgentResult>;
    private parseIssues;
}
/**
 * Refactor Agent
 * Specializes in code refactoring and optimization
 */
export declare class RefactorAgent extends BaseAgent {
    execute(task: AgentTask): Promise<AgentResult>;
    private extractCode;
}
/**
 * Test Agent
 * Specializes in test generation and validation
 */
export declare class TestAgent extends BaseAgent {
    execute(task: AgentTask): Promise<AgentResult>;
    private extractCode;
}
/**
 * Agent Factory
 * Creates specialized agents
 */
export declare class AgentFactory {
    private aiBridge;
    private config;
    private codebaseIndex?;
    private memory?;
    constructor(aiBridge: EnhancedAIBridgeService, config: vscode.WorkspaceConfiguration, codebaseIndex?: CodebaseIndexService, memory?: ConversationMemoryService);
    createAgent(type: 'planner' | 'coder' | 'reviewer' | 'refactor' | 'test'): BaseAgent;
}
export default AgentFactory;
//# sourceMappingURL=SpecializedAgents.d.ts.map