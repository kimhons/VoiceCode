# VoiceCode VS Code Extension: Comprehensive Enhancement Plan

## Executive Summary

This document provides a thorough review of the VoiceCode VS Code extension, identifies gaps against current VS Code API best practices (2025), and outlines enhancement opportunities to transform it into a **multi-agent orchestration hub** that complements rather than competes with existing AI coding assistants (Claude Code, GitHub Copilot, OpenAI Codex, Gemini, etc.).

---

## Part 1: Current Implementation Review

### Existing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VoiceCode Extension                       │
├─────────────────────────────────────────────────────────────┤
│  extension.ts          │  Main activation, command registration│
│  voicecodeClient.ts    │  WebSocket client to desktop app     │
│  dictation.ts          │  Voice dictation management          │
│  commands.ts           │  Voice command processing            │
│  statusBar.ts          │  Status bar UI management            │
│  historyProvider.ts    │  Dictation history tree view         │
│  commandsProvider.ts   │  Available commands tree view        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                VoiceCode Desktop App (Tauri)                 │
│  - Speech recognition                                        │
│  - Natural language processing                               │
│  - Code vocabulary                                           │
│  - Screen context awareness                                  │
└─────────────────────────────────────────────────────────────┘
```

### Current Features

1. **Voice Dictation**: Start/stop/toggle via commands and hotkeys
2. **Voice Commands**: Text editing, navigation, VS Code actions
3. **Code Operations**: Generate, explain, refactor code
4. **Custom Dictionary**: Add terms with aliases
5. **Status Bar**: Connection and dictation status
6. **Sidebar Views**: History and available commands

### Current Limitations Identified

| Area | Current State | Gap |
|------|---------------|-----|
| **AI Integration** | Custom backend only | No VS Code Language Model API integration |
| **Chat Integration** | None | No Chat Participant for @-mentions |
| **Multi-Agent** | Single backend | No delegation to other agents |
| **MCP Support** | None | No Model Context Protocol server |
| **Tool Registration** | None | No Language Model Tools for agent mode |
| **Streaming** | Basic WebSocket | No `ChatResponseStream` integration |
| **Context** | Manual | No automatic context gathering |
| **Error Handling** | Basic try/catch | No `LanguageModelError` handling |

---

## Part 2: VS Code API Gaps Analysis

### 2.1 Missing: Chat Participant API

**Current**: The extension uses manual input boxes for voice commands.

**Opportunity**: Register a `@voicecode` chat participant that:
- Receives voice transcriptions as chat messages
- Integrates with VS Code's native chat UI
- Supports slash commands (`/dictate`, `/command`, `/generate`)
- Provides follow-up suggestions
- Maintains conversation history with context

**Reference**: [Chat Participant API](https://code.visualstudio.com/api/extension-guides/ai/chat)

### 2.2 Missing: Language Model API Integration

**Current**: All AI operations go through custom WebSocket backend.

**Opportunity**: Use `vscode.lm.selectChatModels()` to:
- Allow users to choose any configured model (Claude, GPT-4o, Gemini, local models)
- Leverage Copilot's language models when available
- Fall back to custom backend when VS Code models unavailable
- Respect user's model preferences and quotas

**Reference**: [Language Model API](https://code.visualstudio.com/api/extension-guides/ai/language-model)

### 2.3 Missing: Language Model Tools

**Current**: Voice commands are processed internally.

**Opportunity**: Register VoiceCode as a Language Model Tool that:
- Can be invoked by Copilot agent mode and other AI assistants
- Provides voice input capability to any agent
- Exposes custom vocabulary and corrections to the LLM
- Enables voice control of multi-step agentic workflows

**Reference**: [Language Model Tool API](https://code.visualstudio.com/api/extension-guides/ai/tools)

### 2.4 Missing: MCP Server

**Current**: No MCP implementation.

**Opportunity**: Create an MCP server that exposes:
- Voice transcription as a tool
- Custom dictionary management
- Screen context capture
- Natural language command execution

This enables Claude Code, Copilot, and other MCP-compatible agents to use VoiceCode capabilities.

**Reference**: [MCP Developer Guide](https://code.visualstudio.com/api/extension-guides/ai/mcp)

### 2.5 Missing: Agent Sessions Integration

**Current**: VoiceCode operates independently.

**Opportunity**: Integrate with VS Code's unified agent experience:
- Appear in Agent Sessions sidebar
- Support task delegation (`@voicecode continue in @copilot`)
- Enable voice control of background agents
- Orchestrate work across local, background, and cloud agents

**Reference**: [Unified Agent Experience](https://code.visualstudio.com/blogs/2025/11/03/unified-agent-experience)

---

## Part 3: Internal Agent System (Existing Infrastructure)

### 3.0 Current Internal Agent Architecture

VoiceCode already has a sophisticated **internal agent system** in the desktop app (Rust) that the VS Code extension should fully expose:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VoiceCode Internal Agent System                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │    Planner      │  │    Explorer     │  │     Coder       │         │
│  │  (Opus tier)    │  │  (Haiku tier)   │  │  (Sonnet tier)  │         │
│  │  - Create plans │  │  - Search code  │  │  - Write code   │         │
│  │  - Design arch  │  │  - Find symbols │  │  - Implement    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │    Reviewer     │  │     Tester      │  │    Debugger     │         │
│  │  (Sonnet tier)  │  │  (Sonnet tier)  │  │  (Sonnet tier)  │         │
│  │  - Code review  │  │  - Gen tests    │  │  - Find bugs    │         │
│  │  - Find issues  │  │  - Run tests    │  │  - Fix issues   │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Documenter    │  │   Refactorer    │  │    Security     │         │
│  │  (Sonnet tier)  │  │  (Sonnet tier)  │  │  (Opus tier)    │         │
│  │  - Write docs   │  │  - Improve code │  │  - OWASP audit  │         │
│  │  - Comments     │  │  - Clean up     │  │  - Vuln scan    │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       CodingAgent (Voice Interface)               │  │
│  │  Commands: Navigate | Generate | Edit | Explain | Execute | Git  │  │
│  │            Debug | Refactor | Document | Test                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Agent Orchestrator                             │  │
│  │  Strategies: SingleAgent | Race | Consensus | Pipeline | Decomp  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Agent Registry                                │  │
│  │  Known External: Claude Code | Codex | Gemini | Cursor | Augment │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Internal Subagent Types (from `subagents.rs`)

| Agent | Model Tier | Capabilities | Voice Triggers |
|-------|------------|--------------|----------------|
| **Planner** | Advanced (Opus) | Create plans, design architecture | "plan", "design", "architect" |
| **Explorer** | Fast (Haiku) | Search code, find symbols, analyze structure | "search", "find", "where" |
| **Coder** | Code (Sonnet) | Write/modify code, implement features | "create", "generate", "write" |
| **Reviewer** | Balanced (Sonnet) | Code review, identify issues, suggest fixes | "review", "check" |
| **Tester** | Balanced (Sonnet) | Generate tests, run test suites | "test", "spec" |
| **Debugger** | Balanced (Sonnet) | Diagnose bugs, trace errors, propose fixes | "debug", "fix", "error", "bug" |
| **Documenter** | Balanced (Sonnet) | Write docs, add comments, explain code | "document", "comment", "explain" |
| **Refactorer** | Balanced (Sonnet) | Improve code structure, clean up | "refactor", "improve", "clean" |
| **Security** | Advanced (Opus) | OWASP audit, vulnerability scanning | "security", "vulnerab" |

### 3.2 Coding Agent Voice Commands (from `coding_agent.rs`)

The `CodingAgent` already supports these voice command types:

```rust
pub enum CodingCommandType {
    Navigate,    // "go to function authenticate"
    Generate,    // "create a function that validates email"
    Edit,        // "rename this variable to userId"
    Explain,     // "what does this function do"
    Execute,     // "run tests"
    Git,         // "commit with message"
    Debug,       // "why is this failing"
    Refactor,    // "extract this to a function"
    Document,    // "add documentation to this function"
    Test,        // "generate tests for this function"
}
```

### 3.3 Orchestration Strategies (from `orchestrator.rs`)

The internal orchestrator supports multiple execution strategies:

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **SingleAgent** | Use best agent for task | Simple, focused tasks |
| **RaceExecution** | Run parallel, take first result | Speed-critical tasks |
| **Consensus** | Run parallel, aggregate results | High-stakes decisions |
| **Pipeline** | Sequential through multiple agents | Complex multi-step tasks |
| **Decomposition** | Split task across specialized agents | Large refactoring |

### 3.4 Gap: VS Code Extension Doesn't Expose Internal Agents

**Current State**: The VS Code extension only calls generic `voicecodeClient` methods. It doesn't:
- Expose the internal subagent types to users
- Allow users to explicitly invoke specific agents
- Show which agent is handling their request
- Let users choose orchestration strategies
- Display agent-specific feedback

**Enhancement Needed**: Bridge the VS Code extension to the internal agent system.

---

## Part 4: Exposing Internal Agents in VS Code Extension

### 4.1 Internal Agent Bridge Implementation

```typescript
// src/internalAgentBridge.ts
import * as vscode from 'vscode';
import { VoiceCodeClient } from './voicecodeClient';

