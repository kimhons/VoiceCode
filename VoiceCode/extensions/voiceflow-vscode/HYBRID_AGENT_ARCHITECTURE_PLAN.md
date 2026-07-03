# VoiceFlow PRO - Hybrid Agentic Architecture Evolution Plan

**Version:** 2.0 Architecture
**Target:** 50/50 Native Agent + External Agent Orchestration
**Timeline:** 16 Weeks (4 Phases)
**Total Effort:** ~616 Development Hours
**Current Readiness:** 72/100 → Target: 95/100

---

## Executive Summary

This plan transforms VoiceFlow PRO from an 80/20 orchestrator to a true 50/50 hybrid agentic system while addressing critical technical debt identified in the Comprehensive Review.

### Transformation Goals

1. **Native VoiceFlow Agent**: Multi-turn autonomous agent with planning, reasoning, and reflection
2. **Deep External Integrations**: Bidirectional API communication replacing fire-and-forget bridges
3. **Multi-Agent Orchestration**: Parallel, collaborative, and sequential execution modes
4. **Unified Response System**: Aggregation regardless of which agent(s) executed
5. **Technical Debt Resolution**: Fix critical gaps identified in comprehensive review

### Current Assessment (from Comprehensive Review)

| Area | Current | Target | Gap |
|------|---------|--------|-----|
| Voice Control | 75/100 | 95/100 | AudioWorklet migration, command grammar |
| AI Integration | 85/100 | 95/100 | Deep provider integration |
| VSCode API | 90/100 | 98/100 | Inline completions, CodeActions |
| Context Awareness | 65/100 | 90/100 | Git history, incremental graphs |
| Performance | 70/100 | 95/100 | Memory leaks, preloading |
| Test Coverage | 35/100 | 85/100 | Critical gap - all services |
| **Overall** | **72/100** | **95/100** | +23 points |

---

## Phase 0: Critical Technical Debt (Week 1) - 56 Hours

> **PREREQUISITE:** Must complete before hybrid agent evolution

### 0.1 Audio Processing Migration (CRITICAL)

**Issue:** `ScriptProcessorNode` is deprecated → Memory leaks, poor performance

```typescript
// BEFORE (dist/AudioCaptureWebview.js) - DEPRECATED
audioProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

// AFTER - AudioWorklet
class VoiceFlowAudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    if (input) this.port.postMessage({ type: 'audioData', data: input });
    return true;
  }
}
registerProcessor('voiceflow-audio-processor', VoiceFlowAudioProcessor);
```

**Effort:** 16 hours

### 0.2 WhisperModelManager Integration

**Issue:** VoiceRecognitionService doesn't use cached WhisperModelManager

```typescript
// src/services/VoiceRecognitionService.ts - INTEGRATE
import { WhisperModelManager } from './WhisperModelManager';

export class VoiceRecognitionService {
  private modelManager: WhisperModelManager;

  async initialize() {
    this.modelManager = new WhisperModelManager();
    await this.modelManager.loadModel('whisper-tiny-en'); // 30-50x faster with caching
  }
}
```

**Effort:** 4 hours

### 0.3 Model Preloading

**Issue:** First voice command has 3-5s delay

```typescript
// extension.ts - Add to activation
export async function activate(context) {
  // Preload model in background
  const modelManager = new WhisperModelManager();
  modelManager.loadModel('whisper-tiny-en').catch(console.error);
  // ... rest of activation
}
```

**Effort:** 4 hours

### 0.4 Core Test Coverage

**Issue:** 35% coverage → Quality risk

| Service | Tests Needed | Effort |
|---------|--------------|--------|
| EnhancedAIBridgeService | Provider routing, errors | 8h |
| MCPIntegrationService | Tool execution, schema | 8h |
| VoiceRecognitionService | Transcription, wake word | 8h |
| MultiFileEditingService | Sessions, atomic edits | 8h |

**Effort:** 32 hours (this phase) + ongoing

---

## Phase 0.5: Competitive Feature Parity (Weeks 2-3) - 80 Hours

### 0.5.1 Inline Completion Provider (CRITICAL)

**Issue:** Cannot compete with Copilot without inline ghost-text suggestions

```typescript
// src/providers/VoiceFlowInlineCompletionProvider.ts
export class VoiceFlowInlineCompletionProvider
  implements vscode.InlineCompletionItemProvider {

  private aiBridge: EnhancedAIBridgeService;
  private voiceContext: VoiceContextService;

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList> {
    // Check if triggered by voice
    const voicePrompt = await this.voiceContext.getLastTranscript();

    // Get line context
    const line = document.lineAt(position.line);
    const prefix = line.text.substring(0, position.character);

    // Request completion from primary AI provider
    const completion = await this.aiBridge.sendRequest({
      type: 'inline_completion',
      prompt: voicePrompt || prefix,
      context: {
        code: document.getText(),
        language: document.languageId,
        position: { line: position.line, character: position.character }
      }
    });

    if (!completion.success) return { items: [] };

    return {
      items: [{
        insertText: completion.content,
        range: new vscode.Range(position, position),
        command: {
          command: 'voiceflow.telemetry.completionAccepted',
          title: 'Completion Accepted'
        }
      }]
    };
  }
}

// Registration in extension.ts
vscode.languages.registerInlineCompletionItemProvider(
  { pattern: '**/*' },
  new VoiceFlowInlineCompletionProvider(aiBridge, voiceContext)
);
```

**Effort:** 24 hours

### 0.5.2 CodeActionProvider

**Issue:** No "VoiceFlow: Fix this" quick actions

```typescript
// src/providers/VoiceFlowCodeActionProvider.ts
export class VoiceFlowCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // Add voice-triggered actions
    if (context.diagnostics.length > 0) {
      const fixAction = new vscode.CodeAction(
        '🎤 VoiceFlow: Fix with AI',
        vscode.CodeActionKind.QuickFix
      );
      fixAction.command = {
        command: 'voiceflow.fixDiagnostic',
        arguments: [document.uri, range, context.diagnostics]
      };
      actions.push(fixAction);
    }

    // Always offer voice refactoring
    const refactorAction = new vscode.CodeAction(
      '🎤 VoiceFlow: Refactor selection',
      vscode.CodeActionKind.RefactorExtract
    );
    refactorAction.command = {
      command: 'voiceflow.refactorSelection',
      arguments: [document.uri, range]
    };
    actions.push(refactorAction);

    return actions;
  }
}
```

**Effort:** 16 hours

### 0.5.3 Voice Command Grammar Parser

**Issue:** Relies on AI interpretation → slow, inconsistent

