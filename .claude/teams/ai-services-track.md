---
name: ai-services-track
description: "Python services + Supabase functions + STT providers — the AI/backend axis."
lead: python-service-engineer
agents: [python-service-engineer, supabase-edge-functions-engineer, stt-provider-engineer, coding-agent-engineer, express-api-builder]
---

# AI Services Track Team

## Mission
The backend/AI axis of VoiceCode: Python LangGraph agents, Supabase edge functions, STT providers, AIML API integration.

## Workflow
1. **python-service-engineer** designs the LangGraph node + state shape in `services/agent-core/`
2. **stt-provider-engineer** ensures STT pipeline can feed the new flow
3. **coding-agent-engineer** (Rust side) wires the desktop app to invoke the new Python flow
4. **supabase-edge-functions-engineer** adds any persistence + auth + payment-flow needs
5. **express-api-builder** exposes any alert/notification side effects via the API service

## Cross-service patterns
- Python services → Rust desktop: HTTP or WebSocket; typed via JSON Schema or pydantic models
- Auth: Supabase Auth tokens flow through; never re-implement
- Long-running work: queued (BullMQ-equivalent in Python, or Supabase queues), not held in process

## Exit criteria
- LangGraph flow tested with mocked LLMs
- Edge functions deployed to staging + verified via `test-payment-flow.ps1` style scripts
- STT provider integration works under streaming load
- End-to-end test: desktop → Python service → Supabase → response

## Hard rules
- Service boundaries strict — `agent-core` and `ai-processor` don't share state
- RLS on every Supabase table; edge functions use service role key server-side only
- LLM cost telemetry — every prompt has tenant attribution
- No service has > 10s blocking call without explicit async handling