/**
 * Bridge to VoiceCode's internal agent system
 */
export class InternalAgentBridge {
  constructor(private client: VoiceCodeClient) {}

  /**
   * Available internal subagent types
   */
  readonly SubagentTypes = {
    PLANNER: 'planner',
    EXPLORER: 'explorer',
    CODER: 'coder',
    REVIEWER: 'reviewer',
    TESTER: 'tester',
    DEBUGGER: 'debugger',
    DOCUMENTER: 'documenter',
    REFACTORER: 'refactorer',
    SECURITY: 'security'
  } as const;

  /**
   * Available orchestration strategies
   */
  readonly OrchestrationStrategies = {
    SINGLE_AGENT: 'SingleAgent',
    RACE: 'RaceExecution',
    CONSENSUS: 'Consensus',
    PIPELINE: 'Pipeline',
    DECOMPOSITION: 'Decomposition'
  } as const;

  /**
   * Execute with a specific internal agent
   */
  async executeWithAgent(
    agentType: string,
    task: string,
    context: CodeContext
  ): Promise<AgentResult> {
    return this.client.sendRequest('internal_agent/execute', {
      agent_type: agentType,
      task,
      context
    });
  }

  /**
   * Execute with orchestration strategy
   */
  async executeWithStrategy(
    strategy: string,
    taskType: TaskType,
    context: CodeContext
  ): Promise<OrchestratedResult> {
    return this.client.sendRequest('orchestrator/execute', {
      strategy,
      task_type: taskType,
      context
    });
  }

  /**
   * Execute a subagent pipeline
   */
  async executePipeline(
    pipelineType: 'plan_implement_review' | 'explore_plan_implement' | 'custom',
    task: string,
    context: CodeContext
  ): Promise<PipelineResult> {
    return this.client.sendRequest('pipeline/execute', {
      pipeline_type: pipelineType,
      task,
      context
    });
  }

  /**
   * Get available internal agents and their status
   */
  async getAvailableAgents(): Promise<AgentInfo[]> {
    return this.client.sendRequest('agents/list', { type: 'internal' });
  }

  /**
   * Get model configuration for agents
   */
  async getModelConfig(): Promise<ModelRouterConfig> {
    return this.client.sendRequest('agents/model_config', {});
  }
}

interface CodeContext {
  file_path?: string;
  code_content?: string;
  language?: string;
  cursor_position?: [number, number];
  selection?: string;
  related_files?: string[];
}

interface TaskType {
  type: string;
  params: Record<string, unknown>;
}

interface AgentResult {
  agent_type: string;
  model: string;
  content: string;
  execution_time_ms: number;
  artifacts: Artifact[];
}

interface OrchestratedResult {
  task_id: string;
  strategy: string;
  results: AgentResult[];
  consensus_result?: AgentResult;
  agents_used: string[];
}

interface PipelineResult {
  stages: { name: string; result: AgentResult }[];
  final_output: string;
}

interface AgentInfo {
  id: string;
  name: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'offline';
  model_tier: string;
}

interface ModelRouterConfig {
  default_tier: string;
  tier_overrides: Record<string, string>;
  models: Record<string, string>;
}

interface Artifact {
  type: 'file_change' | 'test' | 'plan' | 'code_snippet';
  content: unknown;
}
```

### 4.2 Internal Agent Commands for VS Code

```typescript
// src/commands/internalAgentCommands.ts
import * as vscode from 'vscode';
import { InternalAgentBridge } from '../internalAgentBridge';

