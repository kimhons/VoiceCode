# VoiceCode: AquaVoice Parity & Coding Agent Implementation Plan

## Executive Summary

This document analyzes VoiceCode (desktop + web apps) against AquaVoice, identifies feature parity gaps, and outlines a comprehensive plan to achieve feature parity while extending VoiceCode into a coding agent platform.

---

## Part 1: AquaVoice Feature Analysis

### Core Product
AquaVoice is a desktop voice dictation application for Mac and Windows that emphasizes:
- **Speed**: 450ms text insertion (Instant Mode), 850ms (Streaming Mode)
- **Accuracy**: 97.3% on technical terms (AISpeak benchmark)
- **Developer Focus**: Code syntax, frameworks, and technical terminology recognition
- **Avalon Model**: Custom speech recognition model trained on developer workflows

### Key AquaVoice Features

| Feature | Description | Importance |
|---------|-------------|------------|
| **Ultra-Fast Startup** | <50ms startup time | Critical for UX |
| **Instant Mode** | 450ms response time for quick text | High |
| **Streaming Mode** | 850ms with deeper context understanding | High |
| **Code-Aware Dictation** | Recognizes kubectl, PyTorch, GPT-4o, etc. | Critical |
| **Screen Context** | Reads screen content for improved accuracy | High |
| **Custom Dictionary** | User-defined technical terms | Medium |
| **Natural Language Commands** | "put that into bullet points" | High |
| **Voice-Based Editing** | "change X to Y" without mode switch | High |
| **Custom Instructions** | Persistent formatting rules | Medium |
| **IDE Integration** | Works in Cursor, VS Code, terminals | Critical |
| **Global Hotkey** | Activate from any app | Critical |
| **App-Aware Formatting** | Adjusts output per application | High |

### AquaVoice Pricing
- **Free Trial**: 1,000 words
- **Standard**: $8/month or $96/year
- **Premium/Power User**: $120/month

### AquaVoice Technical Architecture
- Cloud-based transcription (cannot run locally at required speed)
- Custom Avalon ASR model
- LLM post-processing for formatting and commands
- Mixture-of-experts approach

---

## Part 2: VoiceCode Current State Analysis

### Desktop App (Tauri + Rust)

**Strengths:**
- Global dictation with hotkey support
- Rust backend for performance
- AI/ML integration (300+ models via AIML API)
- Professional modes (Medical, Legal, Business, Developer, Education)
- AES-GCM encryption
- Memory management and caching
- Cross-platform (Windows, macOS, Linux)

**Gaps vs AquaVoice:**
| Gap | Severity | Notes |
|-----|----------|-------|
| Startup time not optimized (<50ms target) | High | AquaVoice <50ms |
| No streaming mode (450ms/850ms targets) | Critical | Currently no real-time streaming |
| No screen context awareness | High | AquaVoice reads screen |
| Limited code vocabulary training | High | Generic STT vs code-optimized |
| No natural language editing commands | High | "change X to Y" style |
| No app-aware formatting | Medium | Same output everywhere |
| No custom dictionary UI | Medium | Backend exists, no UI |
| Developer mode underdeveloped | High | Basic implementation |

### Web App (React + TypeScript)

**Strengths:**
- Comprehensive UI with 130+ components
- Real-time transcription via WebSocket
- TipTap rich text editor
- Professional mode vocabularies
- Video transcription
- Export to multiple formats
- Cloud sync with Supabase
- PWA-ready (mostly)

**Gaps vs AquaVoice:**
| Gap | Severity | Notes |
|-----|----------|-------|
| No global system integration | Critical | Web cannot inject text globally |
| No screen context reading | Critical | Browser sandbox limitation |
| Higher latency than desktop | High | Network overhead |
| No streaming real-time mode | High | Batch processing |
| Limited code dictation UI | Medium | No code-specific features |

### Desktop vs Web Parity Gaps

| Feature | Desktop | Web | Parity Action |
|---------|---------|-----|---------------|
| Global dictation | Yes | No | Web extension or companion |
| Screen context | Possible | No | Desktop-only feature |
| Offline mode | Partial | No | Service worker + local model |
| Real-time streaming | Partial | Yes (WebSocket) | Unify architecture |
| Settings sync | Local | Cloud | Add desktop cloud sync |
| Payment integration | Partial | Partial | Complete both |
| Professional modes | Yes | Yes | Aligned |
| Export formats | Partial | Full | Add to desktop |

