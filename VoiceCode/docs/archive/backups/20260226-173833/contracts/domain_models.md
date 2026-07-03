# VoiceCode — Domain Model Contracts

> Version: 1.0.0 | Generated: 2026-02-26 | Blueprint Forge OS™

---

## Supabase Tables

### DM-PROFILE — `profiles`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | uuid | PK, FK → auth.users | Supabase auth user ID |
| email | text | NOT NULL, UNIQUE | User email |
| full_name | text | | Display name |
| avatar_url | text | | Profile image URL |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |
**RLS:** Users can only read/update own profile. `REQ-DB-0001`

### DM-SUBSCRIPTION — `subscriptions`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | uuid | PK | |
| user_id | uuid | FK → profiles | |
| stripe_subscription_id | text | UNIQUE | Stripe reference |
| plan | text | NOT NULL | free, pro, enterprise |
| status | text | NOT NULL | active, canceled, past_due |
| current_period_end | timestamptz | | Billing period end |
| created_at | timestamptz | DEFAULT now() | |
**RLS:** Users can only read own subscription. `REQ-DB-0002`

### DM-PAYMENT — `payments`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | uuid | PK | |
| user_id | uuid | FK → profiles | |
| stripe_payment_id | text | UNIQUE | Stripe reference |
| amount | integer | NOT NULL | Amount in cents |
| currency | text | DEFAULT 'usd' | |
| status | text | NOT NULL | succeeded, failed, pending |
| created_at | timestamptz | DEFAULT now() | |
**RLS:** Users can only read own payments. `REQ-PAY-0001`

### DM-TRANSCRIPT — `transcripts`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | uuid | PK | |
| user_id | uuid | FK → profiles | |
| title | text | | User-assigned title |
| content | text | NOT NULL | Transcribed text |
| language | text | DEFAULT 'en' | |
| duration_ms | integer | | Audio duration |
| created_at | timestamptz | DEFAULT now() | |
**RLS:** Users can only CRUD own transcripts. `REQ-DB-0003`

### DM-SESSION — `real_time_sessions`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | uuid | PK | |
| user_id | uuid | FK → profiles | |
| status | text | NOT NULL | active, ended |
| started_at | timestamptz | DEFAULT now() | |
| ended_at | timestamptz | | |
**Retention:** 30 days. `REQ-DB-0003`

### DM-PUSH-SUB — `push_subscriptions`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | uuid | PK | |
| user_id | uuid | FK → profiles | |
| endpoint | text | NOT NULL | Push endpoint URL |
| keys | jsonb | NOT NULL | Encryption keys |
| created_at | timestamptz | DEFAULT now() | |
**RLS:** Users can only manage own subscriptions. `REQ-NOTIF-0001`

## Runtime Models (Rust — In-Memory)

### DM-VOICE-CMD — VoiceCommand
```rust
struct VoiceCommand {
    intent: IntentType,        // 13 categories
    raw_text: String,
    confidence: f64,
    context: ScreenContext,
    timestamp: DateTime<Utc>,
}
```
**Scope:** Session-scoped, not persisted. `REQ-CODE-0003`

### DM-AGENT-RESULT — AgentResult
```rust
struct AgentResult {
    task_id: Uuid,
    strategy: OrchestrationType,
    responses: Vec<AgentResponse>,
    validation: ValidationResult,
    timestamp: DateTime<Utc>,
}
```
**Scope:** Session-scoped, not persisted. `REQ-AGENT-0001`

---

*All models derived from Supabase migration files and Rust source code.*