export function registerInternalAgentCommands(
  context: vscode.ExtensionContext,
  bridge: InternalAgentBridge
) {
  // Quick pick for agent selection
  context.subscriptions.push(
    vscode.commands.registerCommand('voicecode.selectInternalAgent', async () => {
      const agents = await bridge.getAvailableAgents();

      const selected = await vscode.window.showQuickPick(
        agents.map(a => ({
          label: `$(${getAgentIcon(a.name)}) ${a.name}`,
          description: a.model_tier,
          detail: a.capabilities.join(', '),
          agent: a
        })),
        { placeHolder: 'Select an internal agent' }
      );

      if (selected) {
        vscode.window.showInformationMessage(
          `Selected ${selected.agent.name} agent`
        );
        return selected.agent;
      }
    })
  );

  // Plan task
  context.subscriptions.push(
    vscode.commands.registerCommand('voicecode.planTask', async () => {
      const task = await vscode.window.showInputBox({
        prompt: 'What would you like to plan?',
        placeHolder: 'Describe the feature or task...'
      });

      if (task) {
        const context = await getCurrentContext();
        const result = await bridge.executeWithAgent(
          bridge.SubagentTypes.PLANNER,
          task,
          context
        );
        showAgentResult(result);
      }
    })
  );

  // Explore codebase
  context.subscriptions.push(
    vscode.commands.registerCommand('voicecode.exploreCode', async () => {
      const query = await vscode.window.showInputBox({
        prompt: 'What are you looking for?',
        placeHolder: 'Search for symbols, files, patterns...'
      });

      if (query) {
        const context = await getCurrentContext();
        const result = await bridge.executeWithAgent(
          bridge.SubagentTypes.EXPLORER,
          query,
          context
        );
        showAgentResult(result);
      }
    })
  );

  // Code review with internal reviewer
  context.subscriptions.push(
    vscode.commands.registerCommand('voicecode.reviewCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const code = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);

      const result = await bridge.executeWithAgent(
        bridge.SubagentTypes.REVIEWER,
        'Review this code for issues and improvements',
        {
          file_path: editor.document.uri.fsPath,
          code_content: code,
          language: editor.document.languageId
        }
      );

      showAgentResult(result);
    })
  );

  // Security audit
  context.subscriptions.push(
    vscode.commands.registerCommand('voicecode.securityAudit', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const result = await bridge.executeWithAgent(
        bridge.SubagentTypes.SECURITY,
        'Audit for security vulnerabilities (OWASP Top 10)',
        {
          file_path: editor.document.uri.fsPath,
          code_content: editor.document.getText(),
          language: editor.document.languageId
        }
      );

      showAgentResult(result);
    })
  );

  // Execute with orchestration strategy
  context.subscriptions.push(
    vscode.commands.registerCommand('voicecode.executeWithStrategy', async () => {
      const strategyOptions = [
        { label: '$(zap) Single Agent', description: 'Best agent for task', value: 'SingleAgent' },
        { label: '$(flame) Race', description: 'Parallel, first wins', value: 'RaceExecution' },
        { label: '$(law) Consensus', description: 'Multiple agents agree', value: 'Consensus' },
        { label: '$(git-merge) Pipeline', description: 'Sequential stages', value: 'Pipeline' },
        { label: '$(split-horizontal) Decompose', description: 'Split across agents', value: 'Decomposition' }
      ];

      const strategy = await vscode.window.showQuickPick(strategyOptions, {
        placeHolder: 'Select orchestration strategy'
      });

      if (strategy) {
        const task = await vscode.window.showInputBox({
          prompt: 'Describe the task'
        });

        if (task) {
          const context = await getCurrentContext();
          const result = await bridge.executeWithStrategy(
            strategy.value,
            { type: 'CodeGeneration', params: { description: task } },
            context
          );
          showOrchestratedResult(result);
        }
      }
    })
  );

  // Run plan-implement-review pipeline
  context.subscriptions.push(
    vscode.commands.registerCommand('voicecode.runPipeline', async () => {
      const task = await vscode.window.showInputBox({
        prompt: 'Describe what you want to build',
        placeHolder: 'The Planner will create a plan, Coder will implement, Reviewer will check'
      });

      if (task) {
        const context = await getCurrentContext();

        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: 'Running agent pipeline...',
          cancellable: true
        }, async (progress) => {
          progress.report({ message: 'Planning...' });
          const result = await bridge.executePipeline(
            'plan_implement_review',
            task,
            context
          );

          for (const stage of result.stages) {
            progress.report({ message: `${stage.name} complete` });
          }

          showPipelineResult(result);
        });
      }
    })
  );
}

function getAgentIcon(agentName: string): string {
  const icons: Record<string, string> = {
    Planner: 'checklist',
    Explorer: 'search',
    Coder: 'code',
    Reviewer: 'eye',
    Tester: 'beaker',
    Debugger: 'bug',
    Documenter: 'book',
    Refactorer: 'wrench',
    Security: 'shield'
  };
  return icons[agentName] || 'robot';
}

async function getCurrentContext(): Promise<CodeContext> {
  const editor = vscode.window.activeTextEditor;
  return {
    file_path: editor?.document.uri.fsPath,
    code_content: editor?.document.getText(),
    language: editor?.document.languageId,
    cursor_position: editor
      ? [editor.selection.active.line, editor.selection.active.character]
      : undefined,
    selection: editor?.selection.isEmpty
      ? undefined
      : editor?.document.getText(editor.selection)
  };
}

function showAgentResult(result: AgentResult): void {
  const panel = vscode.window.createOutputChannel('VoiceCode Agent');
  panel.appendLine(`=== ${result.agent_type.toUpperCase()} Agent ===`);
  panel.appendLine(`Model: ${result.model}`);
  panel.appendLine(`Time: ${result.execution_time_ms}ms`);
  panel.appendLine('');
  panel.appendLine(result.content);
  panel.show();
}

function showOrchestratedResult(result: OrchestratedResult): void {
  const panel = vscode.window.createOutputChannel('VoiceCode Orchestrator');
  panel.appendLine(`=== ${result.strategy} Orchestration ===`);
  panel.appendLine(`Agents: ${result.agents_used.join(', ')}`);
  panel.appendLine('');
  if (result.consensus_result) {
    panel.appendLine('=== Consensus Result ===');
    panel.appendLine(result.consensus_result.content);
  }
  panel.show();
}

function showPipelineResult(result: PipelineResult): void {
  const panel = vscode.window.createOutputChannel('VoiceCode Pipeline');
  for (const stage of result.stages) {
    panel.appendLine(`=== ${stage.name} (${stage.result.agent_type}) ===`);
    panel.appendLine(stage.result.content);
    panel.appendLine('');
  }
  panel.show();
}
```

### 4.3 Internal Agent Tree View

```typescript
// src/views/internalAgentsProvider.ts
import * as vscode from 'vscode';
import { InternalAgentBridge } from '../internalAgentBridge';

export class InternalAgentsProvider implements vscode.TreeDataProvider<AgentTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<AgentTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private bridge: InternalAgentBridge) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: AgentTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: AgentTreeItem): Promise<AgentTreeItem[]> {
    if (!element) {
      // Root level - show categories
      return [
        new AgentTreeItem('Internal Agents', 'robot', vscode.TreeItemCollapsibleState.Expanded, 'category'),
        new AgentTreeItem('Pipelines', 'git-merge', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
        new AgentTreeItem('Strategies', 'symbol-misc', vscode.TreeItemCollapsibleState.Collapsed, 'category')
      ];
    }

    if (element.contextValue === 'category') {
      switch (element.label) {
        case 'Internal Agents':
          const agents = await this.bridge.getAvailableAgents();
          return agents.map(a => new AgentTreeItem(
            a.name,
            getAgentIcon(a.name),
            vscode.TreeItemCollapsibleState.None,
            'agent',
            a
          ));

        case 'Pipelines':
          return [
            new AgentTreeItem('Plan → Implement → Review', 'checklist', vscode.TreeItemCollapsibleState.None, 'pipeline'),
            new AgentTreeItem('Explore → Plan → Implement', 'search', vscode.TreeItemCollapsibleState.None, 'pipeline'),
            new AgentTreeItem('Debug → Fix → Test', 'bug', vscode.TreeItemCollapsibleState.None, 'pipeline')
          ];

        case 'Strategies':
          return [
            new AgentTreeItem('Single Agent', 'zap', vscode.TreeItemCollapsibleState.None, 'strategy'),
            new AgentTreeItem('Race Execution', 'flame', vscode.TreeItemCollapsibleState.None, 'strategy'),
            new AgentTreeItem('Consensus', 'law', vscode.TreeItemCollapsibleState.None, 'strategy'),
            new AgentTreeItem('Pipeline', 'git-merge', vscode.TreeItemCollapsibleState.None, 'strategy'),
            new AgentTreeItem('Decomposition', 'split-horizontal', vscode.TreeItemCollapsibleState.None, 'strategy')
          ];
      }
    }

    return [];
  }
}

class AgentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly iconId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly agentInfo?: AgentInfo
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon(iconId);

    if (agentInfo) {
      this.description = agentInfo.model_tier;
      this.tooltip = `${agentInfo.name}\nCapabilities: ${agentInfo.capabilities.join(', ')}\nStatus: ${agentInfo.status}`;
      this.command = {
        command: 'voicecode.useInternalAgent',
        title: 'Use Agent',
        arguments: [agentInfo]
      };
    }
  }
}

function getAgentIcon(name: string): string {
  const icons: Record<string, string> = {
    Planner: 'checklist',
    Explorer: 'search',
    Coder: 'code',
    Reviewer: 'eye',
    Tester: 'beaker',
    Debugger: 'bug',
    Documenter: 'book',
    Refactorer: 'wrench',
    Security: 'shield'
  };
  return icons[name] || 'robot';
}
```

### 4.4 Voice Triggers for Internal Agents

The extension should recognize voice triggers that map to specific internal agents:

```typescript
// src/voiceAgentRouter.ts

interface VoiceAgentMapping {
  patterns: RegExp[];
  internalAgent: string;
  description: string;
}

const INTERNAL_AGENT_MAPPINGS: VoiceAgentMapping[] = [
  {
    patterns: [/^plan\s+/i, /^design\s+/i, /^architect\s+/i],
    internalAgent: 'planner',
    description: 'Create implementation plan'
  },
  {
    patterns: [/^search\s+/i, /^find\s+/i, /^where\s+/i, /^look\s+for\s+/i],
    internalAgent: 'explorer',
    description: 'Search codebase'
  },
  {
    patterns: [/^create\s+/i, /^generate\s+/i, /^write\s+/i, /^implement\s+/i],
    internalAgent: 'coder',
    description: 'Generate code'
  },
  {
    patterns: [/^review\s+/i, /^check\s+/i],
    internalAgent: 'reviewer',
    description: 'Review code'
  },
  {
    patterns: [/^test\s+/i, /^generate\s+tests?\s+/i, /^write\s+tests?\s+/i],
    internalAgent: 'tester',
    description: 'Generate tests'
  },
  {
    patterns: [/^debug\s+/i, /^fix\s+/i, /why\s+is\s+.*\s+(failing|broken|error)/i],
    internalAgent: 'debugger',
    description: 'Debug issue'
  },
  {
    patterns: [/^document\s+/i, /^add\s+docs?\s+/i, /^add\s+comments?\s+/i],
    internalAgent: 'documenter',
    description: 'Add documentation'
  },
  {
    patterns: [/^refactor\s+/i, /^improve\s+/i, /^clean\s+up\s+/i],
    internalAgent: 'refactorer',
    description: 'Refactor code'
  },
  {
    patterns: [/^security\s+/i, /^audit\s+/i, /^check.*vulnerab/i],
    internalAgent: 'security',
    description: 'Security audit'
  }
];

export function routeToInternalAgent(voiceInput: string): { agent: string; task: string } | null {
  const input = voiceInput.trim();

  for (const mapping of INTERNAL_AGENT_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      const match = input.match(pattern);
      if (match) {
        const task = input.replace(pattern, '').trim();
        return {
          agent: mapping.internalAgent,
          task: task || input
        };
      }
    }
  }

  return null; // Let orchestrator decide
}
```

---

## Part 5: Enhancement Opportunities for External Multi-Agent Orchestration

### 5.1 Voice-Controlled Agent Router

**Concept**: VoiceCode becomes the voice interface to ALL coding agents.

```
User speaks: "Hey Claude, refactor this function to use async await"
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    VoiceCode Agent Router                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Speech → Text → Intent Detection → Agent Selection      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐                │
│         ▼                 ▼                 ▼                │
│    ┌─────────┐      ┌──────────┐      ┌─────────┐           │
│    │ Claude  │      │ Copilot  │      │  Codex  │           │
│    │  Code   │      │  Agent   │      │  Agent  │           │
│    └─────────┘      └──────────┘      └─────────┘           │
└──────────────────────────────────────────────────────────────┘
```

**Voice Triggers**:
- "Hey Claude, ..." → Routes to Claude Code
- "Hey Copilot, ..." → Routes to GitHub Copilot
- "Hey Codex, ..." → Routes to OpenAI Codex
- "Generate..." (no prefix) → Uses default/auto agent

### 3.2 Agent Capability Discovery

**Concept**: VoiceCode discovers what agents are available and their capabilities.

```typescript
interface AgentCapabilities {
  name: string;
  triggerPhrases: string[];
  capabilities: ('generate' | 'refactor' | 'explain' | 'debug' | 'test')[];
  contextWindow: number;
  supportsStreaming: boolean;
  requiresAuthentication: boolean;
}

// Example discovered agents
const agents: AgentCapabilities[] = [
  {
    name: 'claude-code',
    triggerPhrases: ['claude', 'hey claude', 'ask claude'],
    capabilities: ['generate', 'refactor', 'explain', 'debug', 'test'],
    contextWindow: 200000,
    supportsStreaming: true,
    requiresAuthentication: true
  },
  {
    name: 'github-copilot',
    triggerPhrases: ['copilot', 'hey copilot'],
    capabilities: ['generate', 'refactor', 'explain'],
    contextWindow: 64000,
    supportsStreaming: true,
    requiresAuthentication: true
  }
];
```

### 3.3 Voice-First Agentic Workflows

**Concept**: Enable complex multi-step workflows via voice.

**Example Workflow**:
```
User: "Create a new API endpoint for user authentication"

VoiceCode:
1. [PLAN] "I'll create a plan with Copilot. Say 'looks good' to proceed or describe changes."
2. [GENERATE] "Generating the endpoint code with Claude..."
3. [TEST] "Writing tests with Codex..."
4. [REVIEW] "Here's what I created. Say 'commit' to save or 'change X to Y' to modify."
```

### 3.4 Context Bridge

**Concept**: VoiceCode provides rich context to all agents.

```typescript
interface VoiceCodeContext {
  // Screen context from desktop app
  activeApplication: string;
  activeFile: string;
  currentLanguage: string;
  gitBranch: string;

  // Voice-specific context
  recentTranscriptions: string[];
  customVocabulary: VocabularyTerm[];
  userCorrections: Correction[];

