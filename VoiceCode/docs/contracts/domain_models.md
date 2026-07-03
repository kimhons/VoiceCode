# VoiceCode — Domain Model Contracts

> Version: 2.0.0 | Updated: 2026-02-27 | Source: `supabase/migrations/`

---

## Supabase Tables

### DM-PROFILE: `profiles`
**Migration:** `20240101000000_create_profiles.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | Supabase auth user ID |
| email | TEXT | | User email (no NOT NULL, no UNIQUE) |
| full_name | TEXT | | Display name |
| avatar_url | TEXT | | Profile image URL |
| subscription_tier | TEXT | DEFAULT 'free', CHECK IN (free, pro, enterprise) | |
| subscription_status | TEXT | DEFAULT 'active', CHECK IN (active, canceled, past_due, trialing) | |
| stripe_customer_id | TEXT | UNIQUE | Stripe customer reference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated via trigger |

**RLS Policies:**
- SELECT: `auth.uid() = id`
- UPDATE: `auth.uid() = id` (USING + WITH CHECK)

**Indexes:**
- `idx_profiles_stripe_customer_id` ON (stripe_customer_id)

**Triggers:**
- `on_auth_user_created` — calls `handle_new_user()` to auto-insert profile on signup
- `profiles_updated_at` — calls `update_updated_at()` before UPDATE

---

### DM-SUBSCRIPTION: `subscriptions`
**Migration:** `20240101000001_create_subscriptions.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| stripe_subscription_id | TEXT | UNIQUE, NOT NULL | Stripe subscription reference |
| stripe_customer_id | TEXT | NOT NULL | Stripe customer reference |
| stripe_price_id | TEXT | NOT NULL | Stripe price reference |
| status | TEXT | NOT NULL, CHECK IN (active, canceled, incomplete, incomplete_expired, past_due, trialing, unpaid, paused) | 8 valid statuses |
| quantity | INTEGER | DEFAULT 1 | |
| cancel_at_period_end | BOOLEAN | DEFAULT FALSE | |
| cancel_at | TIMESTAMPTZ | | Scheduled cancellation time |
| canceled_at | TIMESTAMPTZ | | When cancellation was requested |
| current_period_start | TIMESTAMPTZ | NOT NULL | Billing period start |
| current_period_end | TIMESTAMPTZ | NOT NULL | Billing period end |
| trial_start | TIMESTAMPTZ | | |
| trial_end | TIMESTAMPTZ | | |
| ended_at | TIMESTAMPTZ | | When subscription ended |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated via trigger |

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- ALL (service role): `auth.jwt()->>'role' = 'service_role'`

**Indexes:**
- `idx_subscriptions_user_id` ON (user_id)
- `idx_subscriptions_stripe_customer_id` ON (stripe_customer_id)
- `idx_subscriptions_status` ON (status)

**Triggers:**
- `subscriptions_updated_at` — calls `update_updated_at()` before UPDATE

---

