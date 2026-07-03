/**
 * Agent Communication Hub
 * Central hub for routing messages between agents and orchestrating multi-agent workflows
 * Enables VoiceCode to act as universal AI agent coordinator
 */

import * as vscode from 'vscode';
import { AgentRegistry, AgentMetadata } from './AgentRegistry';
import { EnhancedAIBridgeService, AIRequest, AIResponse } from './EnhancedAIBridgeService';
import { TelemetryService } from './TelemetryService';
import { AgentFactory } from './SpecializedAgents';

/**
 * Agent message for inter-agent communication
 */
export interface AgentMessage {
  id: string;
  from: string; // agent ID
  to: string | string[]; // agent ID(s) or 'broadcast'
  type: 'request' | 'response' | 'broadcast' | 'delegate';
  task: string;
  context?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeout?: number;
  requiresResponse: boolean;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Agent response
 */
export interface AgentResponse {
  id: string;
  requestId: string;
  from: string;
  success: boolean;
  content: string;
  code?: string;
  confidence: number; // 0-1
  metadata: {
    tokensUsed?: number;
    duration: number;
    model?: string;
    cost?: number;
  };
  timestamp: Date;
}

/**
 * Multi-agent execution result
 */
export interface MultiAgentResult {
  success: boolean;
  responses: AgentResponse[];
  aggregated?: AgentResponse;
  consensus?: AgentResponse;
  best?: AgentResponse;
  duration: number;
  totalCost: number;
}

/**
 * Agent Communication Hub
 * Orchestrates communication between all agents (internal and external)
 */
export class AgentCommunicationHub implements vscode.Disposable {
  private registry: AgentRegistry;
  private aiBridge: EnhancedAIBridgeService;
  private agentFactory: AgentFactory;
  private telemetry: TelemetryService;
  private config: vscode.WorkspaceConfiguration;
  private disposables: vscode.Disposable[] = [];

  // Message queue for async processing
  private messageQueue: AgentMessage[] = [];
  private responseCache: Map<string, AgentResponse> = new Map();

  // Event emitters
  private readonly _onMessageSent = new vscode.EventEmitter<AgentMessage>();
  private readonly _onResponseReceived = new vscode.EventEmitter<AgentResponse>();
  private readonly _onMultiAgentComplete = new vscode.EventEmitter<MultiAgentResult>();

  public readonly onMessageSent = this._onMessageSent.event;
  public readonly onResponseReceived = this._onResponseReceived.event;
  public readonly onMultiAgentComplete = this._onMultiAgentComplete.event;

  constructor(
    registry: AgentRegistry,
    aiBridge: EnhancedAIBridgeService,
    agentFactory: AgentFactory,
    config: vscode.WorkspaceConfiguration,
    telemetry: TelemetryService
  ) {
    this.registry = registry;
    this.aiBridge = aiBridge;
    this.agentFactory = agentFactory;
    this.config = config;
    this.telemetry = telemetry;
  }

  /**
   * Route task to best agent
   */
  public async routeTask(
    task: string,
    context?: { language?: string; framework?: string; code?: string }
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    // Find best agent for task
    const agent = this.registry.findBestFor(task, context);
    if (!agent) {
      return {
        id: `response-${Date.now()}`,
        requestId: `request-${Date.now()}`,
        from: 'system',
        success: false,
        content: 'No suitable agent found for task',
        confidence: 0,
        metadata: { duration: Date.now() - startTime },
        timestamp: new Date(),
      };
    }

    console.log(`[AgentHub] Routing task to ${agent.name}: "${task}"`);

    // Send to agent
    const message: AgentMessage = {
      id: `msg-${Date.now()}`,
      from: 'voicecode-hub',
      to: agent.id,
      type: 'request',
      task,
      context,
      priority: 'medium',
      requiresResponse: true,
      timestamp: new Date(),
    };

    return await this.sendToAgent(agent.id, message);
  }