  // Workspace context
  openFiles: string[];
  selection: string;
  cursorPosition: Position;
  diagnostics: Diagnostic[];
}
```

---

## Part 4: Detailed Implementation Plan

### Phase 1: VS Code API Modernization (2 weeks)

#### 1.1 Chat Participant Implementation

```typescript
// package.json additions
{
  "contributes": {
    "chatParticipants": [{
      "id": "voicecode.assistant",
      "name": "voicecode",
      "fullName": "VoiceCode Assistant",
      "description": "Voice-controlled coding with multi-agent support",
      "isSticky": false,
      "commands": [
        { "name": "dictate", "description": "Start voice dictation" },
        { "name": "command", "description": "Execute a voice command" },
        { "name": "agents", "description": "List available AI agents" },
        { "name": "delegate", "description": "Delegate task to another agent" }
      ]
    }]
  }
}
```

```typescript
// src/chatParticipant.ts
import * as vscode from 'vscode';

export function registerChatParticipant(context: vscode.ExtensionContext) {
  const participant = vscode.chat.createChatParticipant(
    'voicecode.assistant',
    async (request, context, response, token) => {
      const { command, prompt } = request;

      switch (command?.name) {
        case 'dictate':
          return handleDictateCommand(response, token);
        case 'delegate':
          return handleDelegateCommand(prompt, response, token);
        default:
          return handleVoiceInput(prompt, response, token);
      }
    }
  );

  participant.iconPath = vscode.Uri.joinPath(
    context.extensionUri,
    'media',
    'microphone.svg'
  );

  // Provide follow-up suggestions
  participant.followupProvider = {
    provideFollowups(result, context, token) {
      return [
        { prompt: 'Explain what you just did', participant: 'voicecode.assistant' },
        { prompt: 'Run the tests', participant: 'voicecode.assistant' },
        { prompt: 'Commit these changes', participant: 'voicecode.assistant' }
      ];
    }
  };

  context.subscriptions.push(participant);
}
```

#### 1.2 Language Model API Integration

```typescript
// src/languageModelBridge.ts
import * as vscode from 'vscode';

export class LanguageModelBridge {
  private models: vscode.LanguageModelChat[] = [];

  async initialize(): Promise<void> {
    // Try to get available models
    this.models = await vscode.lm.selectChatModels({
      vendor: 'copilot'
    });

    if (this.models.length === 0) {
      // Fall back to any available model
      this.models = await vscode.lm.selectChatModels();
    }
  }

  async processVoiceInput(
    transcription: string,
    context: VoiceCodeContext
  ): Promise<string> {
    if (this.models.length === 0) {
      throw new Error('No language models available');
    }

    const model = this.selectBestModel(transcription);

    const messages = [
      vscode.LanguageModelChatMessage.User(
        this.buildPrompt(transcription, context)
      )
    ];

    const response = await model.sendRequest(
      messages,
      {},
      new vscode.CancellationTokenSource().token
    );

    let result = '';
    for await (const chunk of response.text) {
      result += chunk;
    }

    return result;
  }

  private selectBestModel(input: string): vscode.LanguageModelChat {
    // Select model based on task complexity
    const isComplex = input.length > 100 ||
                      input.includes('refactor') ||
                      input.includes('explain');

    // Prefer GPT-4o for complex tasks, GPT-4o-mini for simple ones
    const preferred = isComplex ? 'gpt-4o' : 'gpt-4o-mini';

    return this.models.find(m => m.family === preferred) || this.models[0];
  }