```typescript
// src/voice/CommandGrammarParser.ts
export interface VoiceCommand {
  intent: CommandIntent;
  target?: string;
  parameters: Record<string, any>;
  confidence: number;
}

export type CommandIntent =
  | 'refactor' | 'extract' | 'rename' | 'delete' | 'create'
  | 'fix' | 'explain' | 'document' | 'test' | 'commit'
  | 'navigate' | 'search' | 'open' | 'close'
  | 'agent_control' | 'mode_switch';

export class CommandGrammarParser {
  private patterns: Map<CommandIntent, RegExp[]> = new Map([
    ['refactor', [
      /refactor\s+(?:this\s+)?(.+)/i,
      /(?:can you\s+)?clean up\s+(.+)/i,
      /improve\s+(?:the\s+)?(.+)/i
    ]],
    ['extract', [
      /extract\s+(?:this\s+)?(?:into\s+)?(?:a\s+)?(\w+)/i,
      /pull\s+(?:this\s+)?(?:out\s+)?(?:into\s+)?(\w+)/i
    ]],
    ['agent_control', [
      /use\s+(parallel|collaborative|sequential)\s+mode/i,
      /use\s+(\w+)\s+(?:and\s+(\w+))?\s*(?:together)?/i,
      /switch\s+to\s+(\w+)/i
    ]],
    // ... more patterns
  ]);

  parse(transcript: string): VoiceCommand | null {
    for (const [intent, patterns] of this.patterns) {
      for (const pattern of patterns) {
        const match = transcript.match(pattern);
        if (match) {
          return {
            intent,
            target: match[1],
            parameters: this.extractParameters(match),
            confidence: 0.9
          };
        }
      }
    }

    // Fall back to AI interpretation for unmatched commands
    return null;
  }
}
```

**Effort:** 16 hours

### 0.5.4 Git History Context

**Issue:** Unlike Cursor, doesn't use commit history for context

```typescript
// src/context/GitHistoryContext.ts
export class GitHistoryContext {
  async getRelevantCommits(filePath: string, limit: number = 10): Promise<GitCommit[]> {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    const git = gitExtension?.exports.getAPI(1);

    if (!git) return [];

    const repo = git.repositories[0];
    const log = await repo.log({ path: filePath, maxEntries: limit });

    return log.map(commit => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.authorName,
      date: commit.commitDate,
      diff: commit.diff
    }));
  }

  async buildContextWithHistory(filePath: string): Promise<EnhancedContext> {
    const commits = await this.getRelevantCommits(filePath);
    const recentChanges = commits.slice(0, 3).map(c =>
      `[${c.date.toLocaleDateString()}] ${c.message}`
    ).join('\n');

    return {
      recentCommits: commits,
      changeSummary: recentChanges,
      lastModifiedBy: commits[0]?.author
    };
  }
}
```

**Effort:** 16 hours

### 0.5.5 Resource Disposal & Memory Management

**Issue:** Services don't properly dispose WebView panels

```typescript
// src/services/DisposableService.ts
export abstract class DisposableService implements vscode.Disposable {
  protected disposables: vscode.Disposable[] = [];

  protected registerDisposable<T extends vscode.Disposable>(disposable: T): T {
    this.disposables.push(disposable);
    return disposable;
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

// Update all services to extend DisposableService
export class EnhancedAIBridgeService extends DisposableService {
  constructor() {
    super();
    this.registerDisposable(
      vscode.workspace.onDidChangeConfiguration(this.onConfigChange)
    );
  }
}
```

**Effort:** 8 hours

---

## Phase 1: Native Agentic Core (Weeks 4-7) - 160 Hours

> **Note:** Starts after Phase 0/0.5 completion

### 1.1 Agentic Loop Engine

**Goal:** Implement plan-act-observe-reflect cycle for autonomous operation

#### Core Components

| Component | Description | Hours |
|-----------|-------------|-------|
| `AgenticLoopEngine` | Main execution loop with state machine | 24h |
| `PlannerService` | Task decomposition and goal setting | 16h |
| `ReasoningEngine` | Multi-turn thinking with chain-of-thought | 24h |
| `ReflectionService` | Self-evaluation and course correction | 16h |
| `AgentMemoryManager` | Short/long-term memory with persistence | 20h |

#### AgenticLoopEngine Implementation

```typescript
// src/agent/AgenticLoopEngine.ts
export interface AgentState {
  phase: 'planning' | 'acting' | 'observing' | 'reflecting' | 'complete' | 'error';
  goal: string;
  plan: TaskPlan;
  currentStep: number;
  observations: Observation[];
  reflections: Reflection[];
  memory: AgentMemory;
  maxIterations: number;
  iterationCount: number;
}

export class AgenticLoopEngine {
  private state: AgentState;
  private planner: PlannerService;
  private executor: ToolExecutor;
  private reflector: ReflectionService;
  private memory: AgentMemoryManager;
  
  async execute(goal: string, context: AgentContext): Promise<AgentResult> {
    this.state = this.initializeState(goal, context);
    
    while (!this.isTerminal() && this.state.iterationCount < this.state.maxIterations) {
      this.state.iterationCount++;
      
      switch (this.state.phase) {
        case 'planning':
          await this.plan();
          break;
        case 'acting':
          await this.act();
          break;
        case 'observing':
          await this.observe();
          break;
        case 'reflecting':
          await this.reflect();
          break;
      }
      
      // Emit progress for voice feedback
      this.emitProgress();
    }
    
    return this.buildResult();
  }
  
  private async plan(): Promise<void> {
    const plan = await this.planner.createPlan(
      this.state.goal,
      this.state.memory.getRelevantContext(),
      this.state.observations
    );
    
    this.state.plan = plan;
    this.state.phase = 'acting';
  }
  
  private async act(): Promise<void> {
    const currentTask = this.state.plan.steps[this.state.currentStep];
    
    // Select and execute appropriate tool
    const toolResult = await this.executor.execute(currentTask);
    
    this.state.observations.push({
      step: this.state.currentStep,
      action: currentTask,
      result: toolResult,
      timestamp: Date.now()
    });
    
    this.state.phase = 'observing';
  }
  
  private async observe(): Promise<void> {
    const lastObservation = this.state.observations[this.state.observations.length - 1];
    
    // Analyze result and determine next phase
    if (lastObservation.result.success) {
      if (this.state.currentStep >= this.state.plan.steps.length - 1) {
        this.state.phase = 'reflecting'; // Final reflection before completion
      } else {
        this.state.currentStep++;
        this.state.phase = 'acting';
      }
    } else {
      // Error occurred - need reflection for recovery
      this.state.phase = 'reflecting';
    }
  }
  
  private async reflect(): Promise<void> {
    const reflection = await this.reflector.reflect(
      this.state.goal,
      this.state.plan,
      this.state.observations
    );
    
    this.state.reflections.push(reflection);
    
    if (reflection.recommendation === 'replan') {
      this.state.phase = 'planning';
    } else if (reflection.recommendation === 'continue') {
      this.state.phase = 'acting';
    } else if (reflection.recommendation === 'complete') {
      this.state.phase = 'complete';
    } else {
      this.state.phase = 'error';
    }
    
    // Update memory with learnings
    await this.memory.store(reflection.learnings);
  }
}
```

