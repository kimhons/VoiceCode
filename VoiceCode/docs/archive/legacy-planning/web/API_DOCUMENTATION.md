# VoiceFlow PRO - API Documentation

## Overview

VoiceFlow PRO integrates with multiple APIs for AI/ML capabilities, authentication, and data storage.

---

## AIML API Integration

### Base Configuration

```typescript
Base URL: https://api.aimlapi.com/v1
WebSocket: wss://api.aimlapi.com/v1/realtime
Authentication: Bearer token (API Key)
Rate Limit: 60 requests/minute
```

### Available Models

#### Speech-to-Text (STT)

**Deepgram Nova-2 Models:**

| Model | Use Case | Language Support |
|-------|----------|------------------|
| `nova-2-general` | General transcription | 30+ languages |
| `nova-2-medical` | Medical consultations | English |
| `nova-2-meeting` | Business meetings | English |

**Request Format:**

```typescript
POST /audio/transcriptions
Content-Type: audio/wav or audio/mp3

Headers:
  Authorization: Bearer YOUR_API_KEY
  Content-Type: audio/wav

Body: Binary audio data (PCM 16-bit, 16kHz)

Response:
{
  "text": "Transcribed text content",
  "confidence": 0.95,
  "words": [
    { "word": "hello", "start": 0.0, "end": 0.5, "confidence": 0.98 }
  ]
}
```

#### Chat Completion

**Available Models:**

- `gpt-5` - OpenAI GPT-5 (latest)
- `claude-4.5-sonnet` - Anthropic Claude 4.5
- `gemini-2.5-flash` - Google Gemini 2.5

**Request Format:**

```typescript
POST /chat/completions

{
  "model": "gpt-5",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}

Response:
{
  "id": "chatcmpl-123",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  }
}
```

#### WebSocket Real-Time Streaming

**Connection:**

```typescript
const ws = new WebSocket('wss://api.aimlapi.com/v1/realtime');

// On connection
ws.send(JSON.stringify({
  type: 'configure',
  config: {
    model: 'nova-2-general',
    language: 'en',
    sample_rate: 16000,
    encoding: 'pcm_s16le'
  }
}));

// Send audio chunks
ws.send(audioChunk); // ArrayBuffer

// Receive transcriptions
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { type: 'transcript', text: '...', is_final: true }
};
```

---

## Supabase API Integration

### Authentication

**Sign Up:**

```typescript
POST /auth/v1/signup

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "data": {
    "full_name": "John Doe"
  }
}

Response:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Sign In:**

```typescript
POST /auth/v1/token?grant_type=password

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**OAuth Sign In:**

```typescript
POST /auth/v1/authorize

{
  "provider": "google" | "github" | "microsoft",
  "redirect_to": "https://yourapp.com/auth/callback"
}

// Redirects to provider OAuth flow
// Returns to redirect_to with session tokens
```

### Database Operations

**Table: user_profiles**

```typescript
// Get user profile
GET /rest/v1/user_profiles?id=eq.{userId}

// Update user profile
PATCH /rest/v1/user_profiles?id=eq.{userId}
{
  "settings": { "theme": "dark" },
  "usage_stats": { "total_transcriptions": 42 }
}
```

**Table: transcripts**

```typescript
// Create transcript
POST /rest/v1/transcripts
{
  "user_id": "uuid",
  "title": "Meeting Notes",
  "content": "Transcript content...",
  "language": "en",
  "professional_mode": "business",
  "duration": 300.5,
  "metadata": {}
}

// List transcripts
GET /rest/v1/transcripts?user_id=eq.{userId}&order=created_at.desc&limit=20

// Update transcript
PATCH /rest/v1/transcripts?id=eq.{transcriptId}
{
  "content": "Updated content",
  "updated_at": "2024-01-15T10:30:00Z"
}

// Soft delete
PATCH /rest/v1/transcripts?id=eq.{transcriptId}
{
  "is_deleted": true,
  "deleted_at": "2024-01-15T10:30:00Z"
}
```

### Storage API

**Upload File:**

```typescript
POST /storage/v1/object/audio-files/{userId}/{fileName}
Content-Type: audio/mp3

Body: Binary audio file

Response:
{
  "Key": "audio-files/{userId}/{fileName}",
  "Id": "uuid"
}
```

**Get Public URL:**

```typescript
GET /storage/v1/object/public/audio-files/{userId}/{fileName}

Returns: Public URL to access the file
```

**Delete File:**

```typescript
DELETE /storage/v1/object/audio-files/{userId}/{fileName}
```

---

## Internal API Reference

### Audio Service

```typescript
class AudioService {
  /**
   * Upload and process audio file
   * @param file - Audio file to upload
   * @param options - Processing options
   * @returns Promise<AudioFile>
   */
  async uploadFile(
    file: File,
    options?: {
      language?: string;
      professionalMode?: string;
      enableDiarization?: boolean;
    }
  ): Promise<AudioFile>

  /**
   * Start real-time audio streaming
   * @param config - Streaming configuration
   * @returns Promise<void>
   */
  async startStreaming(config: StreamingConfig): Promise<void>

  /**
   * Send audio chunk to streaming service
   * @param chunk - Audio data chunk
   */
  sendAudioChunk(chunk: ArrayBuffer): void

  /**
   * Stop streaming and get final transcript
   * @returns Promise<string>
   */
  async stopStreaming(): Promise<string>
}
```

