/**
 * VoiceCode Agent Type Definitions
 * Comprehensive types for internal and external agent systems
 */

// =============================================================================
// INTERNAL AGENT TYPES
// =============================================================================

/**
 * Internal subagent types matching the Rust backend (subagents.rs)
 */
export enum SubagentType {
    PLANNER = 'planner',
    EXPLORER = 'explorer',
    CODER = 'coder',
    REVIEWER = 'reviewer',
    TESTER = 'tester',
    DEBUGGER = 'debugger',
    DOCUMENTER = 'documenter',
    REFACTORER = 'refactorer',
    SECURITY = 'security',
    GENERAL = 'general'
}

/**
 * Model tiers for subagent routing (matching Rust ModelTier)
 */
export enum ModelTier {
    FAST = 'fast',           // Haiku - for quick tasks
    BALANCED = 'balanced',   // Sonnet - general purpose
    ADVANCED = 'advanced',   // Opus - complex reasoning
    CODE = 'code'            // Code-optimized model
}

/**
 * Orchestration strategies (matching Rust OrchestrationStrategy)
 */
export enum OrchestrationStrategy {
    SINGLE_AGENT = 'SingleAgent',
    RACE_EXECUTION = 'RaceExecution',
    CONSENSUS = 'Consensus',
    PIPELINE = 'Pipeline',
    DECOMPOSITION = 'Decomposition'
}

/**
 * Agent status (matching Rust AgentStatus)
 */
export enum AgentStatus {
    AVAILABLE = 'available',
    BUSY = 'busy',
    OFFLINE = 'offline',
    ERROR = 'error',
    CONNECTING = 'connecting'
}

/**
 * Agent type classification
 */
export enum AgentTypeCategory {
    INTERNAL = 'internal',
    EXTERNAL = 'external',
    REMOTE = 'remote',
    PLUGIN = 'plugin'
}

/**
 * Agent capabilities (matching Rust AgentCapability)
 */
export enum AgentCapability {
    CODE_GENERATION = 'CodeGeneration',
    CODE_REVIEW = 'CodeReview',
    BUG_FIX = 'BugFix',
    REFACTORING = 'Refactoring',
    TEST_GENERATION = 'TestGeneration',
    DOCUMENTATION = 'Documentation',
    EXPLANATION = 'Explanation',
    FILE_OPERATIONS = 'FileOperations',
    TERMINAL = 'Terminal',
    GIT = 'Git',
    SEARCH = 'Search',
    MULTI_FILE_EDIT = 'MultiFileEdit',
    COMPLETION = 'Completion',
    VOICE_INPUT = 'VoiceInput',
    CONTEXT_UNDERSTANDING = 'ContextUnderstanding',
    TASK_PLANNING = 'TaskPlanning',
    AGENTIC_EXECUTION = 'AgenticExecution'
}

/**
 * Task types for agent execution
 */
export interface TaskType {
    type: string;
    params: Record<string, unknown>;
}

/**
 * Code context for agent execution
 */
export interface CodeContext {
    file_path?: string;
    code_content?: string;
    language?: string;
    cursor_position?: [number, number];
    selection?: string;
    selection_range?: {
        start: [number, number];
        end: [number, number];
    };
    related_files?: string[];
    project_root?: string;
    description?: string;
    additional_context?: Record<string, unknown>;
}

/**
 * Agent information (matching Rust AgentInfo)
 */
export interface AgentInfo {
    id: string;
    name: string;
    agent_type: AgentTypeCategory;
    version: string;
    capabilities: AgentCapability[];
    status: AgentStatus;
    endpoint?: string;
    priority: number;
    last_seen: number;
    tasks_completed: number;
    avg_response_time_ms: number;
    metadata: Record<string, string>;
    model_tier?: ModelTier;
}

/**
 * Artifact produced by an agent
 */
export interface AgentArtifact {
    type: 'file_change' | 'test' | 'plan' | 'code_snippet' | 'documentation';
    path?: string;
    content?: string;
    change_type?: 'create' | 'modify' | 'delete';
    language?: string;
    steps?: string[];
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
}

/**
 * Result from a single agent execution
 */
export interface AgentResult {
    agent_type: SubagentType | string;
    model: string;
    content: string;
    execution_time_ms: number;
    tokens_used: TokenUsage;
    validated: boolean;
    validation_issues: string[];
    artifacts: AgentArtifact[];
    success: boolean;
    error?: string;
}

/**
 * Result from orchestrated multi-agent execution
 */
export interface OrchestratedResult {
    task_id: string;
    strategy: OrchestrationStrategy;
    results: AgentResult[];
    consensus_result?: AgentResult;
    total_duration_ms: number;
    agents_used: string[];
    success: boolean;
}

/**
 * Pipeline stage result
 */
export interface PipelineStageResult {
    name: string;
    agent_type: SubagentType;
    result: AgentResult;
    duration_ms: number;
}

