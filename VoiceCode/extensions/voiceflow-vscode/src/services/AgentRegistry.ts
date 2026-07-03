/**
 * Agent Registry
 * Central registry for all AI agents (internal and external)
 * Manages agent discovery, capabilities, and metadata
 */

import * as vscode from 'vscode';
import { TelemetryService } from './TelemetryService';

/**
 * Agent capability definition
 */
export interface AgentCapability {
  name: string;
  description: string;
  strength: number; // 0-100
  examples: string[];
  tags: string[]; // e.g., ['python', 'react', 'testing']
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  id: string;
  name: string;
  displayName: string;
  type: 'internal' | 'external';
  provider: string;
  version: string;
  capabilities: AgentCapability[];
  responseCapture: boolean;
  costPerRequest?: number;
  averageLatency?: number;
  successRate?: number;
  specializations: string[]; // Languages, frameworks, tasks
  extensionId?: string; // VS Code extension ID if applicable
  commandPrefix?: string; // Command prefix for VS Code commands
  apiEndpoint?: string; // API endpoint if applicable
  requiresAuth?: boolean;
  status: 'available' | 'unavailable' | 'error';
  lastChecked?: Date;
  error?: string;
}

/**
 * Agent status
 */
export interface AgentStatus {
  agentId: string;
  available: boolean;
  configured: boolean;
  healthy: boolean;
  lastResponse?: Date;
  errorCount: number;
  successCount: number;
  averageResponseTime: number;
}

/**
 * Agent performance metrics
 */
export interface AgentPerformance {
  agentId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalCost: number;
  lastUsed: Date;
  taskSuccessRate: Record<string, number>; // task type -> success rate
}

/**
 * Agent Registry Service
 * Manages registration, discovery, and metadata for all agents
 */
export class AgentRegistry implements vscode.Disposable {
  private agents: Map<string, AgentMetadata> = new Map();
  private agentStatus: Map<string, AgentStatus> = new Map();
  private agentPerformance: Map<string, AgentPerformance> = new Map();
  private config: vscode.WorkspaceConfiguration;
  private telemetry: TelemetryService;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  // Event emitters
  private readonly _onAgentRegistered = new vscode.EventEmitter<AgentMetadata>();
  private readonly _onAgentStatusChanged = new vscode.EventEmitter<{ agentId: string; status: AgentStatus }>();
  private readonly _onAgentDiscovered = new vscode.EventEmitter<AgentMetadata[]>();

  public readonly onAgentRegistered = this._onAgentRegistered.event;
  public readonly onAgentStatusChanged = this._onAgentStatusChanged.event;
  public readonly onAgentDiscovered = this._onAgentDiscovered.event;

  constructor(
    context: vscode.ExtensionContext,
    config: vscode.WorkspaceConfiguration,
    telemetry: TelemetryService
  ) {
    this.context = context;
    this.config = config;
    this.telemetry = telemetry;

    // Load saved data
    this.loadFromStorage();

    // Register built-in agents
    this.registerBuiltInAgents();

    // Discover external agents
    this.discoverExternalAgents();
  }

  /**
   * Register a new agent
   */
  public register(agent: AgentMetadata): void {
    this.agents.set(agent.id, agent);

    // Initialize status
    this.agentStatus.set(agent.id, {
      agentId: agent.id,
      available: agent.status === 'available',
      configured: true,
      healthy: true,
      errorCount: 0,
      successCount: 0,
      averageResponseTime: 0,
    });

    // Initialize performance tracking
    this.agentPerformance.set(agent.id, {
      agentId: agent.id,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      totalCost: 0,
      lastUsed: new Date(),
      taskSuccessRate: {},
    });

    this._onAgentRegistered.fire(agent);
    this.saveToStorage();

    console.log(`[AgentRegistry] Registered agent: ${agent.name} (${agent.id})`);
  }