  private buildPrompt(transcription: string, context: VoiceCodeContext): string {
    return `You are a voice-controlled coding assistant. The user spoke:
"${transcription}"

Current context:
- File: ${context.activeFile}
- Language: ${context.currentLanguage}
- Git branch: ${context.gitBranch}
${context.selection ? `- Selected code:\n\`\`\`\n${context.selection}\n\`\`\`` : ''}

Respond with the appropriate action. If the user is dictating code, provide the code.
If they're giving a command, execute it. If they're asking a question, answer it.`;
  }
}
```

#### 1.3 Language Model Tool Registration

```typescript
// package.json additions
{
  "contributes": {
    "languageModelTools": [{
      "name": "voicecode_transcribe",
      "displayName": "Voice Transcription",
      "modelDescription": "Captures voice input from the user and returns transcribed text. Use this when you need verbal input from the user or want to enable hands-free interaction.",
      "toolReferenceName": "voice",
      "inputSchema": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "description": "Optional prompt to display to the user before capturing voice"
          },
          "timeout": {
            "type": "number",
            "description": "Maximum recording time in seconds (default: 30)"
          }
        }
      }
    }, {
      "name": "voicecode_execute_command",
      "displayName": "Execute Voice Command",
      "modelDescription": "Executes a natural language command as if spoken by the user. Supports text editing commands like 'change X to Y', navigation commands, and VS Code actions.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "The natural language command to execute"
          }
        },
        "required": ["command"]
      }
    }]
  }
}
```

```typescript
// src/languageModelTools.ts
import * as vscode from 'vscode';

export function registerLanguageModelTools(
  context: vscode.ExtensionContext,
  voicecodeClient: VoiceCodeClient
) {
  // Voice transcription tool
  const transcribeTool = vscode.lm.registerTool(
    'voicecode_transcribe',
    {
      async invoke(options, token) {
        const { prompt, timeout = 30 } = options.input as {
          prompt?: string;
          timeout?: number;
        };

        if (prompt) {
          vscode.window.showInformationMessage(prompt);
        }

        // Start recording and wait for result
        const transcription = await voicecodeClient.captureVoice(timeout);

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(transcription)
        ]);
      }
    }
  );

  // Voice command tool
  const commandTool = vscode.lm.registerTool(
    'voicecode_execute_command',
    {
      async invoke(options, token) {
        const { command } = options.input as { command: string };

        const result = await voicecodeClient.executeCommand(command);

        return new vscode.LanguageModelToolResult([
          new vscode.LanguageModelTextPart(
            result.success
              ? `Command executed: ${result.message}`
              : `Command failed: ${result.message}`
          )
        ]);
      }
    }
  );

  context.subscriptions.push(transcribeTool, commandTool);
}
```

### Phase 2: MCP Server Implementation (2 weeks)

#### 2.1 MCP Server Definition

```typescript
// src/mcpServer.ts
import * as vscode from 'vscode';

export function registerMcpServer(context: vscode.ExtensionContext) {
  const provider = vscode.lm.registerMcpServerDefinitionProvider(
    'voicecode',
    {
      provideMcpServerDefinitions() {
        return [{
          label: 'VoiceCode MCP Server',
          serverInfo: {
            command: 'node',
            args: [
              context.asAbsolutePath('out/mcp/server.js')
            ],
            env: {}
          }
        }];
      }
    }
  );

  context.subscriptions.push(provider);
}
```

#### 2.2 MCP Tools Implementation

```typescript
// src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'voicecode-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Voice capture tool
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'capture_voice',
      description: 'Capture voice input from the user and return transcribed text',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Prompt to show before recording' },
          language: { type: 'string', description: 'Expected language (default: en-US)' }
        }
      }
    },
    {
      name: 'get_custom_vocabulary',
      description: 'Get the user\'s custom vocabulary terms for better transcription',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'add_vocabulary_term',
      description: 'Add a term to the custom vocabulary',
      inputSchema: {
        type: 'object',
        properties: {
          term: { type: 'string', description: 'The canonical form of the term' },
          aliases: {
            type: 'array',
            items: { type: 'string' },
            description: 'Alternative pronunciations or spellings'
          }
        },
        required: ['term']
      }
    },
    {
      name: 'execute_voice_command',
      description: 'Execute a natural language editing command',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Natural language command' }
        },
        required: ['command']
      }
    }
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'capture_voice':
      return handleVoiceCapture(args);
    case 'get_custom_vocabulary':
      return handleGetVocabulary();
    case 'add_vocabulary_term':
      return handleAddTerm(args);
    case 'execute_voice_command':
      return handleExecuteCommand(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Resources for context
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'voicecode://context/current',
      name: 'Current VoiceCode Context',
      description: 'Current screen context, active application, and recent transcriptions',
      mimeType: 'application/json'
    },
    {
      uri: 'voicecode://vocabulary/custom',
      name: 'Custom Vocabulary',
      description: 'User\'s custom vocabulary terms and corrections',
      mimeType: 'application/json'
    }
  ]
}));

const transport = new StdioServerTransport();
server.connect(transport);
```

### Phase 3: Multi-Agent Orchestration (3 weeks)

#### 3.1 Agent Discovery and Registration

```typescript
// src/agentOrchestrator.ts
import * as vscode from 'vscode';

interface RegisteredAgent {
  id: string;
  name: string;
  triggerPhrases: string[];
  chatParticipantId?: string;
  extensionId?: string;
  capabilities: AgentCapability[];
}

type AgentCapability =
  | 'code_generation'
  | 'code_explanation'
  | 'code_refactoring'
  | 'debugging'
  | 'testing'
  | 'documentation'
  | 'git_operations';

export class AgentOrchestrator {
  private agents: Map<string, RegisteredAgent> = new Map();
  private defaultAgent: string = 'copilot';

  constructor() {
    this.discoverAgents();
  }

  private async discoverAgents(): Promise<void> {
    // Discover built-in agents
    this.registerAgent({
      id: 'copilot',
      name: 'GitHub Copilot',
      triggerPhrases: ['copilot', 'hey copilot', 'github'],
      chatParticipantId: 'github.copilot',
      capabilities: ['code_generation', 'code_explanation', 'code_refactoring']
    });

    // Discover Claude Code if installed
    const claudeExtension = vscode.extensions.getExtension('anthropic.claude-code');
    if (claudeExtension) {
      this.registerAgent({
        id: 'claude',
        name: 'Claude Code',
        triggerPhrases: ['claude', 'hey claude', 'anthropic'],
        extensionId: 'anthropic.claude-code',
        capabilities: ['code_generation', 'code_explanation', 'code_refactoring', 'debugging']
      });
    }

    // Discover OpenAI Codex if installed
    const codexExtension = vscode.extensions.getExtension('openai.codex');
    if (codexExtension) {
      this.registerAgent({
        id: 'codex',
        name: 'OpenAI Codex',
        triggerPhrases: ['codex', 'openai', 'gpt'],
        extensionId: 'openai.codex',
        capabilities: ['code_generation', 'code_explanation']
      });
    }

    // Listen for new extensions
    vscode.extensions.onDidChange(() => this.discoverAgents());
  }

  private registerAgent(agent: RegisteredAgent): void {
    this.agents.set(agent.id, agent);
  }

  async routeVoiceInput(transcription: string): Promise<AgentRouteResult> {
    const normalizedInput = transcription.toLowerCase().trim();

    // Check for explicit agent mentions
    for (const [id, agent] of this.agents) {
      for (const trigger of agent.triggerPhrases) {
        if (normalizedInput.startsWith(trigger)) {
          const command = normalizedInput
            .slice(trigger.length)
            .trim()
            .replace(/^[,.]?\s*/, ''); // Remove leading punctuation

          return {
            agentId: id,
            agent,
            command,
            confidence: 1.0
          };
        }
      }
    }

    // Analyze intent to select best agent
    const intent = await this.analyzeIntent(transcription);
    const bestAgent = this.selectAgentForIntent(intent);

    return {
      agentId: bestAgent.id,
      agent: bestAgent,
      command: transcription,
      confidence: intent.confidence
    };
  }

  private async analyzeIntent(input: string): Promise<IntentAnalysis> {
    // Use local heuristics first
    const keywords = {
      code_generation: ['create', 'generate', 'write', 'make', 'build'],
      code_explanation: ['explain', 'what does', 'how does', 'why'],
      code_refactoring: ['refactor', 'improve', 'clean up', 'optimize'],
      debugging: ['debug', 'fix', 'error', 'bug', 'issue'],
      testing: ['test', 'spec', 'coverage', 'unit test'],
      git_operations: ['commit', 'push', 'pull', 'branch', 'merge']
    };

    const lowerInput = input.toLowerCase();
    const detectedCapabilities: AgentCapability[] = [];

    for (const [capability, words] of Object.entries(keywords)) {
      if (words.some(word => lowerInput.includes(word))) {
        detectedCapabilities.push(capability as AgentCapability);
      }
    }

    return {
      capabilities: detectedCapabilities,
      confidence: detectedCapabilities.length > 0 ? 0.8 : 0.5
    };
  }

  private selectAgentForIntent(intent: IntentAnalysis): RegisteredAgent {
    // Find agent with best capability match
    let bestScore = 0;
    let bestAgent = this.agents.get(this.defaultAgent)!;

    for (const [id, agent] of this.agents) {
      const score = intent.capabilities.filter(
        cap => agent.capabilities.includes(cap)
      ).length;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  async delegateToAgent(
    agentId: string,
    command: string,
    context: VoiceCodeContext
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // Use chat participant if available
    if (agent.chatParticipantId) {
      return this.delegateViaChatParticipant(agent, command, context);
    }

    // Fall back to extension API
    if (agent.extensionId) {
      return this.delegateViaExtension(agent, command, context);
    }

    throw new Error(`No delegation method available for agent: ${agentId}`);
  }

  private async delegateViaChatParticipant(
    agent: RegisteredAgent,
    command: string,
    context: VoiceCodeContext
  ): Promise<AgentResponse> {
    // Send message to chat participant
    await vscode.commands.executeCommand(
      'workbench.action.chat.open',
      { query: `@${agent.name} ${command}` }
    );

    return {
      agentId: agent.id,
      status: 'delegated',
      message: `Task delegated to ${agent.name}`
    };
  }
}
```

#### 3.2 Voice-to-Agent Pipeline

```typescript
// src/voiceAgentPipeline.ts
import * as vscode from 'vscode';

export class VoiceAgentPipeline {
  private orchestrator: AgentOrchestrator;
  private contextProvider: ContextProvider;
  private feedbackLoop: FeedbackLoop;

  async processVoiceInput(transcription: string): Promise<void> {
    // 1. Gather context
    const context = await this.contextProvider.gatherContext();

    // 2. Route to appropriate agent
    const route = await this.orchestrator.routeVoiceInput(transcription);

    // 3. Show routing decision if confidence is low
    if (route.confidence < 0.8) {
      const confirmed = await this.confirmRouting(route);
      if (!confirmed) {
        return;
      }
    }

    // 4. Delegate to agent
    const response = await this.orchestrator.delegateToAgent(
      route.agentId,
      route.command,
      context
    );

    // 5. Provide voice feedback
    await this.provideFeedback(response);

    // 6. Learn from interaction
    await this.feedbackLoop.recordInteraction({
      transcription,
      route,
      response,
      context
    });
  }

  private async confirmRouting(route: AgentRouteResult): Promise<boolean> {
    const choice = await vscode.window.showQuickPick([
      {
        label: `$(check) Yes, use ${route.agent.name}`,
        value: 'confirm'
      },
      {
        label: '$(list-selection) Choose different agent',
        value: 'choose'
      },
      {
        label: '$(close) Cancel',
        value: 'cancel'
      }
    ], {
      placeHolder: `Route "${route.command}" to ${route.agent.name}?`
    });

    if (choice?.value === 'choose') {
      const agents = Array.from(this.orchestrator.agents.values());
      const selected = await vscode.window.showQuickPick(
        agents.map(a => ({ label: a.name, value: a.id })),
        { placeHolder: 'Select agent' }
      );

      if (selected) {
        route.agentId = selected.value;
        route.agent = this.orchestrator.agents.get(selected.value)!;
        return true;
      }
      return false;
    }

    return choice?.value === 'confirm';
  }
}
```

### Phase 4: Enhanced User Experience (2 weeks)

#### 4.1 Webview-based Voice Control Panel

```typescript
// src/voicePanel.ts
import * as vscode from 'vscode';

export class VoiceControlPanel {
  public static currentPanel: VoiceControlPanel | undefined;
  private readonly panel: vscode.WebviewPanel;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (VoiceControlPanel.currentPanel) {
      VoiceControlPanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'voicecodePanel',
      'VoiceCode',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media')
        ]
      }
    );

    VoiceControlPanel.currentPanel = new VoiceControlPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.panel.webview.html = this.getHtmlContent(extensionUri);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.type) {
          case 'startDictation':
            vscode.commands.executeCommand('voicecode.startDictation');
            break;
          case 'selectAgent':
            this.handleAgentSelection(message.agentId);
            break;
          case 'executeCommand':
            this.handleVoiceCommand(message.command);
            break;
        }
      }
    );
  }

  private getHtmlContent(extensionUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VoiceCode</title>
      <style>
        body { font-family: var(--vscode-font-family); padding: 20px; }
        .agent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .agent-card {
          padding: 15px;
          border: 1px solid var(--vscode-panel-border);
          border-radius: 8px;
          cursor: pointer;
        }
        .agent-card:hover { background: var(--vscode-list-hoverBackground); }
        .agent-card.active {
          border-color: var(--vscode-focusBorder);
          background: var(--vscode-list-activeSelectionBackground);
        }
        .voice-button {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          font-size: 24px;
          cursor: pointer;
          margin: 20px auto;
          display: block;
        }
        .voice-button.recording {
          background: var(--vscode-inputValidation-errorBackground);
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .transcription {
          min-height: 100px;
          padding: 15px;
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          margin: 20px 0;
        }
        .status { text-align: center; color: var(--vscode-descriptionForeground); }
      </style>
    </head>
    <body>
      <h2>VoiceCode Multi-Agent Assistant</h2>

      <h3>Available Agents</h3>
      <div class="agent-grid" id="agents">
        <!-- Populated dynamically -->
      </div>

      <button class="voice-button" id="voiceBtn">🎤</button>
      <p class="status" id="status">Press to start dictation</p>

      <div class="transcription" id="transcription">
        <em>Your transcription will appear here...</em>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        // Agent selection
        document.getElementById('agents').addEventListener('click', (e) => {
          const card = e.target.closest('.agent-card');
          if (card) {
            document.querySelectorAll('.agent-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            vscode.postMessage({ type: 'selectAgent', agentId: card.dataset.agentId });
          }
        });

        // Voice button
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.addEventListener('click', () => {
          vscode.postMessage({ type: 'startDictation' });
        });

        // Receive messages from extension
        window.addEventListener('message', event => {
          const message = event.data;
          switch (message.type) {
            case 'transcription':
              document.getElementById('transcription').textContent = message.text;
              break;
            case 'status':
              document.getElementById('status').textContent = message.text;
              voiceBtn.classList.toggle('recording', message.recording);
              break;
            case 'agents':
              renderAgents(message.agents);
              break;
          }
        });

        function renderAgents(agents) {
          const container = document.getElementById('agents');
          container.innerHTML = agents.map(a => \`
            <div class="agent-card" data-agent-id="\${a.id}">
              <strong>\${a.name}</strong>
              <p>\${a.capabilities.join(', ')}</p>
            </div>
          \`).join('');
        }
      </script>
    </body>
    </html>`;
  }
}
```

#### 4.2 Voice Feedback System

```typescript
// src/voiceFeedback.ts
import * as vscode from 'vscode';

