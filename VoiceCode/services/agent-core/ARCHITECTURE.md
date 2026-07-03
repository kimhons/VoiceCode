# VoiceCode Agentic AI Architecture

## Executive Summary

This document outlines a comprehensive agentic AI system for VoiceCode that provides intelligent, autonomous assistance across mobile and web platforms. The system leverages **LangGraph** for orchestration, **LlamaIndex** for RAG capabilities, and custom VoiceCode tools to create a competitive edge in the voice transcription market.

## Framework Selection Analysis

| Framework | Strengths | Use Case in VoiceCode |
|-----------|-----------|----------------------|
| **LangGraph** | State management, durability, checkpoints, human-in-the-loop | Core orchestration layer |
| **LlamaIndex** | RAG, document indexing, semantic search | Transcript retrieval & context |
| **CrewAI** | Multi-agent collaboration | Specialized agent teams |

### Why LangGraph as Core?

1. **Production-Ready**: Durable execution, failure recovery, checkpointing
2. **State Management**: TypedDict state with persistence across sessions
3. **Human-in-the-Loop**: `interrupt()` for user confirmation on sensitive actions
4. **Streaming**: Native support for streaming responses
5. **Observability**: LangSmith integration for debugging

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VoiceCode Agent Core                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Mobile    │    │    Web      │    │   Desktop   │                 │
│  │    App      │    │    App      │    │    App      │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            │                                            │
│                    ┌───────▼───────┐                                    │
│                    │  Agent SDK    │  TypeScript/React Native           │
│                    │  (Unified)    │                                    │
│                    └───────┬───────┘                                    │
│                            │                                            │
│                    ┌───────▼───────┐                                    │
│                    │  WebSocket /  │  Real-time bidirectional           │
│                    │  REST API     │                                    │
│                    └───────┬───────┘                                    │
│                            │                                            │
├────────────────────────────┼────────────────────────────────────────────┤
│                            │           AGENT SERVICE (Python)           │
│                    ┌───────▼───────┐                                    │
│                    │   Gateway     │  Auth, Rate Limit, Routing         │
│                    │   Router      │                                    │
│                    └───────┬───────┘                                    │
│                            │                                            │
│         ┌──────────────────┼──────────────────┐                         │
│         │                  │                  │                         │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐                 │
│  │  Supervisor │    │   Intent    │    │   Context   │                 │
│  │    Agent    │    │  Classifier │    │   Manager   │                 │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘                 │
│         │                                     │                         │
│         │           LangGraph                 │                         │
│  ┌──────▼─────────────────────────────────────▼──────┐                 │
│  │              Agent Orchestration Graph             │                 │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │                 │
│  │  │Transcri-│  │ Medical │  │Producti-│           │                 │
│  │  │ption    │  │ Scribe  │  │vity     │  ...      │                 │
│  │  │ Agent   │  │ Agent   │  │ Agent   │           │                 │
│  │  └────┬────┘  └────┬────┘  └────┬────┘           │                 │
│  │       │            │            │                 │                 │
│  │  ┌────▼────────────▼────────────▼────┐           │                 │
│  │  │         Tool Registry             │           │                 │
│  │  │  - Transcription Tools            │           │                 │
│  │  │  - Medical Documentation Tools    │           │                 │
│  │  │  - Export/Integration Tools       │           │                 │
│  │  │  - Search/Retrieval Tools         │           │                 │
│  │  │  - Automation Tools               │           │                 │
│  │  └───────────────────────────────────┘           │                 │
│  └───────────────────────────────────────────────────┘                 │
│                            │                                            │
│  ┌─────────────────────────▼─────────────────────────┐                 │
│  │              LlamaIndex RAG Layer                  │                 │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │                 │
│  │  │ Transcript  │  │   Vector    │  │  Semantic │  │                 │
│  │  │   Index     │  │   Store     │  │  Search   │  │                 │
│  │  └─────────────┘  └─────────────┘  └───────────┘  │                 │
│  └───────────────────────────────────────────────────┘                 │
│                            │                                            │
├────────────────────────────┼────────────────────────────────────────────┤
│                    ┌───────▼───────┐                                    │
│                    │   Supabase    │  Postgres + pgvector               │
│                    │   Database    │                                    │
│                    └───────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Supervisor Agent (Orchestrator)

The supervisor agent routes user requests to specialized sub-agents based on intent classification.

```python
class SupervisorState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: str
    session_id: str
    intent: str
    context: dict
    active_agent: str
    pending_confirmation: bool
```

**Responsibilities:**
- Intent classification and routing
- Multi-turn conversation management
- Human-in-the-loop confirmations
- Agent handoff coordination

### 2. Specialized Agents

| Agent | Purpose | Key Tools |
|-------|---------|-----------|
| **TranscriptionAgent** | Real-time transcription, editing | `start_recording`, `stop_recording`, `edit_transcript` |
| **MedicalScribeAgent** | SOAP notes, clinical docs | `generate_soap`, `create_discharge`, `ehr_integration` |
| **ProductivityAgent** | Summaries, action items | `summarize`, `extract_actions`, `create_meeting_minutes` |
| **SearchAgent** | Semantic search, retrieval | `search_transcripts`, `find_similar`, `retrieve_context` |
| **AutomationAgent** | Workflows, integrations | `create_automation`, `trigger_webhook`, `schedule_task` |
| **ExportAgent** | Format conversion, sharing | `export_pdf`, `export_docx`, `share_transcript` |

### 3. Tool Registry

Tools are the actions agents can perform. Each tool is:
- **Typed**: Full TypeScript/Python type definitions
- **Validated**: Input validation with Pydantic
- **Observable**: Logging and metrics
- **Recoverable**: Retry logic and fallbacks