---

## Part 3: Coding Agent Vision

### What is a Coding Agent?

A coding agent extends voice dictation into an intelligent development assistant that can:
1. **Understand Code Context** - Reads current file, project structure, dependencies
2. **Execute Commands** - Git operations, npm/yarn, terminal commands
3. **Generate Code** - Write functions, classes, tests from voice descriptions
4. **Edit Code** - Voice-controlled refactoring, bug fixes
5. **Navigate Codebase** - "Go to the authentication module"
6. **Explain Code** - "What does this function do?"
7. **Debug Assistance** - "Why is this test failing?"

### Competitive Landscape

| Product | Type | Coding Focus |
|---------|------|--------------|
| AquaVoice | Dictation | Technical terms, IDE integration |
| GitHub Copilot Voice | Agent | Voice + code generation (discontinued) |
| Cursor | IDE + AI | Text-based, not voice |
| Claude Code | Agent | CLI agent, text-based |
| Talon | Voice Control | Programmable voice commands |
| Cursorless | Navigation | Voice navigation for VS Code |

### VoiceCode Coding Agent Opportunity

VoiceCode can differentiate by combining:
1. **AquaVoice-level dictation** - Fast, accurate code dictation
2. **Agentic capabilities** - Execute tasks, not just transcribe
3. **Multi-modal** - Voice + text + screen context
4. **Cross-platform** - Desktop, Web, IDE extensions

---

## Part 4: Implementation Plan

### Phase 1: AquaVoice Parity (Core Dictation)

**Goal**: Match AquaVoice's core dictation experience

#### 1.1 Performance Optimization (Desktop)
**Priority**: Critical | **Effort**: 2 weeks

```
Tasks:
- [ ] Optimize Tauri startup time to <100ms (target <50ms)
- [ ] Implement lazy loading for non-critical modules
- [ ] Pre-warm STT engine at startup
- [ ] Profile and optimize Rust backend initialization
- [ ] Add startup benchmarking metrics
```

#### 1.2 Streaming Real-Time Mode (Desktop + Web)
**Priority**: Critical | **Effort**: 3 weeks

```
Tasks:
- [ ] Implement true streaming STT (vs batch processing)
- [ ] Create "Instant Mode" with 450ms target latency
- [ ] Create "Streaming Mode" with deeper LLM processing
- [ ] Add WebSocket reconnection and fallback logic
- [ ] Implement audio buffering for latency optimization
- [ ] Add latency metrics dashboard
```

#### 1.3 Code-Optimized Vocabulary (Desktop + Web)
**Priority**: High | **Effort**: 2 weeks

```
Tasks:
- [ ] Create code-specific vocabulary dataset
  - Programming languages: Python, JavaScript, TypeScript, Rust, Go, etc.
  - Frameworks: React, Vue, Angular, Django, FastAPI, etc.
  - Tools: kubectl, docker, git, npm, yarn, pip, etc.
  - AI models: GPT-4o, Claude, Gemini, Llama, etc.
  - Special characters: camelCase, snake_case, PascalCase
- [ ] Train/fine-tune custom vocabulary layer
- [ ] Integrate with AIML API custom vocabulary endpoint
- [ ] Add vocabulary management UI
- [ ] Create vocabulary import/export
```

#### 1.4 Screen Context Awareness (Desktop)
**Priority**: High | **Effort**: 2 weeks

```
Tasks:
- [ ] Implement screen capture API (Tauri)
- [ ] Add OCR for screen text extraction
- [ ] Create context injection for STT prompts
- [ ] Detect active application and window title
- [ ] Implement privacy controls (exclude sensitive apps)
- [ ] Add screen context toggle in settings
```

#### 1.5 Natural Language Editing Commands
**Priority**: High | **Effort**: 2 weeks

```
Tasks:
- [ ] Implement command parser for natural language
- [ ] Create command registry:
  - "change X to Y" → find and replace
  - "put that into bullet points" → format as list
  - "make that a heading" → format as H1/H2/H3
  - "capitalize that" → case transformation
  - "delete last sentence" → selective deletion
  - "undo that" → undo last action
- [ ] Add command confirmation UI
- [ ] Create customizable command aliases
- [ ] Implement command history
```

