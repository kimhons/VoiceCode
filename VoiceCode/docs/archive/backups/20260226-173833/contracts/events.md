# VoiceCode — Event Contracts

> Version: 1.0.0 | Generated: 2026-02-26 | Blueprint Forge OS™

---

## Tauri IPC Events (Desktop)

| ID | Event Name | Direction | Payload | REQ |
|----|-----------|-----------|---------|-----|
| EVT-STREAM-EVENT | `streaming-event` | Backend → Frontend | `{ event_type: 'final' \| 'interim' \| 'error', text?: string, confidence?: number }` | REQ-VOICE-0002 |
| EVT-AUDIO-LEVEL | `audio-level` | Backend → Frontend | `{ level: number, is_speech: boolean }` | REQ-VOICE-0006 |
| EVT-AGENT-UPDATE | `agent-update` | Backend → Frontend | `{ task_id: string, status: string, output?: string }` | REQ-AGENT-0005 |
| EVT-OCR-RESULT | `ocr-result` | Backend → Frontend | `{ text: string, tier: string, confidence: number }` | REQ-VISION-0002 |

## Tauri IPC Commands (Desktop)

| ID | Command | Direction | Args | Return | REQ |
|----|---------|-----------|------|--------|-----|
| EVT-CMD-START-STREAM | `start_streaming` | Frontend → Backend | `{ mode: string, provider: string }` | `Result<(), String>` | REQ-VOICE-0002 |
| EVT-CMD-STOP-STREAM | `stop_streaming` | Frontend → Backend | `{}` | `Result<String, String>` | REQ-VOICE-0002 |
| EVT-CMD-EXEC-VOICE | `execute_voice_command` | Frontend → Backend | `{ text: string }` | `Result<CodeResult, String>` | REQ-CODE-0004 |
| EVT-CMD-RUN-AGENT | `run_agent_task` | Frontend → Backend | `{ task: string, strategy: string }` | `Result<AgentResult, String>` | REQ-AGENT-0001 |
| EVT-CMD-CAPTURE | `capture_screen` | Frontend → Backend | `{ region?: Rect }` | `Result<ImageData, String>` | REQ-VISION-0001 |
| EVT-CMD-OCR | `run_ocr` | Frontend → Backend | `{ image: bytes, tier: string }` | `Result<OcrResult, String>` | REQ-VISION-0002 |

## Supabase Real-Time Events

| ID | Channel | Event | Payload | REQ |
|----|---------|-------|---------|-----|
| EVT-RT-SESSION | `real_time_sessions` | INSERT/UPDATE | Session row | REQ-DB-0003 |
| EVT-RT-TRANSCRIPT | `streaming_transcripts` | INSERT | Transcript chunk | REQ-DB-0003 |
| EVT-RT-SUGGESTION | `live_suggestions` | INSERT | Suggestion row | REQ-DB-0004 |

## Stripe Webhook Events

| ID | Event | Handler | REQ |
|----|-------|---------|-----|
| EVT-STRIPE-CHECKOUT | `checkout.session.completed` | `stripe-webhook/` | REQ-PAY-0001 |
| EVT-STRIPE-INVOICE | `invoice.payment_succeeded` | `stripe-webhook/` | REQ-PAY-0002 |
| EVT-STRIPE-CANCEL | `customer.subscription.deleted` | `stripe-webhook/` | REQ-PAY-0004 |

---

*All events derived from source code event emissions and Supabase configuration.*