  /**
   * Route to multiple agents for comparison/consensus
   */
  public async routeToMultiple(
    task: string,
    count: number = 3,
    context?: any
  ): Promise<AgentResponse[]> {
    const agents = this.registry.getAvailableAgents().slice(0, count);
    
    const promises = agents.map(agent => {
      const message: AgentMessage = {
        id: `msg-${Date.now()}-${agent.id}`,
        from: 'voicecode-hub',
        to: agent.id,
        type: 'request',
        task,
        context,
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(),
      };
      return this.sendToAgent(agent.id, message);
    });

    return await Promise.all(promises);
  }

  /**
   * Send message to specific agent
   */
  public async sendToAgent(agentId: string, message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();
    this._onMessageSent.fire(message);

    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      return this.createErrorResponse(message.id, agentId, 'Agent not found', startTime);
    }

    try {
      let response: AgentResponse;

      // Route to appropriate handler based on agent type
      if (agent.type === 'internal') {
        response = await this.sendToInternalAgent(agent, message);
      } else {
        response = await this.sendToExternalAgent(agent, message);
      }

      // Record usage
      const duration = Date.now() - startTime;
      this.registry.recordUsage(
        agentId,
        response.success,
        duration,
        response.metadata.cost || 0,
        message.type
      );

      this._onResponseReceived.fire(response);
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.registry.recordUsage(agentId, false, duration, 0, message.type);
      
      return this.createErrorResponse(
        message.id,
        agentId,
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Send to internal agent (our specialized agents)
   */
  private async sendToInternalAgent(agent: AgentMetadata, message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();

    // Map agent ID to agent type
    const agentTypeMap: Record<string, 'planner' | 'coder' | 'reviewer' | 'refactor' | 'test'> = {
      'internal-planner': 'planner',
      'internal-coder': 'coder',
      'internal-reviewer': 'reviewer',
      'internal-refactor': 'refactor',
      'internal-test': 'test',
    };
    
    const agentType = agentTypeMap[agent.id];
    if (!agentType) {
      throw new Error(`Unknown internal agent: ${agent.id}`);
    }
    
    const internalAgent = this.agentFactory.createAgent(agentType);

    // Map agent type to task type
    const taskTypeMap: Record<string, 'plan' | 'code' | 'review' | 'refactor' | 'test'> = {
      'planner': 'plan',
      'coder': 'code',
      'reviewer': 'review',
      'refactor': 'refactor',
      'test': 'test',
    };

    const result = await internalAgent.execute({
      id: message.id,
      type: taskTypeMap[agentType],
      description: message.task,
      context: message.context?.code,
      requirements: message.context?.requirements,
    });

    return {
      id: `response-${Date.now()}`,
      requestId: message.id,
      from: agent.id,
      success: result.success,
      content: result.output,
      code: result.code,
      confidence: result.confidence,
      metadata: {
        duration: Date.now() - startTime,
        model: 'internal',
      },
      timestamp: new Date(),
    };
  }

  /**
   * Send to external agent (Copilot, Cursor, etc.)
   */
  private async sendToExternalAgent(agent: AgentMetadata, message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();

    // Map agent to provider
    const providerMap: Record<string, string> = {
      'external-copilot': 'copilot',
      'external-cursor': 'cursor',
      'external-cline': 'cline',
      'external-windsurf': 'cursor', // Use cursor API as fallback
      'external-cody': 'cline', // Use cline API as fallback
      'external-continue': 'copilot', // Use copilot API as fallback
      'external-tabnine': 'copilot',
      'external-codewhisperer': 'copilot',
    };

    const provider = providerMap[agent.id] || 'openai';

    const aiRequest: AIRequest = {
      type: 'chat',
      prompt: message.task,
      context: {
        code: message.context?.code,
        language: message.context?.language,
        filePath: message.context?.filePath,
      },
      options: {
        provider: provider as any,
      },
    };

    const aiResponse = await this.aiBridge.sendRequest(aiRequest);

    return {
      id: `response-${Date.now()}`,
      requestId: message.id,
      from: agent.id,
      success: aiResponse.success,
      content: aiResponse.content || aiResponse.error || '',
      code: aiResponse.code,
      confidence: aiResponse.success ? 0.8 : 0,
      metadata: {
        duration: Date.now() - startTime,
        model: aiResponse.model,
        tokensUsed: aiResponse.usage?.totalTokens,
        cost: this.estimateCost(aiResponse.usage?.totalTokens || 0, provider),
      },
      timestamp: new Date(),
    };
  }

  /**
   * Broadcast message to all available agents
   */
  public async broadcast(message: AgentMessage): Promise<AgentResponse[]> {
    const agents = this.registry.getAvailableAgents();
    
    const promises = agents.map(agent => {
      const agentMessage = { ...message, to: agent.id };
      return this.sendToAgent(agent.id, agentMessage);
    });

    return await Promise.all(promises);
  }

  /**
   * Execute task in parallel across multiple agents
   */
  public async executeParallel(
    task: string,
    agentIds: string[],
    context?: any
  ): Promise<MultiAgentResult> {
    const startTime = Date.now();

    const promises = agentIds.map(agentId => {
      const message: AgentMessage = {
        id: `msg-${Date.now()}-${agentId}`,
        from: 'voicecode-hub',
        to: agentId,
        type: 'request',
        task,
        context,
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(),
      };
      return this.sendToAgent(agentId, message);
    });

    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;
    const totalCost = responses.reduce((sum, r) => sum + (r.metadata.cost || 0), 0);

    const result: MultiAgentResult = {
      success: responses.some(r => r.success),
      responses,
      best: this.selectBestResponse(responses),
      duration,
      totalCost,
    };

    this._onMultiAgentComplete.fire(result);
    return result;
  }

  /**
   * Execute task sequentially (pipeline)
   */
  public async executeSequential(
    tasks: Array<{ task: string; agentId: string; context?: any }>
  ): Promise<MultiAgentResult> {
    const startTime = Date.now();
    const responses: AgentResponse[] = [];
    let totalCost = 0;

    for (const { task, agentId, context } of tasks) {
      const message: AgentMessage = {
        id: `msg-${Date.now()}`,
        from: 'voicecode-hub',
        to: agentId,
        type: 'request',
        task,
        context,
        priority: 'medium',
        requiresResponse: true,
        timestamp: new Date(),
      };

      const response = await this.sendToAgent(agentId, message);
      responses.push(response);
      totalCost += response.metadata.cost || 0;

      // Stop if any step fails
      if (!response.success) {
        break;
      }
    }

    const duration = Date.now() - startTime;

    const result: MultiAgentResult = {
      success: responses.every(r => r.success),
      responses,
      duration,
      totalCost,
    };

    this._onMultiAgentComplete.fire(result);
    return result;
  }

  /**
   * Execute with voting/consensus
   */
  public async executeWithConsensus(
    task: string,
    agentIds: string[],
    context?: any
  ): Promise<MultiAgentResult> {
    const parallelResult = await this.executeParallel(task, agentIds, context);
    
    // Find consensus response
    const consensus = this.findConsensus(parallelResult.responses);
    
    return {
      ...parallelResult,
      consensus,
    };
  }

  /**
   * Competitive race - first to respond wins
   */
  public async executeRace(
    task: string,
    agentIds: string[],
    context?: any
  ): Promise<AgentResponse> {
    const promises = agentIds.map(agentId => {
      const message: AgentMessage = {
        id: `msg-${Date.now()}-${agentId}`,
        from: 'voicecode-hub',
        to: agentId,
        type: 'request',
        task,
        context,
        priority: 'urgent',
        requiresResponse: true,
        timestamp: new Date(),
      };
      return this.sendToAgent(agentId, message);
    });

    // Return first successful response
    return await Promise.race(promises);
  }

  /**
   * Select best response from multiple responses
   */
  private selectBestResponse(responses: AgentResponse[]): AgentResponse {
    // Filter successful responses
    const successful = responses.filter(r => r.success);
    if (successful.length === 0) {
      return responses[0]; // Return first even if failed
    }

    // Sort by confidence
    successful.sort((a, b) => b.confidence - a.confidence);
    return successful[0];
  }

  /**
   * Find consensus among responses
   */
  private findConsensus(responses: AgentResponse[]): AgentResponse | undefined {
    const successful = responses.filter(r => r.success);
    if (successful.length === 0) {
      return undefined;
    }

    // Simple majority voting based on content similarity
    // In production, would use more sophisticated NLP similarity
    const contentMap = new Map<string, number>();
    
    for (const response of successful) {
      const normalized = response.content.toLowerCase().trim();
      contentMap.set(normalized, (contentMap.get(normalized) || 0) + 1);
    }

    // Find most common response
    let maxCount = 0;
    let consensusContent = '';
    
    for (const [content, count] of contentMap) {
      if (count > maxCount) {
        maxCount = count;
        consensusContent = content;
      }
    }

    // Return response with consensus content
    return successful.find(r => r.content.toLowerCase().trim() === consensusContent);
  }

  /**
   * Aggregate multiple responses into one
   */
  public aggregateResponses(responses: AgentResponse[]): AgentResponse {
    const successful = responses.filter(r => r.success);
    
    if (successful.length === 0) {
      return responses[0];
    }

    // Combine all successful responses
    const aggregatedContent = successful
      .map((r, i) => `### Response from ${r.from}:\n${r.content}`)
      .join('\n\n');

    const avgConfidence = successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length;
    const totalDuration = successful.reduce((sum, r) => sum + r.metadata.duration, 0);
    const totalCost = successful.reduce((sum, r) => sum + (r.metadata.cost || 0), 0);

    return {
      id: `aggregated-${Date.now()}`,
      requestId: successful[0].requestId,
      from: 'voicecode-hub-aggregated',
      success: true,
      content: aggregatedContent,
      confidence: avgConfidence,
      metadata: {
        duration: totalDuration,
        cost: totalCost,
        tokensUsed: successful.reduce((sum, r) => sum + (r.metadata.tokensUsed || 0), 0),
      },
      timestamp: new Date(),
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    requestId: string,
    agentId: string,
    error: string,
    startTime: number
  ): AgentResponse {
    return {
      id: `response-${Date.now()}`,
      requestId,
      from: agentId,
      success: false,
      content: `Error: ${error}`,
      confidence: 0,
      metadata: {
        duration: Date.now() - startTime,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Estimate cost based on tokens and provider
   */
  private estimateCost(tokens: number, provider: string): number {
    const costPer1MTokens: Record<string, number> = {
      'openai': 0.60, // gpt-4o-mini average
      'anthropic': 3.00, // claude-3-5-sonnet
      'copilot': 0, // Included in subscription
      'cursor': 0, // Included in subscription
      'cline': 0, // Uses user's API key
    };

    const rate = costPer1MTokens[provider] || 0.60;
    return (tokens / 1_000_000) * rate;
  }

  /**
   * Get agent communication statistics
   */
  public getStats(): {
    totalMessages: number;
    totalResponses: number;
    averageResponseTime: number;
    successRate: number;
  } {
    const agents = this.registry.getAllAgents();
    let totalRequests = 0;
    let successfulRequests = 0;
    let totalLatency = 0;

    for (const agent of agents) {
      const perf = this.registry.getPerformance(agent.id);
      if (perf) {
        totalRequests += perf.totalRequests;
        successfulRequests += perf.successfulRequests;
        totalLatency += perf.averageLatency * perf.totalRequests;
      }
    }

    return {
      totalMessages: totalRequests,
      totalResponses: successfulRequests,
      averageResponseTime: totalRequests > 0 ? totalLatency / totalRequests : 0,
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
    };
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this._onMessageSent.dispose();
    this._onResponseReceived.dispose();
    this._onMultiAgentComplete.dispose();
  }
}

export default AgentCommunicationHub;