  /**
   * Discover all available agents
   */
  public async discover(): Promise<AgentMetadata[]> {
    await this.discoverExternalAgents();
    const allAgents = Array.from(this.agents.values());
    this._onAgentDiscovered.fire(allAgents);
    return allAgents;
  }

  /**
   * Get agent by ID
   */
  public getAgent(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  public getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get available agents
   */
  public getAvailableAgents(): AgentMetadata[] {
    return Array.from(this.agents.values()).filter(a => a.status === 'available');
  }

  /**
   * Find agents by capability
   */
  public findByCapability(capability: string): AgentMetadata[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.capabilities.some(cap =>
        cap.name.toLowerCase().includes(capability.toLowerCase()) ||
        cap.tags.some(tag => tag.toLowerCase().includes(capability.toLowerCase()))
      )
    );
  }

  /**
   * Find agents by specialization
   */
  public findBySpecialization(specialization: string): AgentMetadata[] {
    const spec = specialization.toLowerCase();
    return Array.from(this.agents.values()).filter(agent =>
      agent.specializations.some(s => s.toLowerCase().includes(spec))
    );
  }

  /**
   * Find best agent for a task
   */
  public findBestFor(task: string, context?: { language?: string; framework?: string }): AgentMetadata | null {
    const candidates = this.getAvailableAgents();
    if (candidates.length === 0) {
      return null;
    }

    // Score each agent
    const scores = candidates.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, task, context),
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores[0].score > 0 ? scores[0].agent : null;
  }

  /**
   * Calculate agent score for a task
   */
  private calculateAgentScore(
    agent: AgentMetadata,
    task: string,
    context?: { language?: string; framework?: string }
  ): number {
    let score = 0;
    const taskLower = task.toLowerCase();

    // Check capabilities
    for (const cap of agent.capabilities) {
      if (taskLower.includes(cap.name.toLowerCase())) {
        score += cap.strength;
      }
      for (const tag of cap.tags) {
        if (taskLower.includes(tag.toLowerCase())) {
          score += cap.strength * 0.5;
        }
      }
    }

    // Check specializations
    if (context?.language) {
      if (agent.specializations.some(s => s.toLowerCase() === context.language?.toLowerCase())) {
        score += 50;
      }
    }
    if (context?.framework) {
      if (agent.specializations.some(s => s.toLowerCase() === context.framework?.toLowerCase())) {
        score += 30;
      }
    }

    // Factor in performance
    const perf = this.agentPerformance.get(agent.id);
    if (perf && perf.totalRequests > 0) {
      const successRate = perf.successfulRequests / perf.totalRequests;
      score *= successRate;
    }

    // Penalize high latency
    if (agent.averageLatency && agent.averageLatency > 5000) {
      score *= 0.8;
    }

    // Penalize high cost
    if (agent.costPerRequest && agent.costPerRequest > 0.01) {
      score *= 0.9;
    }

    return score;
  }

  /**
   * Get agent status
   */
  public getStatus(agentId: string): AgentStatus | undefined {
    return this.agentStatus.get(agentId);
  }

  /**
   * Update agent status
   */
  public updateStatus(agentId: string, updates: Partial<AgentStatus>): void {
    const current = this.agentStatus.get(agentId);
    if (!current) {
      return;
    }

    const updated = { ...current, ...updates };
    this.agentStatus.set(agentId, updated);
    this._onAgentStatusChanged.fire({ agentId, status: updated });
  }

  /**
   * Record agent usage
   */
  public recordUsage(
    agentId: string,
    success: boolean,
    latency: number,
    cost: number = 0,
    taskType?: string
  ): void {
    const perf = this.agentPerformance.get(agentId);
    if (!perf) {
      return;
    }

    perf.totalRequests++;
    if (success) {
      perf.successfulRequests++;
    } else {
      perf.failedRequests++;
    }

    // Update average latency
    perf.averageLatency = (perf.averageLatency * (perf.totalRequests - 1) + latency) / perf.totalRequests;
    perf.totalCost += cost;
    perf.lastUsed = new Date();

    // Update task-specific success rate
    if (taskType) {
      if (!perf.taskSuccessRate[taskType]) {
        perf.taskSuccessRate[taskType] = success ? 1 : 0;
      } else {
        const currentRate = perf.taskSuccessRate[taskType];
        perf.taskSuccessRate[taskType] = (currentRate + (success ? 1 : 0)) / 2;
      }
    }

    // Update status
    const status = this.agentStatus.get(agentId);
    if (status) {
      if (success) {
        status.successCount++;
        status.lastResponse = new Date();
      } else {
        status.errorCount++;
      }
      status.averageResponseTime = perf.averageLatency;
    }

    this.saveToStorage();
  }

  /**
   * Get agent performance metrics
   */
  public getPerformance(agentId: string): AgentPerformance | undefined {
    return this.agentPerformance.get(agentId);
  }

  /**
   * Get top performing agents
   */
  public getTopPerformers(limit: number = 5): AgentMetadata[] {
    const agents = Array.from(this.agents.values());
    return agents
      .map(agent => {
        const perf = this.agentPerformance.get(agent.id);
        const successRate = perf && perf.totalRequests > 0
          ? perf.successfulRequests / perf.totalRequests
          : 0;
        return { agent, successRate };
      })
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit)
      .map(item => item.agent);
  }

  /**
   * Register built-in internal agents
   */
  private registerBuiltInAgents(): void {
    // Planner Agent
    this.register({
      id: 'internal-planner',
      name: 'Planner',
      displayName: 'VoiceCode Planner',
      type: 'internal',
      provider: 'voicecode',
      version: '1.0.0',
      capabilities: [
        {
          name: 'task-decomposition',
          description: 'Break down complex tasks into steps',
          strength: 95,
          examples: ['Plan implementation', 'Create roadmap', 'Decompose requirements'],
          tags: ['planning', 'architecture', 'design'],
        },
      ],
      responseCapture: true,
      specializations: ['planning', 'architecture', 'task-management'],
      status: 'available',
    });

    // Coder Agent
    this.register({
      id: 'internal-coder',
      name: 'Coder',
      displayName: 'VoiceCode Coder',
      type: 'internal',
      provider: 'voicecode',
      version: '1.0.0',
      capabilities: [
        {
          name: 'code-generation',
          description: 'Generate production-ready code',
          strength: 90,
          examples: ['Implement function', 'Create component', 'Write algorithm'],
          tags: ['coding', 'implementation', 'development'],
        },
      ],
      responseCapture: true,
      specializations: ['typescript', 'javascript', 'python', 'react', 'node'],
      status: 'available',
    });

    // Reviewer Agent
    this.register({
      id: 'internal-reviewer',
      name: 'Reviewer',
      displayName: 'VoiceCode Reviewer',
      type: 'internal',
      provider: 'voicecode',
      version: '1.0.0',
      capabilities: [
        {
          name: 'code-review',
          description: 'Comprehensive code review and quality assurance',
          strength: 92,
          examples: ['Review code', 'Find bugs', 'Security audit'],
          tags: ['review', 'quality', 'security', 'testing'],
        },
      ],
      responseCapture: true,
      specializations: ['code-review', 'security', 'best-practices', 'performance'],
      status: 'available',
    });

    // Refactor Agent
    this.register({
      id: 'internal-refactor',
      name: 'Refactor',
      displayName: 'VoiceCode Refactor',
      type: 'internal',
      provider: 'voicecode',
      version: '1.0.0',
      capabilities: [
        {
          name: 'code-refactoring',
          description: 'Improve code quality and maintainability',
          strength: 88,
          examples: ['Refactor code', 'Optimize performance', 'Improve readability'],
          tags: ['refactoring', 'optimization', 'clean-code'],
        },
      ],
      responseCapture: true,
      specializations: ['refactoring', 'optimization', 'design-patterns'],
      status: 'available',
    });

    // Test Agent
    this.register({
      id: 'internal-test',
      name: 'Test',
      displayName: 'VoiceCode Test',
      type: 'internal',
      provider: 'voicecode',
      version: '1.0.0',
      capabilities: [
        {
          name: 'test-generation',
          description: 'Generate comprehensive test suites',
          strength: 90,
          examples: ['Generate tests', 'Create test cases', 'Write unit tests'],
          tags: ['testing', 'unit-tests', 'integration-tests', 'tdd'],
        },
      ],
      responseCapture: true,
      specializations: ['testing', 'jest', 'vitest', 'pytest', 'junit'],
      status: 'available',
    });
  }

  /**
   * Discover external agents (VS Code extensions, APIs, etc.)
   */
  private async discoverExternalAgents(): Promise<void> {
    // GitHub Copilot
    if (vscode.extensions.getExtension('github.copilot')) {
      this.register({
        id: 'external-copilot',
        name: 'Copilot',
        displayName: 'GitHub Copilot',
        type: 'external',
        provider: 'github',
        version: '1.0.0',
        extensionId: 'github.copilot',
        capabilities: [
          {
            name: 'code-completion',
            description: 'AI-powered code completion',
            strength: 95,
            examples: ['Complete code', 'Suggest implementations'],
            tags: ['completion', 'suggestions', 'ai'],
          },
        ],
        responseCapture: true,
        specializations: ['all-languages', 'code-completion'],
        status: 'available',
      });
    }

    // Cursor
    if (vscode.extensions.getExtension('cursor.cursor')) {
      this.register({
        id: 'external-cursor',
        name: 'Cursor',
        displayName: 'Cursor AI',
        type: 'external',
        provider: 'cursor',
        version: '1.0.0',
        extensionId: 'cursor.cursor',
        commandPrefix: 'cursor',
        capabilities: [
          {
            name: 'ai-chat',
            description: 'AI-powered coding assistant',
            strength: 92,
            examples: ['Chat with AI', 'Code generation', 'Refactoring'],
            tags: ['chat', 'ai', 'assistant'],
          },
        ],
        responseCapture: false,
        specializations: ['typescript', 'react', 'python'],
        status: 'available',
      });
    }

    // Cline (Claude Dev)
    if (vscode.extensions.getExtension('saoudrizwan.claude-dev')) {
      this.register({
        id: 'external-cline',
        name: 'Cline',
        displayName: 'Cline (Claude Dev)',
        type: 'external',
        provider: 'anthropic',
        version: '1.0.0',
        extensionId: 'saoudrizwan.claude-dev',
        commandPrefix: 'cline',
        capabilities: [
          {
            name: 'ai-development',
            description: 'Claude-powered development assistant',
            strength: 90,
            examples: ['Code generation', 'Debugging', 'Explanation'],
            tags: ['claude', 'ai', 'development'],
          },
        ],
        responseCapture: false,
        specializations: ['all-languages', 'debugging'],
        status: 'available',
      });
    }

    // Windsurf (Codeium)
    if (vscode.extensions.getExtension('codeium.codeium')) {
      this.register({
        id: 'external-windsurf',
        name: 'Windsurf',
        displayName: 'Windsurf (Codeium)',
        type: 'external',
        provider: 'codeium',
        version: '1.0.0',
        extensionId: 'codeium.codeium',
        commandPrefix: 'codeium',
        capabilities: [
          {
            name: 'code-completion',
            description: 'AI code completion and chat',
            strength: 88,
            examples: ['Complete code', 'Chat', 'Refactor'],
            tags: ['completion', 'chat', 'ai'],
          },
        ],
        responseCapture: false,
        specializations: ['all-languages', 'code-completion'],
        status: 'available',
      });
    }

    // Sourcegraph Cody
    if (vscode.extensions.getExtension('sourcegraph.cody-ai')) {
      this.register({
        id: 'external-cody',
        name: 'Cody',
        displayName: 'Sourcegraph Cody',
        type: 'external',
        provider: 'sourcegraph',
        version: '1.0.0',
        extensionId: 'sourcegraph.cody-ai',
        commandPrefix: 'cody',
        capabilities: [
          {
            name: 'code-search',
            description: 'AI-powered code search and chat',
            strength: 87,
            examples: ['Search code', 'Chat', 'Explain'],
            tags: ['search', 'chat', 'ai'],
          },
        ],
        responseCapture: false,
        specializations: ['code-search', 'documentation'],
        status: 'available',
      });
    }

    // Continue.dev
    if (vscode.extensions.getExtension('continue.continue')) {
      this.register({
        id: 'external-continue',
        name: 'Continue',
        displayName: 'Continue.dev',
        type: 'external',
        provider: 'continue',
        version: '1.0.0',
        extensionId: 'continue.continue',
        commandPrefix: 'continue',
        capabilities: [
          {
            name: 'ai-autocomplete',
            description: 'AI autocomplete and chat',
            strength: 85,
            examples: ['Autocomplete', 'Chat', 'Refactor'],
            tags: ['autocomplete', 'chat', 'ai'],
          },
        ],
        responseCapture: false,
        specializations: ['all-languages'],
        status: 'available',
      });
    }

    // Tabnine
    if (vscode.extensions.getExtension('tabnine.tabnine-vscode')) {
      this.register({
        id: 'external-tabnine',
        name: 'Tabnine',
        displayName: 'Tabnine AI',
        type: 'external',
        provider: 'tabnine',
        version: '1.0.0',
        extensionId: 'tabnine.tabnine-vscode',
        commandPrefix: 'tabnine',
        capabilities: [
          {
            name: 'code-completion',
            description: 'AI code completion',
            strength: 86,
            examples: ['Complete code', 'Suggest implementations'],
            tags: ['completion', 'ai'],
          },
        ],
        responseCapture: false,
        specializations: ['all-languages', 'code-completion'],
        status: 'available',
      });
    }

    // Amazon CodeWhisperer
    if (vscode.extensions.getExtension('amazonwebservices.aws-toolkit-vscode')) {
      this.register({
        id: 'external-codewhisperer',
        name: 'CodeWhisperer',
        displayName: 'Amazon CodeWhisperer',
        type: 'external',
        provider: 'amazon',
        version: '1.0.0',
        extensionId: 'amazonwebservices.aws-toolkit-vscode',
        commandPrefix: 'aws',
        capabilities: [
          {
            name: 'code-completion',
            description: 'AI code recommendations',
            strength: 84,
            examples: ['Complete code', 'Security scan'],
            tags: ['completion', 'security', 'aws'],
          },
        ],
        responseCapture: false,
        specializations: ['python', 'java', 'javascript', 'aws'],
        status: 'available',
      });
    }

    console.log(`[AgentRegistry] Discovered ${this.agents.size} agents`);
  }

  /**
   * Load data from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const savedPerformance = this.context.globalState.get<Array<[string, AgentPerformance]>>('agentPerformance');
      if (savedPerformance) {
        this.agentPerformance = new Map(savedPerformance.map(([id, perf]) => [
          id,
          { ...perf, lastUsed: new Date(perf.lastUsed) }
        ]));
      }
    } catch (error) {
      console.error('[AgentRegistry] Failed to load from storage:', error);
    }
  }

  /**
   * Save data to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await this.context.globalState.update('agentPerformance', Array.from(this.agentPerformance.entries()));
    } catch (error) {
      console.error('[AgentRegistry] Failed to save to storage:', error);
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this._onAgentRegistered.dispose();
    this._onAgentStatusChanged.dispose();
    this._onAgentDiscovered.dispose();
  }
}

export default AgentRegistry;