export class VoiceFeedbackSystem {
  private outputChannel: vscode.OutputChannel;
  private statusBar: StatusBarManager;

  constructor(statusBar: StatusBarManager) {
    this.outputChannel = vscode.window.createOutputChannel('VoiceCode');
    this.statusBar = statusBar;
  }

  // Visual feedback
  showListening(): void {
    this.statusBar.setDictating(true);
  }

  showProcessing(message: string): void {
    this.statusBar.showProcessing(message);
  }

  showSuccess(message: string): void {
    this.statusBar.showSuccess(message);
    vscode.window.setStatusBarMessage(`✓ ${message}`, 3000);
  }

  showError(message: string): void {
    this.statusBar.showError(message);
    vscode.window.showErrorMessage(`VoiceCode: ${message}`);
  }

  // Inline preview for dictation
  async showInlinePreview(
    editor: vscode.TextEditor,
    text: string,
    position: vscode.Position
  ): Promise<void> {
    const decoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: text,
        color: new vscode.ThemeColor('editorGhostText.foreground'),
        fontStyle: 'italic'
      }
    });

    editor.setDecorations(decoration, [new vscode.Range(position, position)]);

    // Auto-remove after delay
    setTimeout(() => decoration.dispose(), 2000);
  }

  // Confirmation dialog for destructive actions
  async confirmAction(action: string, details: string): Promise<boolean> {
    const result = await vscode.window.showWarningMessage(
      `VoiceCode will ${action}`,
      { modal: true, detail: details },
      'Proceed',
      'Cancel'
    );

    return result === 'Proceed';
  }

  // Agent routing notification
  async notifyAgentRouting(agentName: string, command: string): Promise<void> {
    const item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );

    item.text = `$(arrow-right) ${agentName}`;
    item.tooltip = `Routing to ${agentName}: "${command}"`;
    item.show();

    setTimeout(() => item.dispose(), 3000);
  }
}
```

---

## Part 5: Configuration Schema Updates

### Updated package.json

```json
{
  "name": "voicecode-vscode",
  "displayName": "VoiceCode - Multi-Agent Voice Coding",
  "version": "2.0.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Machine Learning",
    "Programming Languages",
    "Other"
  ],
  "extensionDependencies": [],
  "activationEvents": [
    "onStartupFinished"
  ],
  "contributes": {
    "chatParticipants": [{
      "id": "voicecode.assistant",
      "name": "voicecode",
      "fullName": "VoiceCode Assistant",
      "description": "Voice-controlled coding with multi-agent orchestration",
      "isSticky": false,
      "commands": [
        { "name": "dictate", "description": "Start voice dictation" },
        { "name": "command", "description": "Execute a voice command" },
        { "name": "agents", "description": "List and configure available agents" },
        { "name": "delegate", "description": "Delegate current task to another agent" }
      ]
    }],
    "languageModelTools": [
      {
        "name": "voicecode_transcribe",
        "displayName": "Capture Voice Input",
        "modelDescription": "Captures voice input from the user and returns transcribed text. Useful for hands-free interaction, accessibility, or when typing is inconvenient.",
        "toolReferenceName": "voice",
        "inputSchema": {
          "type": "object",
          "properties": {
            "prompt": {
              "type": "string",
              "description": "Message to display before recording"
            },
            "timeout": {
              "type": "number",
              "description": "Maximum recording duration in seconds"
            },
            "language": {
              "type": "string",
              "description": "Expected language code (e.g., en-US)"
            }
          }
        }
      },
      {
        "name": "voicecode_command",
        "displayName": "Execute Voice Command",
        "modelDescription": "Executes a natural language editing command. Supports commands like 'change X to Y', 'delete last word', 'go to line 42', etc.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "command": {
              "type": "string",
              "description": "Natural language command to execute"
            }
          },
          "required": ["command"]
        }
      },
      {
        "name": "voicecode_vocabulary",
        "displayName": "Get Code Vocabulary",
        "modelDescription": "Returns the user's custom vocabulary and common code terms. Use to improve transcription accuracy for technical content.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "category": {
              "type": "string",
              "enum": ["all", "languages", "frameworks", "ai_models", "custom"],
              "description": "Filter by vocabulary category"
            }
          }
        }
      }
    ],
    "mcpServerDefinitionProviders": [{
      "id": "voicecode.mcp",
      "label": "VoiceCode MCP Server"
    }],
    "configuration": {
      "title": "VoiceCode",
      "properties": {
        "voicecode.defaultAgent": {
          "type": "string",
          "default": "auto",
          "enum": ["auto", "copilot", "claude", "codex", "local"],
          "enumDescriptions": [
            "Automatically select based on task",
            "Always use GitHub Copilot",
            "Always use Claude Code",
            "Always use OpenAI Codex",
            "Use local VoiceCode backend only"
          ],
          "description": "Default agent for voice commands"
        },
        "voicecode.agentRouting": {
          "type": "object",
          "default": {
            "code_generation": "auto",
            "code_explanation": "auto",
            "refactoring": "auto",
            "debugging": "claude",
            "testing": "copilot"
          },
          "description": "Agent preferences by task type"
        },
        "voicecode.voiceTriggers": {
          "type": "object",
          "default": {
            "copilot": ["copilot", "hey copilot"],
            "claude": ["claude", "hey claude"],
            "codex": ["codex", "openai"]
          },
          "description": "Voice trigger phrases for each agent"
        },
        "voicecode.enableMcp": {
          "type": "boolean",
          "default": true,
          "description": "Enable MCP server for external agent integration"
        },
        "voicecode.confirmDestructiveActions": {
          "type": "boolean",
          "default": true,
          "description": "Ask for confirmation before destructive voice commands"
        },
        "voicecode.showAgentRouting": {
          "type": "boolean",
          "default": true,
          "description": "Show notification when routing to an agent"
        }
      }
    }
  }
}
```

---

## Part 6: Testing Strategy

### Integration Tests

```typescript
// src/test/integration/agentOrchestrator.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import { AgentOrchestrator } from '../../agentOrchestrator';