#### 1.6 Custom Dictionary UI (Desktop + Web)
**Priority**: Medium | **Effort**: 1 week

```
Tasks:
- [ ] Create dictionary management page
- [ ] Implement add/edit/delete terms
- [ ] Support phonetic hints
- [ ] Add import from file (CSV, JSON)
- [ ] Sync dictionary across devices
- [ ] Create suggested terms from usage
```

#### 1.7 App-Aware Formatting (Desktop)
**Priority**: Medium | **Effort**: 1 week

```
Tasks:
- [ ] Detect target application
- [ ] Create formatting profiles per app:
  - Slack: casual, emoji-friendly
  - Email: professional, proper punctuation
  - Terminal: lowercase, no punctuation
  - IDE: code formatting, proper casing
- [ ] Add custom profile editor
- [ ] Implement profile auto-detection learning
```

### Phase 2: Desktop-Web Feature Parity

**Goal**: Unified experience across platforms

#### 2.1 Desktop Cloud Sync
**Priority**: High | **Effort**: 1 week

```
Tasks:
- [ ] Add Supabase integration to desktop app
- [ ] Sync transcription history
- [ ] Sync settings and preferences
- [ ] Sync custom dictionary
- [ ] Add offline queue for sync
- [ ] Implement conflict resolution
```

#### 2.2 Web Global Dictation (Browser Extension)
**Priority**: Medium | **Effort**: 2 weeks

```
Tasks:
- [ ] Create Chrome/Firefox extension
- [ ] Implement global hotkey (extension-level)
- [ ] Add text injection to active page
- [ ] Create floating dictation UI
- [ ] Sync with web app auth
- [ ] Handle cross-origin restrictions
```

#### 2.3 Export Format Parity
**Priority**: Low | **Effort**: 1 week

```
Tasks:
- [ ] Add PDF export to desktop
- [ ] Add DOCX export to desktop
- [ ] Add subtitle export (SRT, VTT) to desktop
- [ ] Unify export UI components
```

### Phase 3: Coding Agent Capabilities

**Goal**: Transform VoiceCode into an intelligent coding assistant

#### 3.1 IDE Extension Architecture
**Priority**: Critical | **Effort**: 3 weeks

```
Tasks:
- [ ] Create VS Code extension
- [ ] Create Cursor extension (VS Code compatible)
- [ ] Create JetBrains plugin (IntelliJ, WebStorm, PyCharm)
- [ ] Implement extension ↔ desktop app communication
- [ ] Create extension ↔ web app WebSocket bridge
- [ ] Add extension marketplace listings
```

**VS Code Extension Features:**
```typescript
interface VoiceCodeExtension {
  // Voice Input
  activateDictation(): void;
  stopDictation(): void;

  // Code Context
  getCurrentFile(): FileContext;
  getSelection(): SelectionContext;
  getProjectStructure(): ProjectContext;

  // Actions
  insertCode(code: string, position?: Position): void;
  replaceSelection(code: string): void;
  executeCommand(command: string): void;
  navigateToSymbol(symbol: string): void;

  // AI Integration
  explainCode(selection: string): Promise<string>;
  generateCode(prompt: string): Promise<string>;
  refactorCode(selection: string, instruction: string): Promise<string>;
}
```

#### 3.2 Code Context Engine
**Priority**: Critical | **Effort**: 2 weeks

```
Tasks:
- [ ] Build file parser for multiple languages
- [ ] Create AST extraction for context
- [ ] Implement symbol table for navigation
- [ ] Add dependency graph analysis
- [ ] Create project structure indexing
- [ ] Implement incremental updates (file watch)
```

**Context Schema:**
```typescript
interface CodeContext {
  file: {
    path: string;
    language: string;
    content: string;
  };
  cursor: {
    line: number;
    column: number;
    scope: string; // function, class, module
  };
  selection?: {
    text: string;
    startLine: number;
    endLine: number;
  };
  project: {
    name: string;
    type: string; // npm, cargo, pip, etc.
    dependencies: string[];
    structure: DirectoryTree;
  };
  git?: {
    branch: string;
    status: string[];
    recentCommits: string[];
  };
}
```

#### 3.3 Voice Command System for Code
**Priority**: High | **Effort**: 2 weeks

