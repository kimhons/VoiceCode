# VoiceCode — Event Contracts

> Version: 2.0.0 | Updated: 2026-02-27 | Derived from source code

---

## Tauri Events (Backend → Frontend)

### EVT-001: `voice-status`

- **Source:** `main.rs:306` — inside `start_voice_listening()`
- **Payload:** `string` — currently always `"listening"`
- **Description:** Emitted when the voice recognition engine begins listening.

### EVT-002: `speech-transcript`

- **Source:** `main.rs:343` — inside `process_speech_with_ai()`
- **Payload:** `string` — the validated/sanitized transcript text
- **Description:** Emitted with the raw speech transcript before AI processing.

### EVT-003: `voice-response`

- **Source:** `main.rs:368, 393` — inside `process_speech_with_ai()`
- **Payload:** `string` — the processed text after AI enhancement
- **Description:** Emitted with the AI-processed result text. Sent both when the text processor is available and in the fallback path.

### EVT-004: `streaming-event`

- **Source:** `streaming.rs:780` — inside `start_streaming_event_bridge()`
- **Payload:** `TauriStreamingEvent` (see below)
- **Description:** Forwarded from the streaming engine's internal broadcast channel to the frontend via `app_handle.emit_all()`. Carries all real-time STT streaming data.

**`TauriStreamingEvent` struct** (defined at `streaming.rs:700`):

```
{
  event_type: string,       // see event_type values below
  text?: string,            // transcribed text (interim/final/enhanced)
  is_final?: boolean,       // true for final and enhanced results
  confidence?: number,      // 0.0–1.0 confidence score
  latency_ms?: number,      // processing latency in milliseconds
  enhanced?: boolean,       // true if LLM-enhanced
  original_text?: string,   // pre-enhancement text (when enhanced=true)
  audio_level?: number,     // 0.0–1.0 RMS audio level
  error?: string            // error message (when event_type="error")
}
```

**`event_type` values** (9 total, mapped from `StreamingEvent` enum at `streaming.rs:117`):

| `event_type` | Source Variant | Fields populated |
|---|---|---|
| `"connected"` | `StreamingEvent::Connected` | (none) |
| `"disconnected"` | `StreamingEvent::Disconnected` | (none) |
| `"interim"` | `StreamingEvent::InterimResult` | `text`, `is_final=false`, `confidence`, `latency_ms`, `enhanced`, `original_text` |
| `"final"` | `StreamingEvent::FinalResult` | `text`, `is_final=true`, `confidence`, `latency_ms`, `enhanced`, `original_text` |
| `"enhanced"` | `StreamingEvent::EnhancedResult` | `text`, `is_final=true`, `confidence`, `latency_ms`, `enhanced=true`, `original_text` |
| `"audio_level"` | `StreamingEvent::AudioLevel` | `audio_level` |
| `"error"` | `StreamingEvent::Error` | `error` |
| `"vad_start"` | `StreamingEvent::VoiceActivityStart` | (none) |
| `"vad_end"` | `StreamingEvent::VoiceActivityEnd` | (none) |

> **Note:** There is no standalone `audio-level` event. Audio level data is delivered as `event_type: "audio_level"` within the `streaming-event` payload.

### EVT-005: `audio-metrics`

- **Source:** `main.rs:824` — inside `handle_voice_events()`
- **Payload:**
  ```
  {
    volume: number,               // 0.5+ simulated value
    signal_to_noise_ratio: number, // currently 0.8
    clipping: boolean,            // currently false
    latency: number,              // milliseconds
    timestamp: number             // unix epoch seconds
  }
  ```
- **Description:** Periodic audio quality metrics emitted every 100ms from the voice event handling loop.

### EVT-006: `global-dictation-toggle`

- **Source:** `global_dictation.rs:94` — inside `register_hotkey()`
- **Payload:** `()` (unit / void — no data)
- **Description:** Emitted when the global dictation hotkey (default `CmdOrCtrl+Shift+D`) is pressed. The frontend toggles dictation on/off in response.

### EVT-007: `tray-action` *(currently commented out)*

- **Source:** `main.rs:947,953,957` — inside `handle_system_tray_event()` (entire function commented out)
- **Payload:** `string` — one of `"start_listening"`, `"stop_listening"`, `"settings"`
- **Description:** Would be emitted when system tray menu items are clicked. Currently disabled due to icon format issue (see `main.rs:906`).

---

## Tauri IPC Commands (Frontend → Backend)

### Key Command Groups

#### Voice Recognition

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `initialize_voice_recognition` | `(state, window)` | `Result<(), String>` | `main.rs:247` |
| `start_voice_listening` | `(state, window)` | `Result<(), String>` | `main.rs:298` |
| `stop_voice_listening` | `(state)` | `Result<(), String>` | `main.rs:313` |
| `get_voice_status` | `(state)` | `Result<HashMap<String, Value>, String>` | `main.rs:771` |

#### Text Processing

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `initialize_text_processor` | `(state)` | `Result<(), String>` | `main.rs:631` |
| `process_text` | `(text, context, tone, state)` | `Result<ProcessingResult, String>` | `main.rs:650` |
| `process_speech_with_ai` | `(transcript, state, window)` | `Result<ProcessingResult, String>` | `main.rs:326` |