### 1.2 Enhanced Tool System

**Goal:** Expand from 6 to 25+ tools with safe execution

#### New Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| **Code Manipulation** | `edit_file`, `create_file`, `delete_file`, `rename_file`, `move_file` | Safe file operations with preview |
| **Code Analysis** | `analyze_ast`, `find_references`, `get_type_info`, `analyze_dependencies` | Deep code understanding |
| **Refactoring** | `extract_function`, `rename_symbol`, `inline_variable`, `change_signature` | VSCode refactoring commands |
| **Testing** | `run_tests`, `generate_test`, `get_coverage`, `debug_test` | Test execution and generation |
| **Git** | `git_status`, `git_diff`, `git_commit`, `git_branch`, `git_log` | Version control operations |
| **Workspace** | `find_files`, `search_text`, `get_diagnostics`, `open_file` | Workspace navigation |
| **Terminal** | `run_command`, `start_task`, `read_output` | Shell execution |

#### Tool Execution Sandbox

```typescript
// src/agent/tools/ToolSandbox.ts
export class ToolSandbox {
  private allowedPaths: string[];
  private deniedOperations: Set<string>;
  private confirmationRequired: Set<string>;

  async execute(tool: Tool, params: Record<string, any>): Promise<ToolResult> {
    // 1. Validate parameters
    const validation = await this.validateParams(tool, params);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Check permissions
    if (this.deniedOperations.has(tool.name)) {
      return { success: false, error: 'Operation not permitted' };
    }

    // 3. Request confirmation if needed
    if (this.confirmationRequired.has(tool.name)) {
      const confirmed = await this.requestConfirmation(tool, params);
      if (!confirmed) {
        return { success: false, error: 'User denied operation' };
      }
    }

    // 4. Execute in isolated context
    return await this.executeIsolated(tool, params);
  }
}
```

### 1.3 Agent Memory System

**Goal:** Enable context persistence across sessions

```typescript
// src/agent/memory/AgentMemoryManager.ts
export interface AgentMemory {
  shortTerm: ShortTermMemory;   // Current session context
  working: WorkingMemory;       // Active task state
  longTerm: LongTermMemory;     // Persistent learnings
  episodic: EpisodicMemory;     // Past task completions
}

export class AgentMemoryManager {
  private shortTerm: Map<string, MemoryEntry>;
  private working: WorkingMemory;
  private storage: vscode.Memento;  // VSCode persistent storage

  async storeObservation(obs: Observation): Promise<void> {
    // Store in short-term
    this.shortTerm.set(obs.id, {
      content: obs,
      timestamp: Date.now(),
      relevance: 1.0
    });

    // Decay old entries
    await this.decayMemory();
  }

  async getRelevantContext(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // Semantic search across all memory types
    const shortTermResults = await this.searchShortTerm(query);
    const episodicResults = await this.searchEpisodic(query);
    const longTermResults = await this.searchLongTerm(query);

    // Merge and rank by relevance
    return this.rankAndMerge([shortTermResults, episodicResults, longTermResults], limit);
  }

  async consolidate(): Promise<void> {
    // Move important short-term memories to long-term
    const importantMemories = Array.from(this.shortTerm.values())
      .filter(m => m.relevance > 0.7);

    for (const memory of importantMemories) {
      await this.promoteToLongTerm(memory);
    }
  }
}
```

---

## Phase 2: Deep External Agent Integration (Weeks 8-11) - 160 Hours

### 2.1 Agent Communication Protocol

**Goal:** Standard interface for bidirectional agent communication

```typescript
// src/orchestrator/protocol/AgentProtocol.ts
export interface AgentMessage {
  id: string;
  type: 'request' | 'response' | 'status' | 'context_update' | 'result';
  sourceAgent: string;
  targetAgent: string;
  payload: AgentPayload;
  timestamp: number;
  correlationId?: string;  // Links related messages
}

export interface AgentPayload {
  task?: TaskRequest;
  result?: TaskResult;
  context?: SharedContext;
  status?: AgentStatus;
  error?: AgentError;
}

export interface SharedContext {
  files: FileContext[];
  codeChanges: CodeChange[];
  diagnostics: Diagnostic[];
  conversationHistory: Message[];
  metadata: Record<string, any>;
}

export class AgentProtocol {
  private messageQueue: Map<string, AgentMessage[]>;
  private subscribers: Map<string, AgentMessageHandler[]>;

  async send(message: AgentMessage): Promise<void> {
    // Route message to target agent
    const handlers = this.subscribers.get(message.targetAgent) || [];
    for (const handler of handlers) {
      await handler(message);
    }

    // Store for correlation
    if (message.correlationId) {
      this.addToQueue(message.correlationId, message);
    }
  }

  async waitForResponse(correlationId: string, timeout: number): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const messages = this.messageQueue.get(correlationId) || [];
        const response = messages.find(m => m.type === 'response' || m.type === 'result');
        if (response) {
          clearInterval(checkInterval);
          resolve(response);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Response timeout'));
      }, timeout);
    });
  }
}
```

### 2.2 Deep Copilot Integration

**Goal:** Use VSCode Language Model API for true bidirectional communication

| Integration Point | API | Capability |
|-------------------|-----|------------|
| Language Model | `vscode.lm.selectChatModels()` | Direct model access |
| Chat Participant | `vscode.chat.createChatParticipant()` | Conversational interface |
| Inline Completions | `InlineCompletionItemProvider` | Code suggestions |
| Code Actions | `CodeActionProvider` | Quick fixes |