```
Tasks:
- [ ] Design command grammar
- [ ] Implement command parser
- [ ] Create command executor with safety checks
- [ ] Add command preview/confirmation
- [ ] Implement undo/redo stack
```

**Command Categories:**

**Navigation Commands:**
```
"go to function [name]"
"go to line [number]"
"go to file [name]"
"find all references to [symbol]"
"show definition of [symbol]"
"open terminal"
```

**Code Generation Commands:**
```
"create function [name] that [description]"
"add import for [module]"
"generate test for [function]"
"create class [name] with [description]"
"add error handling to this function"
"add TypeScript types to this file"
```

**Editing Commands:**
```
"rename [old] to [new]"
"extract this to a function called [name]"
"inline this variable"
"add parameter [name] of type [type]"
"remove this function"
"comment out this block"
```

**Git Commands:**
```
"commit with message [message]"
"create branch [name]"
"switch to branch [name]"
"show git status"
"stage this file"
"push to origin"
```

**Terminal Commands:**
```
"run tests"
"run build"
"install [package]"
"run [script name]"
"show logs"
```

#### 3.4 AI Code Generation Pipeline
**Priority**: High | **Effort**: 2 weeks

```
Tasks:
- [ ] Create code generation prompt templates
- [ ] Implement streaming code generation
- [ ] Add syntax validation before insertion
- [ ] Create multi-file generation support
- [ ] Implement iterative refinement ("make it shorter")
- [ ] Add code explanation generation
```

**Generation Flow:**
```
Voice Input → STT → Intent Classification → Context Gathering →
Prompt Construction → LLM Generation → Syntax Validation →
Preview → User Confirmation → Code Insertion
```

#### 3.5 Terminal Integration
**Priority**: High | **Effort**: 1 week

```
Tasks:
- [ ] Implement shell command execution
- [ ] Add command safety validation
- [ ] Create output streaming to UI
- [ ] Implement command history
- [ ] Add command suggestions
- [ ] Support multiple shells (bash, zsh, PowerShell)
```

**Safety Rules:**
```typescript
const dangerousPatterns = [
  /rm\s+-rf/,           // Destructive deletion
  />(\/dev\/|\/etc\/)/,  // System file overwrite
  /chmod\s+777/,        // Insecure permissions
  /curl.*\|.*sh/,       // Pipe to shell
  /sudo\s+rm/,          // Sudo deletion
];

const requireConfirmation = [
  /git\s+push.*--force/,
  /npm\s+publish/,
  /docker\s+rm/,
];
```

#### 3.6 Multi-Modal Context
**Priority**: Medium | **Effort**: 2 weeks

```
Tasks:
- [ ] Implement screenshot capture in IDE
- [ ] Add error message OCR
- [ ] Create browser console context capture
- [ ] Implement clipboard code detection
- [ ] Add image-to-code generation
- [ ] Create debug context aggregation
```

### Phase 4: Advanced Agent Features

#### 4.1 Agentic Task Execution
**Priority**: Medium | **Effort**: 3 weeks

```
Tasks:
- [ ] Implement multi-step task planning
- [ ] Create task execution engine
- [ ] Add progress tracking UI
- [ ] Implement rollback on failure
- [ ] Create task templates (e.g., "set up new React project")
- [ ] Add task history and replay
```

**Example Multi-Step Task:**
```
User: "Create a new API endpoint for user authentication"

Agent Plan:
1. Analyze existing auth patterns in codebase
2. Create route file: src/routes/auth.ts
3. Create controller: src/controllers/authController.ts
4. Create middleware: src/middleware/authMiddleware.ts
5. Add validation schemas: src/schemas/authSchemas.ts
6. Update router index to include new routes
7. Generate tests: src/__tests__/auth.test.ts
8. Update API documentation

[Execute with user confirmation at each step]
```

#### 4.2 Codebase Understanding
**Priority**: Medium | **Effort**: 2 weeks

```
Tasks:
- [ ] Implement codebase indexing
- [ ] Create semantic search over code
- [ ] Add architecture diagram generation
- [ ] Implement dependency analysis
- [ ] Create "explain this codebase" feature
- [ ] Add onboarding mode for new codebases
```

#### 4.3 Debugging Assistant
**Priority**: Medium | **Effort**: 2 weeks

```
Tasks:
- [ ] Capture error stack traces
- [ ] Implement error explanation
- [ ] Create fix suggestions
- [ ] Add test failure analysis
- [ ] Implement log analysis
- [ ] Create breakpoint suggestions
```