#### Streaming STT

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `start_streaming_session` | `()` | `Result<String, String>` | `streaming.rs:629` |
| `stop_streaming_session` | `()` | `Result<(), String>` | `streaming.rs:634` |
| `set_streaming_mode` | `(mode: String)` | `Result<(), String>` | `streaming.rs:639` |
| `get_streaming_stats` | `()` | `Result<StreamingStats, String>` | `streaming.rs:656` |
| `set_streaming_config` | `(config: StreamingConfig)` | `Result<(), String>` | `streaming.rs:661` |
| `get_streaming_config` | `()` | `Result<StreamingConfig, String>` | `streaming.rs:667` |
| `process_audio_chunk` | `(audio_data: Vec<u8>)` | `Result<(), String>` | `streaming.rs:672` |
| `start_streaming_event_bridge` | `(app_handle)` | `Result<(), String>` | `streaming.rs:771` |
| `initialize_stt_providers` | `()` | `Result<(), String>` | `streaming.rs:679` |
| `get_stt_providers` | `()` | `Result<Vec<String>, String>` | `streaming.rs:684` |
| `set_active_stt_provider` | `(provider: String)` | `Result<(), String>` | `streaming.rs:689` |
| `is_real_stt_enabled` | `()` | `Result<bool, String>` | `streaming.rs:694` |
| `get_extended_streaming_stats` | `()` | `Result<ExtendedStreamingStats, String>` | `streaming.rs:808` |

#### Global Dictation

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `start_global_dictation` | `(state)` | `Result<(), String>` | `global_dictation.rs:324` |
| `stop_global_dictation` | `(state)` | `Result<String, String>` | `global_dictation.rs:332` |
| `update_global_dictation_text` | `(state, text)` | `Result<(), String>` | `global_dictation.rs:339` |
| `get_global_dictation_status` | `(state)` | `Result<Option<DictationSession>, String>` | `global_dictation.rs:349` |
| `update_global_dictation_config` | `(state, config)` | `Result<(), String>` | `global_dictation.rs:357` |
| `get_global_dictation_config` | `(state)` | `Result<GlobalDictationConfig, String>` | `global_dictation.rs:366` |
| `get_dictation_history` | `(state)` | `Result<Vec<DictationHistoryItem>, String>` | `global_dictation.rs:374` |
| `clear_dictation_history` | `(state)` | `Result<(), String>` | `global_dictation.rs:382` |
| `delete_dictation_history_item` | `(state, id)` | `Result<(), String>` | `global_dictation.rs:389` |
| `get_dictation_history_stats` | `(state)` | `Result<HistoryStats, String>` | `global_dictation.rs:399` |

#### Computer Vision

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `cv_capture_screen` | `(output_path?: String)` | `Result<CaptureResult, String>` | `main.rs:976` |
| `cv_analyze_screen` | `()` | `Result<ScreenAnalysis, String>` | `main.rs:981` |
| `cv_verbalize_screen` | `()` | `Result<String, String>` | `main.rs:986` |
| `cv_describe_location` | `(x: i32, y: i32)` | `Result<String, String>` | `main.rs:991` |
| `cv_set_capture_config` | `(config: ScreenCaptureConfig)` | `Result<(), String>` | `main.rs:996` |
| `cv_set_verbalization_config` | `(config: VerbalizationConfig)` | `Result<(), String>` | `main.rs:1001` |

#### Audio Capture

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `init_audio` | — | — | `commands/audio.rs` |
| `start_recording` | — | — | `commands/audio.rs` |
| `stop_recording` | — | — | `commands/audio.rs` |
| `cancel_recording` | — | — | `commands/audio.rs` |
| `get_recording_status` | — | — | `commands/audio.rs` |
| `get_audio_devices` | — | — | `commands/audio.rs` |
| `get_default_audio_device` | — | — | `commands/audio.rs` |
| `is_audio_available` | — | — | `commands/audio.rs` |

#### Settings

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `get_settings` | `(state)` | `Result<Settings, String>` | `main.rs:741` |
| `update_settings` | `(new_settings, state)` | `Result<(), String>` | `main.rs:747` |
| `get_app_info` | `()` | `Result<HashMap<String, String>, String>` | `main.rs:797` |

#### Coding Agent

| Command | Args | Return | Source |
|---------|------|--------|--------|
| `execute_voice_coding_command` | — | — | `coding_agent.rs` |
| `undo_voice_coding_command` | — | — | `coding_agent.rs` |
| `parse_coding_command` | — | — | `coding_agent.rs` |
| `execute_coding_command` | — | — | `coding_agent.rs` |
| `update_code_context` | — | — | `coding_agent.rs` |
| `get_code_context` | — | — | `coding_agent.rs` |
| `undo_coding_command` | — | — | `coding_agent.rs` |
| `get_coding_command_history` | — | — | `coding_agent.rs` |

---

## Supabase Real-Time Events

| ID | Channel | Event | Payload |
|----|---------|-------|---------|
| EVT-RT-SESSION | `real_time_sessions` | INSERT/UPDATE | Session row |
| EVT-RT-TRANSCRIPT | `streaming_transcripts` | INSERT | Transcript chunk |
| EVT-RT-SUGGESTION | `live_suggestions` | INSERT | Suggestion row |

## Stripe Webhook Events

| ID | Event | Handler |
|----|-------|---------|
| EVT-STRIPE-CHECKOUT | `checkout.session.completed` | `stripe-webhook/` |
| EVT-STRIPE-INVOICE | `invoice.payment_succeeded` | `stripe-webhook/` |
| EVT-STRIPE-CANCEL | `customer.subscription.deleted` | `stripe-webhook/` |

---

*All Tauri events and commands verified against source code in `src-tauri/src/` as of 2026-02-27.*
