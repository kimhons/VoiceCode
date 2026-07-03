/**
 * VoiceCode Agent System
 * Exports all agent-related modules
 *
 * Core Agent System:
 * - InternalAgentBridge - Bridge to 9 internal AI agents
 * - VoiceAgentRouter - Intelligent routing of voice commands
 * - ChatParticipant - VS Code Chat integration (@voicecode)
 * - LanguageModelTools - LM API tools registration
 * - MCPServer - MCP protocol server for external agents
 * - ExternalAgentOrchestrator - Coordination of external agents
 *
 * Extended Capabilities:
 * - AgentCommunication - Agent-to-agent messaging
 * - VSCodeVoiceControl - Hands-free VS Code control
 * - ComputerVision - Screenshot, OCR, UI analysis
 * - WebBrowsingAgent - Web research and documentation
 * - DevToolsIntegration - Build, test, deploy integration
 * - MultiModalContext - Aggregated context from multiple sources
 *
 * Roadmap Features (Competitive Parity):
 * - ApprovalManager - Human-in-the-loop approval workflow (matches Cline)
 * - CheckpointManager - File state snapshots and rewind (matches Claude Code)
 * - CheckpointProvider - Sidebar tree view for checkpoints
 * - BrowserPreview - In-editor web preview (matches Cursor)
 */

// Core bridge to internal agents
export { InternalAgentBridge } from './internalAgentBridge';

// Internal agent commands
export { registerInternalAgentCommands } from './internalAgentCommands';

// Tree view provider for agents
export {
    InternalAgentsProvider,
    registerInternalAgentsTreeView
} from './internalAgentsProvider';

// Voice agent router
export {
    VoiceAgentRouter,
    registerVoiceAgentRouterCommands
} from './voiceAgentRouter';

// Chat participant (@voicecode)
export {
    VoiceCodeChatParticipant,
    registerChatParticipant
} from './chatParticipant';

// Language Model Tools
export {
    LanguageModelToolsProvider,
    registerLanguageModelTools
} from './languageModelTools';

// MCP Server for external agents
export {
    VoiceCodeMCPServer,
    registerMCPServerCommands
} from './mcpServer';

// External agent orchestrator
export {
    ExternalAgentOrchestrator,
    registerExternalAgentOrchestratorCommands
} from './externalAgentOrchestrator';

// =========================================
// Extended Capabilities
// =========================================

// Agent-to-Agent Communication Protocol
export {
    AgentCommunicationHub,
    AgentCollaborationSession,
    getAgentCommunicationHub,
    disposeAgentCommunicationHub,
    MessageType,
    MessagePriority,
    type AgentMessage,
    type SharedAgentContext
} from './agentCommunication';

// VS Code Voice Control System
export {
    VSCodeVoiceControl,
    registerVoiceControlCommands,
    VoiceCommandCategory,
    type VoiceCommand,
    type VoiceCommandResult
} from './vscodeVoiceControl';

// Computer Vision Module
export {
    ComputerVisionProvider,
    registerComputerVisionCommands
} from './computerVision';

// Web Browsing Agent
export {
    WebBrowsingAgent,
    registerWebBrowsingCommands
} from './webBrowsingAgent';

// Developer Tools Integration
export {
    DevToolsIntegration,
    registerDevToolsCommands
} from './devToolsIntegration';

// Multi-Modal Context Provider
export {
    MultiModalContextProvider,
    registerMultiModalContextCommands,
    ContextSourceType,
    type ContextItem,
    type AggregatedContext,
    type ContextQuery
} from './multiModalContext';

// =========================================
// Roadmap Features
// (Competitive Parity: Human-in-the-Loop, Checkpoints, Browser)
// =========================================

// Human-in-the-Loop Approval System
export {
    ApprovalManager,
    getApprovalManager,
    registerApprovalCommands,
    ApprovalStatus,
    type ApprovalRequest,
    type ApprovalDecision,
    type ProposedChange
} from './approvalManager';

// Checkpoint/Rewind System
export {
    CheckpointManager,
    getCheckpointManager,
    registerCheckpointCommands,
    CheckpointStatus,
    CheckpointTrigger,
    type Checkpoint,
    type FileSnapshot,
    type CursorState,
    type CheckpointTree
} from './checkpointManager';

// Checkpoint Tree View Provider
export {
    CheckpointTreeProvider,
    CheckpointTreeItem,
    registerCheckpointTreeView
} from './checkpointProvider';

// Browser Preview Panel
export {
    BrowserPreviewProvider,
    registerBrowserPreviewCommands
} from './browserPreview';
