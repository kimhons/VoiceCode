/**
 * Specialized Agents
 * Provides specialized agents for planning, coding, and reviewing
 * Each agent has specific expertise and capabilities
 */

import * as vscode from 'vscode';
import { EnhancedAIBridgeService, AIRequest, AIResponse } from './EnhancedAIBridgeService';
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
abstract class BaseAgent {
  protected aiBridge: EnhancedAIBridgeService;
  protected codebaseIndex?: CodebaseIndexService;
  protected memory?: ConversationMemoryService;
  protected config: vscode.WorkspaceConfiguration;

  constructor(
    aiBridge: EnhancedAIBridgeService,
    config: vscode.WorkspaceConfiguration,
    codebaseIndex?: CodebaseIndexService,
    memory?: ConversationMemoryService
  ) {
    this.aiBridge = aiBridge;
    this.config = config;
    this.codebaseIndex = codebaseIndex;
    this.memory = memory;
  }

  abstract execute(task: AgentTask): Promise<AgentResult>;

  protected async getRelevantContext(task: AgentTask): Promise<string> {
    let context = '';

    // Get codebase context
    if (this.codebaseIndex && this.codebaseIndex.isReady()) {
      const relevantCode = await this.codebaseIndex.getRelevantContext(task.description, 1500);
      if (relevantCode) {
        context += `\n\n=== Relevant Codebase Context ===\n${relevantCode}`;
      }
    }

    // Get conversation context
    if (this.memory) {
      const conversationContext = await this.memory.getConversationContext(task.description, 500);
      if (conversationContext) {
        context += `\n\n=== Previous Conversations ===\n${conversationContext}`;
      }
    }

    // Add provided context
    if (task.context) {
      context += `\n\n=== Task Context ===\n${task.context}`;
    }

    return context;
  }
}

/**
 * Planner Agent
 * Specializes in task decomposition and planning
 */
export class PlannerAgent extends BaseAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const context = await this.getRelevantContext(task);

    const prompt = `You are a senior software architect specializing in task planning and decomposition.

Task: ${task.description}

${context}

Break down this task into clear, actionable steps. For each step:
1. Describe what needs to be done
2. Identify dependencies
3. Estimate complexity (low/medium/high)
4. List required tools or resources

Provide a structured plan that can be executed sequentially or in parallel where possible.`;

    const request: AIRequest = {
      type: 'chat',
      prompt,
      context: { code: task.context },
    };

    const response = await this.aiBridge.sendRequest(request);

    if (response.success && response.content) {
      // Parse the plan into structured steps
      const steps = this.parsePlan(response.content);

      return {
        success: true,
        output: response.content,
        suggestions: steps,
        confidence: 0.9,
      };
    }

    return {
      success: false,
      output: response.error || 'Planning failed',
      confidence: 0,
      errors: [response.error || 'Unknown error'],
    };
  }

  private parsePlan(planText: string): string[] {
    const steps: string[] = [];
    const lines = planText.split('\n');

    for (const line of lines) {
      // Match numbered steps (1., 2., etc.) or bullet points
      if (/^\d+\./.test(line) || /^[-*]/.test(line)) {
        steps.push(line.trim());
      }
    }

    return steps;
  }
}

/**
 * Coder Agent
 * Specializes in code generation and implementation
 */
export class CoderAgent extends BaseAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const context = await this.getRelevantContext(task);

    const prompt = `You are an expert software engineer with deep knowledge of best practices and design patterns.

Task: ${task.description}

${context}

Requirements:
${task.requirements?.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'None specified'}

Generate high-quality, production-ready code that:
- Follows best practices and design patterns
- Includes proper error handling
- Has clear comments for complex logic
- Is well-structured and maintainable
- Includes type annotations (if applicable)

Provide the complete implementation with explanations.`;

    const request: AIRequest = {
      type: 'chat',
      prompt,
      context: { code: task.context },
    };

    const response = await this.aiBridge.sendRequest(request);

    if (response.success && response.content) {
      // Extract code blocks
      const code = this.extractCode(response.content);

      return {
        success: true,
        output: response.content,
        code,
        confidence: 0.85,
      };
    }

    return {
      success: false,
      output: response.error || 'Code generation failed',
      confidence: 0,
      errors: [response.error || 'Unknown error'],
    };
  }

  private extractCode(text: string): string {
    // Extract code from markdown code blocks
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      return matches.map(m => m[1]).join('\n\n');
    }

    return text;
  }
}

/**
 * Reviewer Agent
 * Specializes in code review and quality assurance
 */