/**
 * Result from pipeline execution
 */
export interface PipelineResult {
    pipeline_type: string;
    stages: PipelineStageResult[];
    final_output: string;
    total_duration_ms: number;
    success: boolean;
}

/**
 * Model router configuration
 */
export interface ModelRouterConfig {
    default_tier: ModelTier;
    tier_overrides: Record<SubagentType, ModelTier>;
    models: Record<ModelTier, string>;
}

/**
 * Subagent configuration
 */
export interface SubagentConfig {
    agent_type: SubagentType;
    system_prompt: string;
    max_tokens: number;
    temperature: number;
    can_execute: boolean;
    can_modify_files: boolean;
    timeout_secs: number;
}

// =============================================================================
// EXTERNAL AGENT TYPES
// =============================================================================

/**
 * Known external agents
 */
export enum ExternalAgent {
    CLAUDE_CODE = 'claude-code',
    COPILOT = 'copilot',
    CODEX = 'codex',
    GEMINI = 'gemini',
    CURSOR = 'cursor',
    AUGMENT = 'augment'
}

/**
 * External agent configuration
 */
export interface ExternalAgentConfig {
    id: ExternalAgent | string;
    name: string;
    endpoint?: string;
    enabled: boolean;
    priority: number;
    trigger_phrases: string[];
    capabilities: AgentCapability[];
    integration_type: 'mcp' | 'chat_api' | 'language_model' | 'cli';
}

/**
 * Agent routing decision
 */
export interface AgentRouteDecision {
    agent_id: string;
    agent_name: string;
    agent_type: AgentTypeCategory;
    is_internal: boolean;
    confidence: number;
    matched_trigger?: string;
    task: string;
}

// =============================================================================
// VOICE COMMAND TYPES
// =============================================================================

/**
 * Voice command routing result
 */
export interface VoiceRouteResult {
    routed: boolean;
    target_agent?: string;
    is_internal: boolean;
    task: string;
    original_input: string;
    confidence: number;
}

/**
 * Coding command types (matching Rust CodingCommandType)
 */
export enum CodingCommandType {
    NAVIGATE = 'Navigate',
    GENERATE = 'Generate',
    EDIT = 'Edit',
    EXPLAIN = 'Explain',
    EXECUTE = 'Execute',
    GIT = 'Git',
    DEBUG = 'Debug',
    REFACTOR = 'Refactor',
    DOCUMENT = 'Document',
    TEST = 'Test'
}

// =============================================================================
// CHAT PARTICIPANT TYPES
// =============================================================================

/**
 * Chat participant request context
 */
export interface ChatRequestContext {
    history: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    references: Array<{
        type: 'file' | 'selection' | 'symbol';
        uri?: string;
        content?: string;
        range?: {
            start: { line: number; character: number };
            end: { line: number; character: number };
        };
    }>;
}

/**
 * Chat participant command
 */
export interface ChatCommand {
    name: string;
    description: string;
    handler: (args: string, context: ChatRequestContext) => Promise<string>;
}

// =============================================================================
// MCP SERVER TYPES
// =============================================================================

/**
 * MCP Tool definition
 */
export interface McpTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required?: string[];
    };
}

/**
 * MCP Resource definition
 */
export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

/**
 * MCP Server configuration
 */
export interface McpServerConfig {
    name: string;
    version: string;
    capabilities: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
    };
}

// =============================================================================
// LANGUAGE MODEL TOOL TYPES
// =============================================================================

/**
 * Language Model Tool definition for VS Code API
 */
export interface LanguageModelTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    tags?: string[];
}

/**
 * Language Model Tool invocation context
 */
export interface ToolInvocationContext {
    toolName: string;
    parameters: Record<string, unknown>;
    token?: unknown; // CancellationToken
}

/**
 * Language Model Tool result
 */
export interface ToolResult {
    content: string | object;
    error?: string;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Agent event types
 */
export type AgentEventType =
    | 'agent_started'
    | 'agent_completed'
    | 'agent_failed'
    | 'agent_progress'
    | 'pipeline_stage_started'
    | 'pipeline_stage_completed'
    | 'orchestration_started'
    | 'orchestration_completed';

/**
 * Agent event payload
 */
export interface AgentEvent {
    type: AgentEventType;
    agent_id: string;
    agent_type?: SubagentType | string;
    task_id?: string;
    progress?: number;
    message?: string;
    result?: AgentResult;
    timestamp: number;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * VoiceCode agent configuration
 */
export interface AgentConfiguration {
    internal: {
        enabled: boolean;
        default_strategy: OrchestrationStrategy;
        model_routing: ModelRouterConfig;
    };
    external: {
        enabled: boolean;
        agents: ExternalAgentConfig[];
        default_agent?: ExternalAgent;
    };
    voice: {
        enable_agent_routing: boolean;
        require_explicit_trigger: boolean;
    };
}