### DM-PAYMENT: `payments`
**Migration:** `20240101000002_create_payments.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| stripe_payment_intent_id | TEXT | UNIQUE | Stripe PaymentIntent reference |
| stripe_invoice_id | TEXT | UNIQUE | Stripe Invoice reference |
| stripe_customer_id | TEXT | NOT NULL | |
| subscription_id | UUID | FK → subscriptions(id) ON DELETE SET NULL | |
| amount | INTEGER | NOT NULL | Amount in cents |
| currency | TEXT | NOT NULL, DEFAULT 'usd' | |
| status | TEXT | NOT NULL, CHECK IN (succeeded, pending, failed, canceled, refunded, partially_refunded) | 6 valid statuses |
| payment_method_type | TEXT | | card, bank_transfer, etc. |
| payment_method_last4 | TEXT | | Last 4 digits |
| payment_method_brand | TEXT | | visa, mastercard, etc. |
| description | TEXT | | |
| receipt_url | TEXT | | Stripe receipt URL |
| invoice_pdf | TEXT | | Invoice PDF URL |
| refund_amount | INTEGER | DEFAULT 0 | Refund amount in cents |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- ALL (service role): `auth.jwt()->>'role' = 'service_role'`

**Indexes:**
- `idx_payments_user_id` ON (user_id)
- `idx_payments_stripe_customer_id` ON (stripe_customer_id)
- `idx_payments_created_at` ON (created_at DESC)
- `idx_payments_subscription_id` ON (subscription_id)

---

### DM-TRANSCRIPT: `transcripts`
**Migration:** `20240101000003_create_transcripts.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| title | TEXT | NOT NULL | User-assigned title |
| content | TEXT | NOT NULL, DEFAULT '' | Transcribed text |
| language | TEXT | NOT NULL, DEFAULT 'en' | |
| professional_mode | TEXT | DEFAULT 'general' | |
| duration | INTEGER | DEFAULT 0 | Duration in seconds |
| word_count | INTEGER | DEFAULT 0 | |
| confidence | REAL | DEFAULT 0 | |
| audio_url | TEXT | | |
| metadata | JSONB | DEFAULT '{}' | |
| tags | TEXT[] | DEFAULT '{}' | |
| is_favorite | BOOLEAN | DEFAULT FALSE | |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| deleted_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated via trigger |

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id` (USING + WITH CHECK)
- DELETE: `auth.uid() = user_id`

**Indexes:**
- `idx_transcripts_user_id` ON (user_id)
- `idx_transcripts_created_at` ON (created_at DESC)
- `idx_transcripts_is_deleted` ON (is_deleted)
- `idx_transcripts_language` ON (language)
- `idx_transcripts_content_fts` ON to_tsvector('english', content) USING GIN

**Triggers:**
- `transcripts_updated_at` — calls `update_updated_at()` before UPDATE

---

### DM-PUSH-SUB: `push_subscriptions`
**Migration:** `20240101000004_create_push_subscriptions.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| endpoint | TEXT | NOT NULL | Push endpoint URL |
| p256dh | TEXT | NOT NULL | ECDH public key |
| auth | TEXT | NOT NULL | Auth secret |
| platform | TEXT | NOT NULL, DEFAULT 'web', CHECK IN (web, ios, android) | |
| device_name | TEXT | | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| last_used_at | TIMESTAMPTZ | DEFAULT NOW() | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id` (USING + WITH CHECK)
- DELETE: `auth.uid() = user_id`
- ALL (service role): `auth.jwt()->>'role' = 'service_role'`

**Indexes:**
- `idx_push_subscriptions_user_id` ON (user_id)
- `idx_push_subscriptions_endpoint` ON (endpoint)
- `idx_push_subscriptions_is_active` ON (is_active)
- `idx_push_subscriptions_user_endpoint` UNIQUE ON (user_id, endpoint)

---

### DM-SESSION: `real_time_sessions`
**Migration:** `20240101000006_create_real_time_sessions.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| status | TEXT | NOT NULL, DEFAULT 'idle', CHECK IN (idle, connecting, active, paused, ended, error) | 6 valid statuses |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | |
| ended_at | TIMESTAMPTZ | | |
| total_duration | INTEGER | DEFAULT 0 | Duration in seconds |
| audio_chunks_processed | INTEGER | DEFAULT 0 | |
| transcription_accuracy | REAL | DEFAULT 0 | |
| suggestions_count | INTEGER | DEFAULT 0 | |
| action_items_count | INTEGER | DEFAULT 0 | |
| config | JSONB | DEFAULT '{}' | Session configuration |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated via trigger |

**RLS Policies:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id` (USING + WITH CHECK)
- DELETE: `auth.uid() = user_id`

**Indexes:**
- `idx_real_time_sessions_user_id` ON (user_id)
- `idx_real_time_sessions_status` ON (status)
- `idx_real_time_sessions_started_at` ON (started_at DESC)
- `idx_real_time_sessions_created_at` ON (created_at DESC)

**Triggers:**
- `real_time_sessions_updated_at` — calls `update_updated_at()` before UPDATE

---

### DM-STREAMING: `streaming_transcripts`
**Migration:** `20240101000007_create_streaming_transcripts.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| session_id | UUID | NOT NULL, FK → real_time_sessions(id) ON DELETE CASCADE | |
| text | TEXT | NOT NULL | Transcript segment |
| is_final | BOOLEAN | DEFAULT FALSE | |
| confidence | REAL | DEFAULT 0 | |
| timestamp | BIGINT | NOT NULL | Milliseconds since session start |
| speaker_id | TEXT | | |
| language | TEXT | NOT NULL, DEFAULT 'en' | |
| alternatives | TEXT[] | DEFAULT '{}' | |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**RLS Policies (JOIN-based — checks session ownership):**
- SELECT: `EXISTS (SELECT 1 FROM real_time_sessions WHERE id = session_id AND user_id = auth.uid())`
- INSERT: same join check via WITH CHECK
- UPDATE: same join check (USING + WITH CHECK)
- DELETE: same join check

