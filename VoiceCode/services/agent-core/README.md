# VoiceCode Agent Core

Intelligent agentic AI service for VoiceCode, built with LangGraph and LlamaIndex.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        VoiceCode Agent Core                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐ │
│  │   FastAPI   │    │              LangGraph Supervisor                │ │
│  │   + WS      │───▶│  ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │ │
│  └─────────────┘    │  │ Classify│─▶│  Route  │─▶│ Specialized    │   │ │
│                     │  │ Intent  │ │         │ │ Agents          │   │ │
│                     │  └─────────┘ └─────────┘ └─────────────────┘   │ │
│                     └─────────────────────────────────────────────────┘ │
│                                        │                                 │
│  ┌────────────────────────────────────┼────────────────────────────────┐│
│  │                                    ▼                                 ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              ││
│  │  │ Transcription│  │   Medical    │  │ Productivity │   ...        ││
│  │  │    Tools     │  │    Tools     │  │    Tools     │              ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘              ││
│  │                          Tool Registry                               ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     RAG Layer (LlamaIndex)                           ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐      ││
│  │  │   Indexer    │  │  Retriever   │  │  pgvector (Supabase) │      ││
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘      ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

- **Intelligent Routing**: Supervisor agent classifies intent and routes to specialized agents
- **Specialized Agents**: Transcription, Medical, Productivity, Search, Automation, Export
- **Domain Awareness**: Professional modes (medical, legal, business) with mode-specific responses
- **Semantic Search**: LlamaIndex-powered RAG for transcript retrieval
- **Real-time Streaming**: WebSocket support for streaming responses
- **Session Persistence**: LangGraph checkpointing for conversation continuity

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL with pgvector extension
- Redis (for session caching)
- OpenAI API key

### Installation

```bash
# Clone the repo
cd services/agent-core

# Install dependencies
pip install -e ".[dev]"

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Run the service
uvicorn src.api.main:app --reload
```

### Docker

```bash
docker-compose up -d
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/agent/chat` | POST | Send message, get response |
| `/api/v1/agent/command` | POST | Execute specific tool |
| `/api/v1/agent/search` | POST | Semantic search |
| `/api/v1/agent/suggestions` | GET | Proactive suggestions |
| `/ws/agent/{session_id}` | WS | Real-time chat |

## SDK Usage

### TypeScript/JavaScript

```typescript
import { VoiceCodeAgent } from '@voicecode/agent-sdk';

const agent = new VoiceCodeAgent({
  baseUrl: 'http://localhost:8000',
});

// Chat
const response = await agent.chat('Summarize my last meeting');
console.log(response.message);

// Execute command directly
const result = await agent.executeCommand('generate_soap_note', {
  transcript_id: 'trans_123',
});
```

### React Hooks

```tsx
import { useAgent, useProductivity } from '@voicecode/agent-sdk';

function TranscriptView({ transcriptId }) {
  const { sendMessage, isLoading } = useAgent();
  const { summarize, extractActionItems } = useProductivity();

  const handleSummarize = async () => {
    const result = await summarize(transcriptId);
    console.log(result);
  };

  return (
    <button onClick={handleSummarize} disabled={isLoading}>
      Summarize
    </button>
  );
}
```

## Tools Available

### Transcription
- `start_recording` - Start a new recording
- `stop_recording` - Stop and transcribe
- `get_transcript` - Retrieve transcript
- `edit_transcript` - Edit content

### Medical
- `generate_soap_note` - SOAP documentation
- `generate_progress_note` - Follow-up notes
- `generate_discharge_summary` - Discharge docs
- `suggest_billing_codes` - ICD-10/CPT codes

### Productivity
- `summarize_transcript` - Create summaries
- `extract_action_items` - Find tasks
- `extract_key_points` - Main takeaways
- `generate_meeting_minutes` - Formatted minutes

### Search
- `search_transcripts` - Semantic search
- `find_mentions` - Find specific terms
- `find_similar` - Similar transcripts

### Automation
- `create_workflow` - Create automations
- `schedule_recording` - Schedule recordings

### Export
- `export_transcript` - PDF, DOCX, TXT
- `share_with_team` - Share via email
- `send_to_slack` - Slack integration
- `send_to_notion` - Notion export

## Development

```bash
# Run tests
pytest

# Lint
ruff check src/

# Type check
mypy src/
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `REDIS_URL` | Redis connection | No |
| `LANGSMITH_API_KEY` | LangSmith tracing | No |