### Data Service

```typescript
class DataService {
  /**
   * Save transcript to database
   * @param transcript - Transcript data
   * @returns Promise<Transcript>
   */
  async saveTranscript(
    transcript: Partial<Transcript>
  ): Promise<Transcript>

  /**
   * Get user transcripts
   * @param userId - User ID
   * @param options - Query options
   * @returns Promise<Transcript[]>
   */
  async getTranscripts(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      filter?: Record<string, any>;
    }
  ): Promise<Transcript[]>

  /**
   * Export transcript to PDF
   * @param transcriptId - Transcript ID
   * @returns Promise<Blob>
   */
  async exportToPDF(transcriptId: string): Promise<Blob>

  /**
   * Sync data to cloud
   * @returns Promise<SyncResult>
   */
  async syncToCloud(): Promise<SyncResult>
}
```

### AI Service

```typescript
class AIService {
  /**
   * Send chat message
   * @param messages - Chat messages
   * @param options - Chat options
   * @returns Promise<string>
   */
  async chat(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string>

  /**
   * Detect potential hallucinations
   * @param text - Text to analyze
   * @returns Promise<HallucinationReport>
   */
  async detectHallucination(
    text: string
  ): Promise<HallucinationReport>

  /**
   * Validate prompt security
   * @param prompt - User prompt
   * @returns Promise<SecurityReport>
   */
  async validatePrompt(
    prompt: string
  ): Promise<SecurityReport>
}
```

### Security Service

```typescript
class SecurityService {
  /**
   * Enable two-factor authentication
   * @param userId - User ID
   * @param method - 2FA method
   * @returns Promise<TwoFactorSetup>
   */
  async enableTwoFactor(
    userId: string,
    method: '2fa_totp' | '2fa_sms' | '2fa_email'
  ): Promise<TwoFactorSetup>

  /**
   * Log security event
   * @param event - Security event
   */
  async logAudit(event: AuditEvent): Promise<void>

  /**
   * Detect PII in text
   * @param text - Text to analyze
   * @returns Promise<PIIDetectionResult>
   */
  async detectPII(text: string): Promise<PIIDetectionResult>
}
```

---

## Error Codes

### AIML API Errors

| Code | Message | Resolution |
|------|---------|-----------|
| 401 | Unauthorized | Check API key |
| 429 | Rate limit exceeded | Wait 60 seconds |
| 500 | Internal server error | Retry with exponential backoff |
| 503 | Service unavailable | Check API status |

### Supabase Errors

| Code | Message | Resolution |
|------|---------|-----------|
| 400 | Bad request | Validate request payload |
| 401 | Unauthorized | Refresh authentication token |
| 403 | Forbidden | Check RLS policies |
| 409 | Conflict | Handle unique constraint violation |
| 500 | Internal server error | Contact support |

### Application Errors

| Code | Message | Cause |
|------|---------|-------|
| AUTH_001 | Authentication failed | Invalid credentials |
| AUTH_002 | Session expired | Token expired |
| UPLOAD_001 | File too large | Exceeds 50MB limit |
| UPLOAD_002 | Unsupported format | Use MP3, WAV, M4A |
| TRANS_001 | Transcription failed | Audio quality issue |
| TRANS_002 | Language not supported | Use supported language |

---

## Rate Limits

### AIML API
- **Requests:** 60/minute
- **Audio duration:** 10 hours/day (free tier)
- **WebSocket connections:** 5 concurrent

### Supabase
- **Database queries:** 500,000/month (free tier)
- **Storage:** 1 GB (free tier)
- **Bandwidth:** 2 GB/month (free tier)

---

## Testing Endpoints

### Health Check

```bash
# AIML API
curl https://api.aimlapi.com/v1/health

# Supabase
curl https://your-project.supabase.co/rest/v1/
```

### Sample Requests

```bash
# Transcribe audio
curl -X POST https://api.aimlapi.com/v1/audio/transcriptions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @audio.wav

# Get transcripts
curl https://your-project.supabase.co/rest/v1/transcripts?user_id=eq.USER_ID \
  -H "apikey: YOUR_SUPABASE_KEY" \
  -H "Authorization: Bearer USER_JWT"
```

---

## Webhook Integration

VoiceFlow PRO can send webhooks for events:

### Available Events

- `transcript.created` - New transcript created
- `transcript.updated` - Transcript modified
- `transcript.deleted` - Transcript deleted
- `user.registered` - New user signed up
- `export.completed` - Export job finished

### Webhook Payload

```typescript
{
  "event": "transcript.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Meeting Notes",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## SDK Usage Examples

### TypeScript

```typescript
import { audioService, dataService } from '@/services';

// Upload and transcribe
const audioFile = await audioService.uploadFile(file, {
  language: 'en',
  professionalMode: 'medical',
});

// Save to database
const transcript = await dataService.saveTranscript({
  content: audioFile.transcript?.content,
  language: 'en',
});

// Export to PDF
const pdf = await dataService.exportToPDF(transcript.id);
```

---

## Additional Resources

- [AIML API Documentation](https://aimlapi.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAPI Specification](./openapi.yaml) (to be created)
- [Postman Collection](./voiceflow-pro.postman.json) (to be created)

---

**Last Updated:** 2025-01-15
**API Version:** 1.0.0