```typescript
// src/bridges/deep/CopilotDeepBridge.ts
export class CopilotDeepBridge implements DeepAgentBridge {
  private chatModels: vscode.LanguageModelChat[];
  private activeRequests: Map<string, CopilotRequest>;

  async initialize(): Promise<void> {
    // Get available Copilot models
    this.chatModels = await vscode.lm.selectChatModels({
      vendor: 'copilot',
      family: 'gpt-4'
    });

    if (this.chatModels.length === 0) {
      throw new Error('No Copilot models available');
    }
  }

  async sendTask(task: TaskRequest): Promise<TaskResult> {
    const model = this.chatModels[0];
    const messages = this.buildMessages(task);

    // Create request with streaming
    const request = await model.sendRequest(
      messages,
      {},
      new vscode.CancellationTokenSource().token
    );

    // Collect streaming response
    let fullResponse = '';
    for await (const chunk of request.text) {
      fullResponse += chunk;
      this.emitProgress(task.id, chunk);
    }

    // Parse and return structured result
    return this.parseResponse(fullResponse, task);
  }

  async captureInlineCompletion(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<string | null> {
    // Trigger and capture Copilot's inline suggestion
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );

    if (completions && completions.items.length > 0) {
      const item = completions.items[0];
      return typeof item.insertText === 'string'
        ? item.insertText
        : item.insertText.value;
    }

    return null;
  }
}
```

### 2.3 Deep Cline Integration

**Goal:** WebSocket-based bidirectional communication with Cline

```typescript
// src/bridges/deep/ClineDeepBridge.ts
export class ClineDeepBridge implements DeepAgentBridge {
  private webviewPanel: vscode.WebviewPanel | null = null;
  private messageChannel: MessageChannel;
  private taskStates: Map<string, ClineTaskState>;

  async initialize(): Promise<void> {
    // Find Cline's webview
    const clineExtension = vscode.extensions.getExtension('saoudrizwan.claude-dev');
    if (!clineExtension) {
      throw new Error('Cline extension not installed');
    }

    // Set up message interception
    await this.setupMessageInterception();
  }

  private async setupMessageInterception(): Promise<void> {
    // Monitor Cline's webview messages
    const originalPostMessage = vscode.window.createWebviewPanel;

    // Intercept Cline webview creation to capture message channel
    // This allows bidirectional communication
  }

  async sendTask(task: TaskRequest): Promise<TaskResult> {
    const taskId = this.generateTaskId();

    // Initialize task tracking
    this.taskStates.set(taskId, {
      id: taskId,
      status: 'pending',
      startTime: Date.now(),
      messages: []
    });

    // Send task to Cline via command
    await vscode.commands.executeCommand('cline.startTask', {
      task: task.description,
      files: task.context?.files
    });

    // Monitor for completion
    return this.waitForTaskCompletion(taskId);
  }

  private async waitForTaskCompletion(taskId: string): Promise<TaskResult> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const state = this.taskStates.get(taskId);
        if (state?.status === 'complete') {
          clearInterval(checkInterval);
          resolve(this.buildResult(state));
        }
      }, 500);
    });
  }

  // Capture Cline's file changes
  async captureFileChanges(): Promise<FileChange[]> {
    // Monitor workspace file system for changes made by Cline
    const changes: FileChange[] = [];

    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange(uri => {
      changes.push({ uri, type: 'modified' });
    });
    watcher.onDidCreate(uri => {
      changes.push({ uri, type: 'created' });
    });

    return changes;
  }
}
```

### 2.4 Deep Aider Integration

**Goal:** Process-based communication with result capture

```typescript
// src/bridges/deep/AiderDeepBridge.ts
import { spawn, ChildProcess } from 'child_process';

export class AiderDeepBridge implements DeepAgentBridge {
  private aiderProcess: ChildProcess | null = null;
  private outputBuffer: string = '';
  private resultParser: AiderOutputParser;

  async initialize(): Promise<void> {
    // Verify aider is installed
    const aiderPath = await this.findAiderExecutable();
    if (!aiderPath) {
      throw new Error('Aider not found. Please install via pip install aider-chat');
    }
  }

  async sendTask(task: TaskRequest): Promise<TaskResult> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
      throw new Error('No workspace folder open');
    }

    return new Promise((resolve, reject) => {
      // Start aider with task
      this.aiderProcess = spawn('aider', [
        '--yes',  // Auto-confirm
        '--no-pretty',  // Machine-readable output
        '--message', task.description,
        ...(task.context?.files || [])
      ], {
        cwd: workspaceFolder,
        env: { ...process.env, AIDER_MODEL: task.model || 'gpt-4' }
      });

      // Capture stdout
      this.aiderProcess.stdout?.on('data', (data) => {
        this.outputBuffer += data.toString();
        this.emitProgress(task.id, data.toString());
      });

      // Capture stderr
      this.aiderProcess.stderr?.on('data', (data) => {
        console.error('Aider error:', data.toString());
      });

      // Handle completion
      this.aiderProcess.on('close', (code) => {
        if (code === 0) {
          resolve(this.parseAiderOutput(this.outputBuffer));
        } else {
          reject(new Error(`Aider exited with code ${code}`));
        }
        this.outputBuffer = '';
      });
    });
  }

  private parseAiderOutput(output: string): TaskResult {
    // Parse Aider's output to extract:
    // - Files modified
    // - Code changes
    // - Commit messages
    const filesModified = this.extractModifiedFiles(output);
    const codeChanges = this.extractCodeChanges(output);

    return {
      success: true,
      output: output,
      filesModified,
      codeChanges,
      agent: 'aider'
    };
  }
}
```

---

## Phase 3: Multi-Agent Orchestration (Weeks 12-16) - 160 Hours

### 3.1 Agent Manager

**Goal:** Lifecycle management for all agents (native + external)