suite('Agent Orchestrator Tests', () => {
  let orchestrator: AgentOrchestrator;

  setup(() => {
    orchestrator = new AgentOrchestrator();
  });

  test('Routes explicit agent mentions correctly', async () => {
    const result = await orchestrator.routeVoiceInput('hey claude refactor this function');
    assert.strictEqual(result.agentId, 'claude');
    assert.strictEqual(result.command, 'refactor this function');
    assert.strictEqual(result.confidence, 1.0);
  });

  test('Selects best agent based on intent', async () => {
    const result = await orchestrator.routeVoiceInput('debug this error');
    // Should prefer Claude for debugging
    assert.strictEqual(result.agentId, 'claude');
  });

  test('Falls back to default agent for ambiguous input', async () => {
    const result = await orchestrator.routeVoiceInput('do something');
    assert.ok(result.confidence < 0.8);
  });
});
```

---

## Part 7: Migration Path

### For Existing Users

1. **Automatic migration**: Existing settings preserved
2. **Opt-in for multi-agent**: Disabled by default
3. **Gradual rollout**: Feature flags for new capabilities

### For New Users

1. **Onboarding wizard**: Configure agents and voice triggers
2. **Guided setup**: Discover available agents
3. **Tutorial**: Voice command examples with each agent

---

## Summary: Key Enhancements

| Enhancement | Benefit | Priority |
|-------------|---------|----------|
| Chat Participant API | Native VS Code chat integration | High |
| Language Model API | Access to any configured model | High |
| Language Model Tools | Agents can use VoiceCode | High |
| MCP Server | Claude Code/external agent integration | High |
| Agent Orchestrator | Route voice to best agent | High |
| Voice-First Workflows | Complex multi-step operations | Medium |
| Webview Panel | Rich voice control UI | Medium |
| Voice Feedback System | Better user experience | Medium |
| Context Bridge | Rich context for all agents | Medium |
| Custom Agent Registration | Extensibility | Low |

---

## References

- [VS Code Chat Participant API](https://code.visualstudio.com/api/extension-guides/ai/chat)
- [VS Code Language Model API](https://code.visualstudio.com/api/extension-guides/ai/language-model)
- [VS Code Language Model Tools](https://code.visualstudio.com/api/extension-guides/ai/tools)
- [VS Code MCP Developer Guide](https://code.visualstudio.com/api/extension-guides/ai/mcp)
- [VS Code Unified Agent Experience](https://code.visualstudio.com/blogs/2025/11/03/unified-agent-experience)
- [VS Code Speech Extension](https://code.visualstudio.com/docs/configure/accessibility/voice)
- [Using Agents in VS Code](https://code.visualstudio.com/docs/copilot/agents/overview)