#### 4.4 Documentation Generation
**Priority**: Low | **Effort**: 1 week

```
Tasks:
- [ ] Generate JSDoc/docstrings from code
- [ ] Create README generation
- [ ] Add API documentation generation
- [ ] Implement changelog generation
- [ ] Create architecture documentation
```

---

## Part 5: Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VoiceCode Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Desktop App │  │   Web App    │  │   IDE Extensions     │   │
│  │  (Tauri)     │  │   (React)    │  │   (VS Code, etc.)    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│  ┌──────▼─────────────────▼──────────────────────▼───────────┐  │
│  │                    Shared Services Layer                   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ Voice Input │ │ Code Context│ │ Command Processor   │  │  │
│  │  │ Service     │ │ Engine      │ │                     │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │ AI Service  │ │ Terminal    │ │ Sync Service        │  │  │
│  │  │ Gateway     │ │ Service     │ │                     │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼─────┐        ┌──────▼──────┐       ┌─────▼─────┐
    │ AIML API │        │  Supabase   │       │  Custom   │
    │ Gateway  │        │  Backend    │       │  Models   │
    └──────────┘        └─────────────┘       └───────────┘
```

### Data Flow for Code Generation

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│  Voice  │────▶│   STT   │────▶│  Intent  │────▶│ Context │
│  Input  │     │ Engine  │     │ Classify │     │ Gather  │
└─────────┘     └─────────┘     └──────────┘     └────┬────┘
                                                      │
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌────▼────┐
│  Code   │◀────│ Syntax  │◀────│   LLM    │◀────│ Prompt  │
│ Insert  │     │ Valid.  │     │ Generate │     │ Build   │
└─────────┘     └─────────┘     └──────────┘     └─────────┘
```

### Voice Command Processing Pipeline

```typescript
interface CommandPipeline {
  // Stage 1: Speech Recognition
  transcribe(audio: AudioBuffer): Promise<string>;

  // Stage 2: Intent Classification
  classifyIntent(text: string): Promise<{
    intent: 'dictation' | 'command' | 'question';
    confidence: number;
    entities: Entity[];
  }>;

  // Stage 3: Context Gathering
  gatherContext(): Promise<CodeContext>;

  // Stage 4: Command Execution or Generation
  execute(intent: Intent, context: CodeContext): Promise<Result>;

  // Stage 5: Result Application
  apply(result: Result): Promise<void>;
}
```

---

## Part 6: Milestones & Timeline

### Milestone 1: AquaVoice Core Parity
**Duration**: 6 weeks

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Performance | Startup <100ms, latency metrics |
| 3-4 | Streaming Mode | Real-time STT with 450ms/850ms modes |
| 5 | Code Vocabulary | Technical terms recognition |
| 6 | Commands & Dictionary | Natural language editing, dictionary UI |

### Milestone 2: Platform Parity
**Duration**: 3 weeks

| Week | Focus | Deliverables |
|------|-------|--------------|
| 7 | Desktop Sync | Supabase integration for desktop |
| 8-9 | Screen Context | OCR, app-aware formatting |

### Milestone 3: IDE Integration
**Duration**: 4 weeks

| Week | Focus | Deliverables |
|------|-------|--------------|
| 10-11 | VS Code Extension | Core extension with voice |
| 12-13 | Code Context Engine | AST, symbols, project structure |

### Milestone 4: Coding Agent MVP
**Duration**: 4 weeks

| Week | Focus | Deliverables |
|------|-------|--------------|
| 14-15 | Voice Commands | Navigation, generation, editing |
| 16-17 | AI Code Generation | Streaming generation, preview |

### Milestone 5: Advanced Features
**Duration**: 4 weeks

| Week | Focus | Deliverables |
|------|-------|--------------|
| 18-19 | Terminal Integration | Shell commands, safety |
| 20-21 | Multi-step Tasks | Task planning, execution |

**Total Estimated Duration**: 21 weeks (~5 months)

---

## Part 7: Success Metrics

### Dictation Quality
| Metric | Target | AquaVoice Benchmark |
|--------|--------|---------------------|
| Startup time | <100ms | <50ms |
| STT latency (instant) | <500ms | 450ms |
| STT latency (streaming) | <900ms | 850ms |
| Technical term accuracy | >95% | 97.3% |
| WER (general) | <5% | ~3% |