```typescript
// src/orchestrator/AgentManager.ts
export type AgentId = 'voiceflow' | 'copilot' | 'cline' | 'cursor' | 'augment' | 'aider';

export interface ManagedAgent {
  id: AgentId;
  type: 'native' | 'external';
  bridge: DeepAgentBridge | null;  // null for native
  status: 'available' | 'busy' | 'unavailable' | 'error';
  capabilities: AgentCapabilities;
  currentTask: TaskRequest | null;
  metrics: AgentMetrics;
}

export class AgentManager {
  private agents: Map<AgentId, ManagedAgent> = new Map();
  private nativeAgent: AgenticLoopEngine;
  private bridges: Map<AgentId, DeepAgentBridge>;

  async initialize(): Promise<void> {
    // Initialize native agent
    this.nativeAgent = new AgenticLoopEngine();
    this.agents.set('voiceflow', {
      id: 'voiceflow',
      type: 'native',
      bridge: null,
      status: 'available',
      capabilities: this.getNativeCapabilities(),
      currentTask: null,
      metrics: this.createInitialMetrics()
    });

    // Initialize external agent bridges
    await this.initializeExternalAgents();
  }

  private async initializeExternalAgents(): Promise<void> {
    const externalAgents: { id: AgentId; bridgeClass: new () => DeepAgentBridge }[] = [
      { id: 'copilot', bridgeClass: CopilotDeepBridge },
      { id: 'cline', bridgeClass: ClineDeepBridge },
      { id: 'cursor', bridgeClass: CursorDeepBridge },
      { id: 'augment', bridgeClass: AugmentDeepBridge },
      { id: 'aider', bridgeClass: AiderDeepBridge }
    ];

    for (const { id, bridgeClass } of externalAgents) {
      try {
        const bridge = new bridgeClass();
        await bridge.initialize();

        this.bridges.set(id, bridge);
        this.agents.set(id, {
          id,
          type: 'external',
          bridge,
          status: 'available',
          capabilities: await bridge.getCapabilities(),
          currentTask: null,
          metrics: this.createInitialMetrics()
        });
      } catch (error) {
        // Agent not available - mark as unavailable
        this.agents.set(id, {
          id,
          type: 'external',
          bridge: null,
          status: 'unavailable',
          capabilities: {} as AgentCapabilities,
          currentTask: null,
          metrics: this.createInitialMetrics()
        });
      }
    }
  }

  getAvailableAgents(): ManagedAgent[] {
    return Array.from(this.agents.values())
      .filter(a => a.status === 'available');
  }

  async assignTask(agentId: AgentId, task: TaskRequest): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'available') {
      throw new Error(`Agent ${agentId} is not available`);
    }

    agent.status = 'busy';
    agent.currentTask = task;
  }

  async releaseAgent(agentId: AgentId): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = 'available';
      agent.currentTask = null;
    }
  }
}
```

### 3.2 Task Scheduler

**Goal:** Implement parallel, collaborative, and sequential execution modes

```typescript
// src/orchestrator/TaskScheduler.ts
export type ExecutionMode = 'parallel' | 'collaborative' | 'sequential';

export interface ExecutionPlan {
  mode: ExecutionMode;
  tasks: ScheduledTask[];
  dependencies: TaskDependency[];
  timeout: number;
}

export interface ScheduledTask {
  id: string;
  task: TaskRequest;
  assignedAgent: AgentId;
  priority: number;
  dependencies: string[];  // Task IDs this depends on
  status: 'pending' | 'running' | 'complete' | 'failed';
}

export class TaskScheduler {
  private agentManager: AgentManager;
  private protocol: AgentProtocol;
  private activePlans: Map<string, ExecutionPlan>;

  async createPlan(
    request: TaskRequest,
    mode: ExecutionMode,
    preferredAgents?: AgentId[]
  ): Promise<ExecutionPlan> {
    const availableAgents = this.agentManager.getAvailableAgents();

    switch (mode) {
      case 'parallel':
        return this.createParallelPlan(request, availableAgents, preferredAgents);
      case 'collaborative':
        return this.createCollaborativePlan(request, availableAgents, preferredAgents);
      case 'sequential':
        return this.createSequentialPlan(request, availableAgents, preferredAgents);
    }
  }

  private async createParallelPlan(
    request: TaskRequest,
    agents: ManagedAgent[],
    preferred?: AgentId[]
  ): Promise<ExecutionPlan> {
    // Decompose task into independent subtasks
    const subtasks = await this.decomposeForParallel(request);

    // Assign each subtask to best available agent
    const scheduledTasks: ScheduledTask[] = subtasks.map((subtask, index) => ({
      id: `${request.id}-${index}`,
      task: subtask,
      assignedAgent: this.selectBestAgent(subtask, agents, preferred),
      priority: subtask.priority || 1,
      dependencies: [],  // No dependencies in parallel mode
      status: 'pending'
    }));

    return {
      mode: 'parallel',
      tasks: scheduledTasks,
      dependencies: [],
      timeout: request.timeout || 300000  // 5 minutes default
    };
  }

  private async createCollaborativePlan(
    request: TaskRequest,
    agents: ManagedAgent[],
    preferred?: AgentId[]
  ): Promise<ExecutionPlan> {
    // Create tasks that build on each other's output
    // Example: VoiceFlow plans -> Cline implements -> Copilot optimizes

    const phases = [
      { role: 'planner', task: 'Plan and scaffold the implementation' },
      { role: 'implementer', task: 'Implement the core logic' },
      { role: 'optimizer', task: 'Optimize and polish the code' }
    ];

    const scheduledTasks: ScheduledTask[] = [];
    const dependencies: TaskDependency[] = [];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const agent = this.selectAgentForRole(phase.role, agents, preferred);

      const taskId = `${request.id}-phase-${i}`;
      scheduledTasks.push({
        id: taskId,
        task: {
          ...request,
          description: `${phase.task}\n\nOriginal request: ${request.description}`
        },
        assignedAgent: agent,
        priority: phases.length - i,  // Earlier phases have higher priority
        dependencies: i > 0 ? [`${request.id}-phase-${i - 1}`] : [],
        status: 'pending'
      });

      if (i > 0) {
        dependencies.push({
          from: `${request.id}-phase-${i - 1}`,
          to: taskId,
          type: 'context_handoff'
        });
      }
    }

    return {
      mode: 'collaborative',
      tasks: scheduledTasks,
      dependencies,
      timeout: request.timeout || 600000  // 10 minutes for collaborative
    };
  }

  async execute(plan: ExecutionPlan): Promise<MultiAgentResult> {
    const results: Map<string, TaskResult> = new Map();
    const startTime = Date.now();

    switch (plan.mode) {
      case 'parallel':
        return this.executeParallel(plan, results);
      case 'collaborative':
        return this.executeCollaborative(plan, results);
      case 'sequential':
        return this.executeSequential(plan, results);
    }
  }

  private async executeParallel(
    plan: ExecutionPlan,
    results: Map<string, TaskResult>
  ): Promise<MultiAgentResult> {
    // Execute all tasks concurrently
    const promises = plan.tasks.map(async (scheduledTask) => {
      scheduledTask.status = 'running';

      try {
        const result = await this.executeTask(scheduledTask);
        results.set(scheduledTask.id, result);
        scheduledTask.status = 'complete';
      } catch (error) {
        scheduledTask.status = 'failed';
        results.set(scheduledTask.id, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          agent: scheduledTask.assignedAgent
        });
      }
    });

    await Promise.all(promises);

    return this.aggregateResults(plan, results);
  }

  private async executeCollaborative(
    plan: ExecutionPlan,
    results: Map<string, TaskResult>
  ): Promise<MultiAgentResult> {
    let sharedContext: SharedContext = { files: [], codeChanges: [], diagnostics: [], conversationHistory: [], metadata: {} };

    for (const scheduledTask of plan.tasks) {
      // Wait for dependencies
      await this.waitForDependencies(scheduledTask, results);

      // Inject context from previous task
      const enrichedTask = this.enrichWithContext(scheduledTask, sharedContext, results);

      scheduledTask.status = 'running';

      try {
        const result = await this.executeTask(enrichedTask);
        results.set(scheduledTask.id, result);
        scheduledTask.status = 'complete';

        // Update shared context with this task's results
        sharedContext = this.mergeContext(sharedContext, result);

      } catch (error) {
        scheduledTask.status = 'failed';
        // In collaborative mode, failure stops the chain
        break;
      }
    }

    return this.aggregateResults(plan, results);
  }
}
```