### 4. RAG Layer (LlamaIndex)

```python
# Transcript indexing with semantic embeddings
index = VectorStoreIndex.from_documents(
    documents=transcripts,
    embed_model=OpenAIEmbedding(model="text-embedding-3-small"),
    storage_context=storage_context  # pgvector
)

# Query engine for semantic search
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact"
)
```

## Competitive Edge Features

### 1. Proactive Intelligence
- **Auto-detect intent**: Understands "I need to document this patient visit" → triggers Medical Scribe
- **Smart suggestions**: Surfaces relevant past transcripts as context
- **Anticipatory actions**: Prepares exports before user asks

### 2. Context Continuity
- **Cross-session memory**: Remembers user preferences, terminology
- **Transcript linking**: Connects related conversations
- **Vocabulary learning**: Adapts to domain-specific terms

### 3. Multi-Modal Integration
- **Voice commands**: "Hey VoiceCode, summarize my last meeting"
- **Inline assistance**: Real-time suggestions during transcription
- **Ambient intelligence**: Background analysis without explicit commands

### 4. Domain Specialization
- **Medical mode**: HIPAA-aware, EHR integration, clinical terminology
- **Legal mode**: Deposition formatting, case references
- **Business mode**: Meeting minutes, action items, follow-ups

## API Design

### WebSocket Events (Real-time)

```typescript
// Client → Server
interface AgentRequest {
  type: 'message' | 'command' | 'context_update';
  sessionId: string;
  payload: {
    content?: string;
    command?: string;
    context?: Record<string, any>;
  };
}

// Server → Client
interface AgentResponse {
  type: 'message' | 'tool_call' | 'confirmation_required' | 'stream_chunk';
  sessionId: string;
  payload: {
    content?: string;
    toolName?: string;
    toolResult?: any;
    confirmationId?: string;
    isComplete?: boolean;
  };
}
```

### REST Endpoints

```
POST /api/agent/chat          - Send message, get response
POST /api/agent/command       - Execute specific command
POST /api/agent/confirm       - Confirm pending action
GET  /api/agent/session/:id   - Get session history
GET  /api/agent/suggestions   - Get proactive suggestions
POST /api/agent/index         - Index new transcript
GET  /api/agent/search        - Semantic search
```

## State Management

```python
# LangGraph state with checkpointing
graph = StateGraph(SupervisorState)
graph.add_node("classify_intent", classify_intent)
graph.add_node("route_to_agent", route_to_agent)
graph.add_node("transcription_agent", transcription_agent)
graph.add_node("medical_agent", medical_agent)
graph.add_node("productivity_agent", productivity_agent)
graph.add_node("human_confirmation", human_confirmation)

# Checkpointing for durability
checkpointer = PostgresSaver(conn_string)
app = graph.compile(checkpointer=checkpointer)
```

## Security & Compliance

1. **Authentication**: JWT tokens, session management
2. **Authorization**: Role-based access control
3. **Data Isolation**: User-scoped data access
4. **HIPAA Compliance**: Audit logging, encryption, BAA support
5. **Rate Limiting**: Per-user, per-endpoint limits

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                  Kubernetes                      │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ Agent API   │  │ Agent API   │  (Replicas)   │
│  │ Pod 1       │  │ Pod 2       │               │
│  └──────┬──────┘  └──────┬──────┘               │
│         └────────┬───────┘                      │
│           ┌──────▼──────┐                       │
│           │   Redis     │  (Session State)      │
│           └─────────────┘                       │
│           ┌─────────────┐                       │
│           │  Supabase   │  (Postgres+pgvector)  │
│           └─────────────┘                       │
└─────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Python agent service with FastAPI
- [ ] Implement LangGraph supervisor graph
- [ ] Create basic tool registry
- [ ] TypeScript SDK for web/mobile

### Phase 2: Core Agents (Week 3-4)
- [ ] TranscriptionAgent with real-time tools
- [ ] ProductivityAgent (summaries, action items)
- [ ] SearchAgent with LlamaIndex RAG

### Phase 3: Specialization (Week 5-6)
- [ ] MedicalScribeAgent with SOAP, EHR tools
- [ ] AutomationAgent with workflow builder
- [ ] ExportAgent with multi-format support

### Phase 4: Intelligence (Week 7-8)
- [ ] Proactive suggestions engine
- [ ] Cross-session memory
- [ ] Vocabulary learning system

## File Structure

```
services/agent-core/
├── src/
│   ├── agents/
│   │   ├── supervisor.py
│   │   ├── transcription_agent.py
│   │   ├── medical_agent.py
│   │   ├── productivity_agent.py
│   │   └── search_agent.py
│   ├── tools/
│   │   ├── registry.py
│   │   ├── transcription_tools.py
│   │   ├── medical_tools.py
│   │   ├── productivity_tools.py
│   │   └── search_tools.py
│   ├── rag/
│   │   ├── indexer.py
│   │   ├── retriever.py
│   │   └── embeddings.py
│   ├── api/
│   │   ├── main.py
│   │   ├── routes.py
│   │   └── websocket.py
│   ├── models/
│   │   ├── state.py
│   │   ├── messages.py
│   │   └── tools.py
│   └── config/
│       └── settings.py
├── sdk/
│   └── typescript/
│       ├── src/
│       │   ├── client.ts
│       │   ├── types.ts
│       │   └── hooks.ts
│       └── package.json
├── tests/
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

## Success Metrics

1. **Response Latency**: < 500ms for simple queries, < 2s for complex tasks
2. **Accuracy**: > 95% intent classification, > 90% tool selection
3. **User Satisfaction**: NPS > 50
4. **Automation Rate**: > 60% of tasks completed without manual intervention