**Indexes:**
- `idx_streaming_transcripts_session_id` ON (session_id)
- `idx_streaming_transcripts_timestamp` ON (timestamp)
- `idx_streaming_transcripts_is_final` ON (is_final)
- `idx_streaming_transcripts_created_at` ON (created_at DESC)
- `idx_streaming_transcripts_text_fts` ON to_tsvector('english', text) USING GIN

---

### DM-SUGGESTION: `live_suggestions`
**Migration:** `20240101000008_create_live_suggestions.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| session_id | UUID | NOT NULL, FK → real_time_sessions(id) ON DELETE CASCADE | |
| type | TEXT | NOT NULL, CHECK IN (correction, completion, clarification, formatting) | |
| original_text | TEXT | NOT NULL | |
| suggested_text | TEXT | NOT NULL | |
| reason | TEXT | NOT NULL | Why the suggestion was made |
| confidence | REAL | DEFAULT 0 | |
| timestamp | BIGINT | NOT NULL | Milliseconds since session start |
| is_applied | BOOLEAN | DEFAULT FALSE | |
| applied_at | TIMESTAMPTZ | | When user accepted suggestion |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**RLS Policies (JOIN-based — checks session ownership):**
- SELECT: `EXISTS (SELECT 1 FROM real_time_sessions WHERE id = session_id AND user_id = auth.uid())`
- INSERT: same join check via WITH CHECK
- UPDATE: same join check (USING + WITH CHECK)
- DELETE: same join check

**Indexes:**
- `idx_live_suggestions_session_id` ON (session_id)
- `idx_live_suggestions_type` ON (type)
- `idx_live_suggestions_is_applied` ON (is_applied)
- `idx_live_suggestions_timestamp` ON (timestamp)
- `idx_live_suggestions_created_at` ON (created_at DESC)
- `idx_live_suggestions_original_text_fts` ON to_tsvector('english', original_text) USING GIN
- `idx_live_suggestions_suggested_text_fts` ON to_tsvector('english', suggested_text) USING GIN

---

### DM-ACTION-ITEM: `action_items`
**Migration:** `20240101000009_create_action_items.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| session_id | UUID | NOT NULL, FK → real_time_sessions(id) ON DELETE CASCADE | |
| text | TEXT | NOT NULL | Action item description |
| priority | TEXT | NOT NULL, DEFAULT 'medium', CHECK IN (low, medium, high) | |
| assignee | TEXT | | |
| due_date | TIMESTAMPTZ | | |
| context | TEXT | | Surrounding context text |
| timestamp | BIGINT | NOT NULL | Milliseconds since session start |
| is_confirmed | BOOLEAN | DEFAULT FALSE | |
| confirmed_at | TIMESTAMPTZ | | |
| is_completed | BOOLEAN | DEFAULT FALSE | |
| completed_at | TIMESTAMPTZ | | |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated via trigger |

**RLS Policies (JOIN-based — checks session ownership):**
- SELECT: `EXISTS (SELECT 1 FROM real_time_sessions WHERE id = session_id AND user_id = auth.uid())`
- INSERT: same join check via WITH CHECK
- UPDATE: same join check (USING + WITH CHECK)
- DELETE: same join check

**Indexes:**
- `idx_action_items_session_id` ON (session_id)
- `idx_action_items_priority` ON (priority)
- `idx_action_items_is_confirmed` ON (is_confirmed)
- `idx_action_items_is_completed` ON (is_completed)
- `idx_action_items_due_date` ON (due_date)
- `idx_action_items_timestamp` ON (timestamp)
- `idx_action_items_created_at` ON (created_at DESC)
- `idx_action_items_text_fts` ON to_tsvector('english', text) USING GIN

**Triggers:**
- `action_items_updated_at` — calls `update_updated_at()` before UPDATE

---