### 3.3 Result Coordinator

**Goal:** Aggregate results from multiple agents into unified output

```typescript
// src/orchestrator/ResultCoordinator.ts
export interface MultiAgentResult {
  success: boolean;
  mode: ExecutionMode;
  agentsUsed: AgentId[];
  totalDuration: number;

  // Aggregated outputs
  summary: string;
  codeChanges: AggregatedCodeChange[];
  filesModified: string[];

  // Per-agent results
  agentResults: Map<AgentId, TaskResult>;

  // Conflicts detected during aggregation
  conflicts: ResultConflict[];

  // Voice-friendly summary for feedback
  voiceSummary: string;
}

export interface ResultConflict {
  type: 'file_conflict' | 'approach_conflict' | 'dependency_conflict';
  agents: AgentId[];
  description: string;
  resolution?: string;
}

export class ResultCoordinator {
  private conflictResolver: ConflictResolver;

  async aggregate(
    plan: ExecutionPlan,
    results: Map<string, TaskResult>
  ): Promise<MultiAgentResult> {
    const agentResults = this.groupByAgent(results);
    const agentsUsed = Array.from(agentResults.keys());

    // Detect conflicts
    const conflicts = await this.detectConflicts(agentResults);

    // Resolve conflicts if possible
    const resolvedResults = await this.resolveConflicts(agentResults, conflicts);

    // Merge code changes
    const mergedChanges = await this.mergeCodeChanges(resolvedResults);

    // Generate summaries
    const summary = await this.generateSummary(resolvedResults, mergedChanges);
    const voiceSummary = await this.generateVoiceSummary(summary, agentsUsed);

    return {
      success: this.determineOverallSuccess(resolvedResults),
      mode: plan.mode,
      agentsUsed,
      totalDuration: this.calculateTotalDuration(results),
      summary,
      codeChanges: mergedChanges,
      filesModified: this.extractModifiedFiles(mergedChanges),
      agentResults,
      conflicts,
      voiceSummary
    };
  }

  private async detectConflicts(
    results: Map<AgentId, TaskResult[]>
  ): Promise<ResultConflict[]> {
    const conflicts: ResultConflict[] = [];

    // Check for file conflicts (multiple agents modified same file)
    const fileModifications = new Map<string, AgentId[]>();
    for (const [agent, taskResults] of results) {
      for (const result of taskResults) {
        for (const file of result.filesModified || []) {
          const agents = fileModifications.get(file) || [];
          agents.push(agent);
          fileModifications.set(file, agents);
        }
      }
    }

    for (const [file, agents] of fileModifications) {
      if (agents.length > 1) {
        conflicts.push({
          type: 'file_conflict',
          agents,
          description: `Multiple agents modified ${file}: ${agents.join(', ')}`
        });
      }
    }

    return conflicts;
  }

  private async generateVoiceSummary(
    summary: string,
    agentsUsed: AgentId[]
  ): Promise<string> {
    // Generate concise voice-friendly summary
    const agentNames = agentsUsed.map(id => this.getAgentDisplayName(id)).join(' and ');

    if (agentsUsed.length === 1) {
      return `Task completed by ${agentNames}. ${this.summarizeForVoice(summary)}`;
    } else {
      return `Task completed using ${agentsUsed.length} agents: ${agentNames}. ${this.summarizeForVoice(summary)}`;
    }
  }
}
```

---

## Phase 4: Voice Integration & User Experience (Continuous)

### 4.1 Voice Commands for Multi-Agent Control

```typescript
// Voice command examples for multi-agent orchestration
const multiAgentVoiceCommands = {
  // Mode selection
  "use parallel mode": { action: 'set_mode', mode: 'parallel' },
  "use collaborative mode": { action: 'set_mode', mode: 'collaborative' },
  "use sequential mode": { action: 'set_mode', mode: 'sequential' },

  // Agent selection
  "use voiceflow only": { action: 'select_agents', agents: ['voiceflow'] },
  "use copilot and cline": { action: 'select_agents', agents: ['copilot', 'cline'] },
  "use all available agents": { action: 'select_agents', agents: 'all' },

  // Combined commands
  "refactor this function using voiceflow and copilot in parallel": {
    action: 'execute_task',
    task: 'refactor',
    mode: 'parallel',
    agents: ['voiceflow', 'copilot']
  },

  // Status queries
  "which agents are available": { action: 'query_status' },
  "show agent results": { action: 'show_results' }
};
```

### 4.2 Real-time Progress Feedback

```typescript
// src/voice/MultiAgentVoiceFeedback.ts
export class MultiAgentVoiceFeedback {
  private voiceFeedback: VoiceFeedbackService;

  async reportProgress(event: MultiAgentProgressEvent): Promise<void> {
    switch (event.type) {
      case 'plan_created':
        await this.voiceFeedback.speak(
          `Plan created. Using ${event.agents.length} agents in ${event.mode} mode.`
        );
        break;

      case 'agent_started':
        await this.voiceFeedback.speak(
          `${event.agentName} is now working on ${event.taskDescription}.`
        );
        break;

      case 'agent_progress':
        // Only report significant progress milestones
        if (event.progress % 25 === 0) {
          await this.voiceFeedback.speak(
            `${event.agentName} is ${event.progress}% complete.`
          );
        }
        break;

      case 'agent_complete':
        await this.voiceFeedback.speak(
          `${event.agentName} has finished. ${event.summary}`
        );
        break;

      case 'all_complete':
        await this.voiceFeedback.speak(event.voiceSummary);
        break;
    }
  }
}
```

---

## Implementation Timeline

### Week-by-Week Breakdown