### Coding Agent Quality
| Metric | Target |
|--------|--------|
| Command recognition accuracy | >90% |
| Code generation success rate | >80% |
| Time saved per developer (daily) | >20 min |
| IDE extension MAU | 10,000+ |

### Platform Engagement
| Metric | Target |
|--------|--------|
| Desktop DAU | 5,000+ |
| Web DAU | 10,000+ |
| Paid conversion rate | >5% |
| NPS score | >50 |

---

## Part 8: Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| STT latency can't match AquaVoice | High | Partner with specialized ASR providers, consider Avalon API |
| Code generation quality issues | High | Extensive testing, user feedback loop, iterative prompts |
| IDE extension complexity | Medium | Start with VS Code only, iterate |
| Cloud dependency concerns | Medium | Offer local model options (Whisper.cpp) |
| Security vulnerabilities in code execution | Critical | Sandboxing, confirmation dialogs, audit logging |
| Competition from Cursor/GitHub Copilot | Medium | Differentiate on voice-first, cross-platform |

---

## Part 9: Competitive Positioning

### VoiceCode Unique Value Proposition

```
"VoiceCode: The Voice-First Coding Agent"

- AquaVoice-level dictation accuracy for code
- True coding agent capabilities (generate, edit, execute)
- Cross-platform (Desktop, Web, IDE extensions)
- Privacy-first with local processing options
- Professional modes for Medical, Legal, Business + Developer
- Open ecosystem vs. single-vendor lock-in
```

### Comparison Matrix

| Feature | VoiceCode | AquaVoice | Cursor | Copilot |
|---------|-----------|-----------|--------|---------|
| Voice dictation | Yes | Yes | No | Discontinued |
| Code generation | Yes (planned) | No | Yes | Yes |
| IDE integration | Yes (planned) | Works in IDE | Native | VS Code |
| Terminal commands | Yes (planned) | No | No | No |
| Cross-platform | Yes | Mac/Win | Mac/Win/Linux | VS Code |
| Privacy/Local | Yes | No (cloud) | No (cloud) | No (cloud) |
| Professional modes | Yes | No | No | No |
| Multi-step tasks | Yes (planned) | No | Yes | No |
| Price | TBD | $8-120/mo | $20/mo | $10/mo |

---

## Appendix A: Immediate Action Items

### This Week
1. [ ] Set up performance benchmarking for desktop startup time
2. [ ] Evaluate AIML API streaming capabilities vs. target latency
3. [ ] Create code vocabulary dataset structure
4. [ ] Design VS Code extension architecture document
5. [ ] Set up latency measurement telemetry

### Next 2 Weeks
1. [ ] Implement startup optimization in Tauri
2. [ ] Create streaming mode POC
3. [ ] Build custom dictionary UI mockups
4. [ ] Draft IDE extension protocol specification
5. [ ] Define command grammar specification

### Next Month
1. [ ] Complete Phase 1.1-1.3 (Performance, Streaming, Vocabulary)
2. [ ] Begin VS Code extension development
3. [ ] Create code context engine prototype
4. [ ] Set up automated latency testing CI/CD

---

## Appendix B: Resources & References

### AquaVoice Research
- [AquaVoice Homepage](https://aquavoice.com/)
- [Avalon API Documentation](https://aquavoice.com/avalon-api)
- [Introducing Avalon Blog Post](https://aquavoice.com/blog/introducing-avalon)
- [User Guide](https://aquavoice.com/guide)
- [Hacker News Discussion](https://news.ycombinator.com/item?id=43634005)
- [9to5Mac Review](https://9to5mac.com/2025/08/15/aqua-voice-shows-just-how-good-mac-dictation-could-be-if-apple-just-tried/)

### Related Technologies
- [Talon Voice](https://talonvoice.com/) - Programmable voice commands
- [Cursorless](https://www.cursorless.org/) - Voice navigation for VS Code
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - Local STT
- [Claude Code](https://claude.com/claude-code) - CLI coding agent

### VoiceCode Internal
- Desktop App: `apps/desktop/`
- Web App: `apps/web/`
- Shared Packages: `packages/`

---

*Document Version: 1.0*
*Created: January 2026*
*Last Updated: January 2026*