### DM-INSIGHT: `contextual_insights`
**Migration:** `20240101000010_create_contextual_insights.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| session_id | UUID | NOT NULL, FK → real_time_sessions(id) ON DELETE CASCADE | |
| type | TEXT | NOT NULL, CHECK IN (summary, key_point, question, decision, risk) | |
| title | TEXT | NOT NULL | |
| description | TEXT | NOT NULL | |
| related_text | TEXT | NOT NULL | Source text that triggered the insight |
| relevance | REAL | DEFAULT 0 | |
| timestamp | BIGINT | NOT NULL | Milliseconds since session start |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**RLS Policies (JOIN-based — checks session ownership):**
- SELECT: `EXISTS (SELECT 1 FROM real_time_sessions WHERE id = session_id AND user_id = auth.uid())`
- INSERT: same join check via WITH CHECK
- UPDATE: same join check (USING + WITH CHECK)
- DELETE: same join check

**Indexes:**
- `idx_contextual_insights_session_id` ON (session_id)
- `idx_contextual_insights_type` ON (type)
- `idx_contextual_insights_relevance` ON (relevance DESC)
- `idx_contextual_insights_timestamp` ON (timestamp)
- `idx_contextual_insights_created_at` ON (created_at DESC)
- `idx_contextual_insights_title_fts` ON to_tsvector('english', title) USING GIN
- `idx_contextual_insights_description_fts` ON to_tsvector('english', description) USING GIN

---

### DM-CONTEXT-ANALYSIS: `context_analyses`
**Migration:** `20240101000011_create_context_analyses.sql`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| session_id | UUID | FK → real_time_sessions(id) ON DELETE CASCADE | Nullable (standalone analyses allowed) |
| text | TEXT | NOT NULL | Input text analyzed |
| topics | JSONB | DEFAULT '[]' | Array of Topic objects |
| sentiment | JSONB | DEFAULT '{}' | SentimentAnalysis object |
| entities | JSONB | DEFAULT '[]' | Array of Entity objects |
| relationships | JSONB | DEFAULT '[]' | Array of Relationship objects |
| intents | JSONB | DEFAULT '[]' | Array of Intent objects |
| summary | TEXT | | Generated summary |
| confidence | REAL | DEFAULT 0 | |
| analyzed_at | TIMESTAMPTZ | DEFAULT NOW() | |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**RLS Policies (JOIN-based with NULL session_id fallback):**
- SELECT: `session_id IS NULL OR EXISTS (SELECT 1 FROM real_time_sessions WHERE id = session_id AND user_id = auth.uid())`
- INSERT: same check via WITH CHECK
- UPDATE: same check (USING + WITH CHECK)
- DELETE: same check

**Indexes:**
- `idx_context_analyses_session_id` ON (session_id)
- `idx_context_analyses_analyzed_at` ON (analyzed_at DESC)
- `idx_context_analyses_created_at` ON (created_at DESC)
- `idx_context_analyses_topics` ON (topics) USING GIN
- `idx_context_analyses_entities` ON (entities) USING GIN
- `idx_context_analyses_sentiment` ON (sentiment) USING GIN
- `idx_context_analyses_text_fts` ON to_tsvector('english', text) USING GIN
- `idx_context_analyses_summary_fts` ON to_tsvector('english', summary) USING GIN

---

## Database Functions
**Migration:** `20240101000005_create_analytics_functions.sql`

### `get_recordings_by_day(p_user_id UUID, p_days INTEGER DEFAULT 30)`
Returns daily transcript aggregates for a user over the last N days.

| Return Column | Type | Notes |
|---------------|------|-------|
| date | DATE | Day of recording |
| count | BIGINT | Number of transcripts |
| total_duration | BIGINT | Sum of duration (seconds) |
| avg_confidence | REAL | Average confidence score |

Filters: `is_deleted = FALSE`. Security: `SECURITY DEFINER`. Granted to `authenticated`.

### `get_language_distribution(p_user_id UUID)`
Returns language breakdown of a user's transcripts.

| Return Column | Type | Notes |
|---------------|------|-------|
| language | TEXT | Language code |
| count | BIGINT | Number of transcripts |
| percentage | REAL | Percentage of total |

Filters: `is_deleted = FALSE`. Security: `SECURITY DEFINER`. Granted to `authenticated`.

### `get_usage_stats(p_user_id UUID)`
Returns overall usage statistics for a user.

| Return Column | Type | Notes |
|---------------|------|-------|
| total_transcripts | BIGINT | All-time count |
| total_duration | BIGINT | All-time duration (seconds) |
| total_words | BIGINT | All-time word count |
| avg_confidence | REAL | All-time average confidence |
| transcripts_this_month | BIGINT | Current month count |
| duration_this_month | BIGINT | Current month duration |

Filters: `is_deleted = FALSE`. Security: `SECURITY DEFINER`. Granted to `authenticated`.

---

## Shared Utilities
**Migration:** `20240101000000_create_profiles.sql`

### `update_updated_at()` trigger function
Auto-sets `updated_at = NOW()` before UPDATE. Used by: profiles, subscriptions, transcripts, real_time_sessions, action_items.

### `handle_new_user()` trigger function
Auto-inserts a profile row when a new `auth.users` row is created. Copies `id`, `email`, `full_name`, `avatar_url` from auth metadata. Security: `SECURITY DEFINER`.

---

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

*All Supabase models derived from migration files in `supabase/migrations/`. Runtime models from Rust source.*