| Week | Phase | Focus | Deliverables | Hours |
|------|-------|-------|--------------|-------|
| **1** | 0 | Critical Fixes | AudioWorklet, WhisperManager, Preloading | 24h |
| **2** | 0 | Testing Foundation | Core service tests (4 services) | 32h |
| **3** | 0.5 | Inline Completions | `VoiceFlowInlineCompletionProvider` | 24h |
| **3** | 0.5 | Code Actions | `VoiceFlowCodeActionProvider` | 16h |
| **4** | 0.5 | Voice Grammar | `CommandGrammarParser`, Git context | 40h |
| **5** | 1.1 | Agentic Loop Core | `AgenticLoopEngine`, `PlannerService` | 40h |
| **6** | 1.1 | Reasoning & Reflection | `ReasoningEngine`, `ReflectionService` | 40h |
| **7** | 1.2 | Tool System | 25 tools, `ToolSandbox` | 40h |
| **8** | 1.3 | Memory System | `AgentMemoryManager`, persistence | 40h |
| **9** | 2.1 | Agent Protocol | `AgentProtocol`, message types | 16h |
| **9** | 2.2 | Copilot Deep Bridge | `CopilotDeepBridge` with LM API | 32h |
| **10** | 2.3 | Cline Deep Bridge | `ClineDeepBridge` with WebSocket | 32h |
| **11** | 2.4 | Other Bridges | `AiderDeepBridge`, `CursorDeepBridge`, `AugmentDeepBridge` | 48h |
| **12** | 3.1 | Agent Manager | `AgentManager`, lifecycle | 24h |
| **13** | 3.2 | Task Scheduler | `TaskScheduler`, execution modes | 40h |
| **14** | 3.3 | Result Coordinator | `ResultCoordinator`, conflict resolution | 32h |
| **15** | 3.4 | Voice Integration | Multi-agent voice commands, feedback | 32h |
| **16** | 4 | Polish & Launch | E2E testing, performance, documentation | 32h |

### Total Effort Summary

| Phase | Focus | Hours | Cumulative |
|-------|-------|-------|------------|
| **Phase 0** | Critical Technical Debt | 56h | 56h |
| **Phase 0.5** | Competitive Parity | 80h | 136h |
| **Phase 1** | Native Agentic Core | 160h | 296h |
| **Phase 2** | Deep External Integration | 160h | 456h |
| **Phase 3** | Multi-Agent Orchestration | 128h | 584h |
| **Phase 4** | Polish & Launch | 32h | **616h** |

---

## File Structure

```
src/
├── agent/                          # Native VoiceFlow Agent
│   ├── AgenticLoopEngine.ts        # Main agentic loop
│   ├── PlannerService.ts           # Task planning
│   ├── ReasoningEngine.ts          # Multi-turn reasoning
│   ├── ReflectionService.ts        # Self-evaluation
│   ├── memory/
│   │   ├── AgentMemoryManager.ts   # Memory coordination
│   │   ├── ShortTermMemory.ts      # Session context
│   │   ├── WorkingMemory.ts        # Active task state
│   │   └── LongTermMemory.ts       # Persistent storage
│   └── tools/
│       ├── ToolRegistry.ts         # Tool management
│       ├── ToolSandbox.ts          # Safe execution
│       └── tools/                  # Individual tool implementations
│           ├── CodeManipulationTools.ts
│           ├── CodeAnalysisTools.ts
│           ├── RefactoringTools.ts
│           ├── TestingTools.ts
│           ├── GitTools.ts
│           └── WorkspaceTools.ts
│
├── orchestrator/                   # Multi-Agent Orchestration
│   ├── AgentManager.ts             # Agent lifecycle
│   ├── TaskScheduler.ts            # Execution planning
│   ├── ResultCoordinator.ts        # Result aggregation
│   ├── ConflictResolver.ts         # Conflict handling
│   └── protocol/
│       ├── AgentProtocol.ts        # Communication protocol
│       ├── MessageTypes.ts         # Message definitions
│       └── ContextSharing.ts       # Context sync
│
├── bridges/                        # Deep External Integrations
│   ├── DeepAgentBridge.ts          # Base interface
│   ├── deep/
│   │   ├── CopilotDeepBridge.ts    # Copilot LM API
│   │   ├── ClineDeepBridge.ts      # Cline WebSocket
│   │   ├── CursorDeepBridge.ts     # Cursor integration
│   │   ├── AugmentDeepBridge.ts    # Augment integration
│   │   └── AiderDeepBridge.ts      # Aider process
│   └── legacy/                     # Keep old bridges for fallback
│       ├── CopilotBridge.ts
│       ├── ClineBridge.ts
│       └── ...
│
├── voice/                          # Voice-First Interface
│   ├── MultiAgentVoiceCommands.ts  # Voice command definitions
│   ├── MultiAgentVoiceFeedback.ts  # Progress reporting
│   └── VoiceAgentController.ts     # Voice → Agent routing
│
└── types/                          # Shared Types
    ├── agent.types.ts
    ├── orchestrator.types.ts
    ├── protocol.types.ts
    └── result.types.ts
```

---

## Success Metrics

| Metric | Current | Phase 0.5 | Phase 1 | Phase 3 | Final Target |
|--------|---------|-----------|---------|---------|--------------|
| Overall Readiness | 72/100 | 82/100 | 88/100 | 95/100 | 95/100 |
| Voice Control | 75/100 | 85/100 | 90/100 | 95/100 | 95/100 |
| Test Coverage | 35% | 60% | 75% | 85% | 85% |
| Native Agent Capability | 20% | 25% | 50% | 50% | 50% |
| Response Capture Rate | 0% | 0% | 50% | 95% | 95% |
| Multi-Agent Task Success | N/A | N/A | N/A | 85% | 85% |
| Avg Task Latency | 3-5s | <2s | <1s | <30s complex | <30s |
| Voice Command Recognition | 90% | 95% | 97% | 98% | 98% |
| User Satisfaction (NPS) | N/A | N/A | >30 | >50 | >50 |

---

## Risk Mitigation

| Risk | Impact | Phase | Mitigation |
|------|--------|-------|------------|
| AudioWorklet browser compatibility | High | 0 | Feature detection, ScriptProcessor fallback |
| External agent API changes | High | 2 | Version pinning, fallback to legacy bridges |
| Test flakiness | Medium | 0 | Deterministic mocks, retry logic |
| Inline completion performance | Medium | 0.5 | Debouncing, caching, cancellation tokens |
| Conflict resolution failures | Medium | 3 | Manual override option, conservative merging |
| Memory system performance | Medium | 1 | LRU caching, lazy loading, IndexedDB |
| Voice command ambiguity | Low | 0.5 | Grammar parser, confirmation prompts |
| Model loading delays | Low | 0 | Preloading, progress indicators |