export class ReviewerAgent extends BaseAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const context = await this.getRelevantContext(task);

    const prompt = `You are a senior code reviewer with expertise in software quality, security, and best practices.

Code to Review:
${task.context || 'No code provided'}

${context}

Perform a comprehensive code review focusing on:
1. **Correctness**: Does the code work as intended?
2. **Security**: Are there any security vulnerabilities?
3. **Performance**: Are there performance issues or optimizations?
4. **Maintainability**: Is the code clean and maintainable?
5. **Best Practices**: Does it follow language/framework conventions?
6. **Testing**: Is the code testable? Are edge cases handled?

Provide:
- A summary of findings
- Specific issues with severity (critical/high/medium/low)
- Suggested improvements
- Overall quality score (0-100)`;

    const request: AIRequest = {
      type: 'review',
      prompt,
      context: { code: task.context },
    };

    const response = await this.aiBridge.sendRequest(request);

    if (response.success && response.content) {
      const issues = this.parseIssues(response.content);

      return {
        success: true,
        output: response.content,
        errors: issues.filter(i => i.severity === 'critical' || i.severity === 'high').map(i => i.description),
        suggestions: issues.filter(i => i.severity === 'medium' || i.severity === 'low').map(i => i.description),
        confidence: 0.9,
      };
    }

    return {
      success: false,
      output: response.error || 'Review failed',
      confidence: 0,
      errors: [response.error || 'Unknown error'],
    };
  }

  private parseIssues(reviewText: string): Array<{ severity: string; description: string }> {
    const issues: Array<{ severity: string; description: string }> = [];
    const lines = reviewText.split('\n');

    for (const line of lines) {
      // Match severity indicators
      const severityMatch = line.match(/\*\*(critical|high|medium|low)\*\*/i);
      if (severityMatch) {
        issues.push({
          severity: severityMatch[1].toLowerCase(),
          description: line.trim(),
        });
      }
    }

    return issues;
  }
}

/**
 * Refactor Agent
 * Specializes in code refactoring and optimization
 */
export class RefactorAgent extends BaseAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const context = await this.getRelevantContext(task);

    const prompt = `You are an expert in code refactoring and optimization.

Code to Refactor:
${task.context || 'No code provided'}

${context}

Refactor this code to improve:
1. **Readability**: Make it easier to understand
2. **Maintainability**: Reduce complexity and coupling
3. **Performance**: Optimize where beneficial
4. **Testability**: Make it easier to test
5. **Reusability**: Extract common patterns

Provide:
- The refactored code
- Explanation of changes made
- Benefits of each refactoring
- Any trade-offs or considerations`;

    const request: AIRequest = {
      type: 'refactor',
      prompt,
      context: { code: task.context },
    };

    const response = await this.aiBridge.sendRequest(request);

    if (response.success && response.content) {
      const code = this.extractCode(response.content);

      return {
        success: true,
        output: response.content,
        code,
        confidence: 0.85,
      };
    }

    return {
      success: false,
      output: response.error || 'Refactoring failed',
      confidence: 0,
      errors: [response.error || 'Unknown error'],
    };
  }

  private extractCode(text: string): string {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      return matches.map(m => m[1]).join('\n\n');
    }

    return text;
  }
}

/**
 * Test Agent
 * Specializes in test generation and validation
 */
export class TestAgent extends BaseAgent {
  async execute(task: AgentTask): Promise<AgentResult> {
    const context = await this.getRelevantContext(task);

    const prompt = `You are a testing expert specializing in comprehensive test coverage.

Code to Test:
${task.context || 'No code provided'}

${context}

Generate comprehensive tests that cover:
1. **Happy Path**: Normal expected behavior
2. **Edge Cases**: Boundary conditions and limits
3. **Error Cases**: Invalid inputs and error handling
4. **Integration**: Interactions with dependencies

Provide:
- Complete test suite with multiple test cases
- Clear test descriptions
- Setup and teardown if needed
- Mock data and fixtures
- Coverage analysis`;

    const request: AIRequest = {
      type: 'test',
      prompt,
      context: { code: task.context },
    };

    const response = await this.aiBridge.sendRequest(request);

    if (response.success && response.content) {
      const code = this.extractCode(response.content);

      return {
        success: true,
        output: response.content,
        code,
        confidence: 0.85,
      };
    }

    return {
      success: false,
      output: response.error || 'Test generation failed',
      confidence: 0,
      errors: [response.error || 'Unknown error'],
    };
  }

  private extractCode(text: string): string {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];

    if (matches.length > 0) {
      return matches.map(m => m[1]).join('\n\n');
    }

    return text;
  }
}

/**
 * Agent Factory
 * Creates specialized agents
 */
export class AgentFactory {
  private aiBridge: EnhancedAIBridgeService;
  private config: vscode.WorkspaceConfiguration;
  private codebaseIndex?: CodebaseIndexService;
  private memory?: ConversationMemoryService;

  constructor(
    aiBridge: EnhancedAIBridgeService,
    config: vscode.WorkspaceConfiguration,
    codebaseIndex?: CodebaseIndexService,
    memory?: ConversationMemoryService
  ) {
    this.aiBridge = aiBridge;
    this.config = config;
    this.codebaseIndex = codebaseIndex;
    this.memory = memory;
  }

  createAgent(type: 'planner' | 'coder' | 'reviewer' | 'refactor' | 'test'): BaseAgent {
    switch (type) {
      case 'planner':
        return new PlannerAgent(this.aiBridge, this.config, this.codebaseIndex, this.memory);
      case 'coder':
        return new CoderAgent(this.aiBridge, this.config, this.codebaseIndex, this.memory);
      case 'reviewer':
        return new ReviewerAgent(this.aiBridge, this.config, this.codebaseIndex, this.memory);
      case 'refactor':
        return new RefactorAgent(this.aiBridge, this.config, this.codebaseIndex, this.memory);
      case 'test':
        return new TestAgent(this.aiBridge, this.config, this.codebaseIndex, this.memory);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}

export default AgentFactory;