---

## Competitive Positioning After Implementation

| Feature | VoiceFlow 2.0 | Copilot | Cursor | Cline |
|---------|---------------|---------|--------|-------|
| Voice Control | ✅ **Unique** | ❌ | ❌ | ❌ |
| Inline Suggestions | ✅ (Phase 0.5) | ✅ | ✅ | ❌ |
| Multi-File Edit | ✅ | ❌ | ✅ | ✅ |
| Agentic Loop | ✅ (Phase 1) | ❌ | ⚠️ | ✅ |
| Multi-Agent Orchestration | ✅ **Unique** | ❌ | ❌ | ❌ |
| Deep Agent Integration | ✅ (Phase 2) | N/A | N/A | N/A |
| MCP Tools | ✅ 25+ | ❌ | ❌ | ✅ 6 |
| Context Awareness | ✅ + Git | ⚠️ | ✅ | ✅ |
| Parallel Execution | ✅ **Unique** | ❌ | ❌ | ❌ |
| Collaborative Mode | ✅ **Unique** | ❌ | ❌ | ❌ |

**Unique Market Position:** The only voice-first AI coding assistant with multi-agent orchestration capabilities.

---

## Next Steps

### Immediate (This Week)
1. ✅ Review and approve architecture plan
2. Set up feature branch `feature/hybrid-agent-v2`
3. **Phase 0 Start:** Migrate AudioCaptureWebview to AudioWorklet
4. Integrate WhisperModelManager into VoiceRecognitionService
5. Add model preloading to extension activation

### Short-term (Weeks 2-4)
1. Complete core service test coverage (4 services minimum)
2. Implement `VoiceFlowInlineCompletionProvider`
3. Implement `VoiceFlowCodeActionProvider`
4. Build `CommandGrammarParser` for reliable command parsing
5. Add Git history context integration

### Medium-term (Weeks 5-11)
1. Implement `AgenticLoopEngine` with plan-act-observe-reflect cycle
2. Build `PlannerService`, `ReasoningEngine`, `ReflectionService`
3. Expand tool system to 25+ tools with `ToolSandbox`
4. Implement `AgentMemoryManager` with persistence
5. Create deep bridges for Copilot, Cline, Cursor, Aider, Augment
6. Define and implement `AgentProtocol`

### Long-term (Weeks 12-16)
1. Implement `AgentManager` for lifecycle management
2. Build `TaskScheduler` with parallel/collaborative/sequential modes
3. Create `ResultCoordinator` for multi-agent result aggregation
4. Add voice commands for multi-agent control
5. E2E testing and performance optimization
6. Documentation and launch preparation

---

## File Structure (Updated)

```
src/
├── phase0/                         # Critical fixes (new)
│   ├── AudioWorkletProcessor.ts    # Replace deprecated ScriptProcessor
│   └── VoiceRecognitionServiceV2.ts # Integrated with WhisperModelManager
│
├── providers/                      # VSCode providers (new)
│   ├── VoiceFlowInlineCompletionProvider.ts
│   ├── VoiceFlowCodeActionProvider.ts
│   └── VoiceFlowDocumentLinkProvider.ts
│
├── voice/                          # Enhanced voice system
│   ├── CommandGrammarParser.ts     # Pattern-based command parsing
│   ├── MultiAgentVoiceCommands.ts  # Voice command definitions
│   ├── MultiAgentVoiceFeedback.ts  # Progress reporting
│   └── VoiceAgentController.ts     # Voice → Agent routing
│
├── context/                        # Enhanced context (new)
│   ├── GitHistoryContext.ts        # Commit history integration
│   └── IncrementalDependencyGraph.ts
│
├── agent/                          # Native VoiceFlow Agent
│   ├── AgenticLoopEngine.ts        # Main agentic loop
│   ├── PlannerService.ts           # Task planning
│   ├── ReasoningEngine.ts          # Multi-turn reasoning
│   ├── ReflectionService.ts        # Self-evaluation
│   ├── memory/
│   │   ├── AgentMemoryManager.ts   # Memory coordination
│   │   ├── ShortTermMemory.ts      # Session context
│   │   ├── WorkingMemory.ts        # Active task state
│   │   └── LongTermMemory.ts       # Persistent storage
│   └── tools/
│       ├── ToolRegistry.ts         # Tool management
│       ├── ToolSandbox.ts          # Safe execution
│       └── tools/                  # 25+ tool implementations
│
├── orchestrator/                   # Multi-Agent Orchestration
│   ├── AgentManager.ts             # Agent lifecycle
│   ├── TaskScheduler.ts            # Execution planning
│   ├── ResultCoordinator.ts        # Result aggregation
│   ├── ConflictResolver.ts         # Conflict handling
│   └── protocol/
│       ├── AgentProtocol.ts        # Communication protocol
│       └── ContextSharing.ts       # Context sync
│
├── bridges/                        # Deep External Integrations
│   ├── DeepAgentBridge.ts          # Base interface
│   ├── deep/
│   │   ├── CopilotDeepBridge.ts    # vscode.lm API
│   │   ├── ClineDeepBridge.ts      # WebSocket
│   │   ├── CursorDeepBridge.ts     # Extension IPC
│   │   ├── AugmentDeepBridge.ts    # API integration
│   │   └── AiderDeepBridge.ts      # Process-based
│   └── legacy/                     # Fallback bridges
│
├── services/                       # Existing services (updated)
│   ├── DisposableService.ts        # Base class for proper disposal
│   └── ... (existing services extend DisposableService)
│
└── tests/                          # Test structure
    ├── unit/
    │   ├── services/
    │   │   ├── EnhancedAIBridgeService.test.ts
    │   │   ├── MCPIntegrationService.test.ts
    │   │   ├── VoiceRecognitionService.test.ts
    │   │   └── MultiFileEditingService.test.ts
    │   └── agent/
    │       ├── AgenticLoopEngine.test.ts
    │       └── PlannerService.test.ts
    ├── integration/
    │   ├── voice-to-code.test.ts
    │   └── multi-agent-execution.test.ts
    └── e2e/
        ├── inline-completion.test.ts
        └── voice-commands.test.ts
```

---

*Plan Version: 2.1 (Integrated with Comprehensive Review)*
*Last Updated: December 17, 2024*
*Total Effort: 616 Hours (16 Weeks)*
*Author: AI Architecture Analysis*
```

