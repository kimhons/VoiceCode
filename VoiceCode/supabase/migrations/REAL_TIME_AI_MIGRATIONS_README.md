# Real-Time AI Processing Database Migrations

**Phase 3 Week 10 Day 66-67: Real-Time AI Processing**  
**Date:** 2026-01-07  
**Status:** ✅ COMPLETE

---

## 📊 OVERVIEW

This directory contains 6 database migration files for the Real-Time AI Processing feature, creating tables for WebSocket-based streaming, NLP context analysis, and AI-powered insights.

---

## 📁 MIGRATION FILES

### 1. **20240101000006_create_real_time_sessions.sql**
**Purpose:** Real-time AI session management with WebSocket streaming

**Table:** `real_time_sessions`

**Columns:**
- `id` (UUID, PK) - Unique session identifier
- `user_id` (UUID, FK) - References auth.users
- `status` (TEXT) - Session status: idle, connecting, active, paused, ended, error
- `started_at` (TIMESTAMP) - Session start time
- `ended_at` (TIMESTAMP) - Session end time
- `total_duration` (INTEGER) - Duration in seconds
- `audio_chunks_processed` (INTEGER) - Number of audio chunks processed
- `transcription_accuracy` (REAL) - Average transcription accuracy
- `suggestions_count` (INTEGER) - Number of suggestions generated
- `action_items_count` (INTEGER) - Number of action items detected
- `config` (JSONB) - Session configuration
- `metadata` (JSONB) - Additional metadata
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_real_time_sessions_user_id`
- `idx_real_time_sessions_status`
- `idx_real_time_sessions_started_at`
- `idx_real_time_sessions_created_at`

**RLS Policies:** Users can CRUD their own sessions

---

### 2. **20240101000007_create_streaming_transcripts.sql**
**Purpose:** Real-time streaming transcription with confidence scores

**Table:** `streaming_transcripts`

**Columns:**
- `id` (UUID, PK) - Unique transcript identifier
- `session_id` (UUID, FK) - References real_time_sessions
- `text` (TEXT) - Transcribed text
- `is_final` (BOOLEAN) - Whether transcript is final or tentative
- `confidence` (REAL) - Confidence score (0-1)
- `timestamp` (BIGINT) - Milliseconds since session start
- `speaker_id` (TEXT) - Speaker identifier
- `language` (TEXT) - Language code
- `alternatives` (TEXT[]) - Alternative transcriptions
- `metadata` (JSONB) - Additional metadata
- `created_at` (TIMESTAMP)

**Indexes:**
- `idx_streaming_transcripts_session_id`
- `idx_streaming_transcripts_timestamp`
- `idx_streaming_transcripts_is_final`
- `idx_streaming_transcripts_created_at`
- `idx_streaming_transcripts_text_fts` (Full-text search)

**RLS Policies:** Users can CRUD transcripts from their own sessions

---

### 3. **20240101000008_create_live_suggestions.sql**
**Purpose:** AI-generated suggestions for real-time transcription improvement

**Table:** `live_suggestions`

**Columns:**
- `id` (UUID, PK) - Unique suggestion identifier
- `session_id` (UUID, FK) - References real_time_sessions
- `type` (TEXT) - Suggestion type: correction, completion, clarification, formatting
- `original_text` (TEXT) - Original text
- `suggested_text` (TEXT) - Suggested replacement
- `reason` (TEXT) - Explanation for suggestion
- `confidence` (REAL) - Confidence score (0-1)
- `timestamp` (BIGINT) - Milliseconds since session start
- `is_applied` (BOOLEAN) - Whether suggestion was applied
- `applied_at` (TIMESTAMP) - When suggestion was applied
- `metadata` (JSONB) - Additional metadata
- `created_at` (TIMESTAMP)

**Indexes:**
- `idx_live_suggestions_session_id`
- `idx_live_suggestions_type`
- `idx_live_suggestions_is_applied`
- `idx_live_suggestions_timestamp`
- `idx_live_suggestions_created_at`
- `idx_live_suggestions_original_text_fts` (Full-text search)
- `idx_live_suggestions_suggested_text_fts` (Full-text search)

**RLS Policies:** Users can CRUD suggestions from their own sessions

---

### 4. **20240101000009_create_action_items.sql**
**Purpose:** AI-detected action items from real-time sessions

**Table:** `action_items`

**Columns:**
- `id` (UUID, PK) - Unique action item identifier
- `session_id` (UUID, FK) - References real_time_sessions
- `text` (TEXT) - Action item description
- `priority` (TEXT) - Priority: low, medium, high
- `assignee` (TEXT) - Person assigned to action
- `due_date` (TIMESTAMP) - Due date
- `context` (TEXT) - Context from conversation
- `timestamp` (BIGINT) - Milliseconds since session start
- `is_confirmed` (BOOLEAN) - Whether action was confirmed
- `confirmed_at` (TIMESTAMP) - When action was confirmed
- `is_completed` (BOOLEAN) - Whether action is completed
- `completed_at` (TIMESTAMP) - When action was completed
- `metadata` (JSONB) - Additional metadata
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_action_items_session_id`
- `idx_action_items_priority`
- `idx_action_items_is_confirmed`
- `idx_action_items_is_completed`
- `idx_action_items_due_date`
- `idx_action_items_timestamp`
- `idx_action_items_created_at`
- `idx_action_items_text_fts` (Full-text search)

**RLS Policies:** Users can CRUD action items from their own sessions

---

### 5. **20240101000010_create_contextual_insights.sql**
**Purpose:** AI-generated contextual insights from real-time sessions

**Table:** `contextual_insights`

**Columns:**
- `id` (UUID, PK) - Unique insight identifier
- `session_id` (UUID, FK) - References real_time_sessions
- `type` (TEXT) - Insight type: summary, key_point, question, decision, risk
- `title` (TEXT) - Insight title
- `description` (TEXT) - Detailed description
- `related_text` (TEXT) - Related text from conversation
- `relevance` (REAL) - Relevance score (0-1)
- `timestamp` (BIGINT) - Milliseconds since session start
- `metadata` (JSONB) - Additional metadata
- `created_at` (TIMESTAMP)

**Indexes:**
- `idx_contextual_insights_session_id`
- `idx_contextual_insights_type`
- `idx_contextual_insights_relevance`
- `idx_contextual_insights_timestamp`
- `idx_contextual_insights_created_at`
- `idx_contextual_insights_title_fts` (Full-text search)
- `idx_contextual_insights_description_fts` (Full-text search)

**RLS Policies:** Users can CRUD insights from their own sessions

---

### 6. **20240101000011_create_context_analyses.sql**
**Purpose:** NLP-based context analysis with topics, sentiment, entities, and relationships

**Table:** `context_analyses`

**Columns:**
- `id` (UUID, PK) - Unique analysis identifier
- `session_id` (UUID, FK, nullable) - References real_time_sessions (optional for standalone analyses)
- `text` (TEXT) - Analyzed text
- `topics` (JSONB) - Array of detected topics
- `sentiment` (JSONB) - Sentiment analysis results
- `entities` (JSONB) - Array of named entities
- `relationships` (JSONB) - Array of entity relationships
- `intents` (JSONB) - Array of detected intents
- `summary` (TEXT) - Context summary
- `confidence` (REAL) - Overall confidence score
- `analyzed_at` (TIMESTAMP) - Analysis timestamp
- `metadata` (JSONB) - Additional metadata
- `created_at` (TIMESTAMP)

**Indexes:**
- `idx_context_analyses_session_id`
- `idx_context_analyses_analyzed_at`
- `idx_context_analyses_created_at`
- `idx_context_analyses_topics` (JSONB GIN index)
- `idx_context_analyses_entities` (JSONB GIN index)
- `idx_context_analyses_sentiment` (JSONB GIN index)
- `idx_context_analyses_text_fts` (Full-text search)
- `idx_context_analyses_summary_fts` (Full-text search)

**RLS Policies:** Users can CRUD analyses from their own sessions or standalone analyses

---

## 🔐 SECURITY

All tables implement **Row Level Security (RLS)** with policies ensuring:
- Users can only access data from their own sessions
- Foreign key constraints maintain referential integrity
- Cascade deletes ensure data cleanup when sessions are deleted

---

## 📈 PERFORMANCE

**Optimizations:**
- Indexes on frequently queried columns (user_id, session_id, status, timestamps)
- Full-text search indexes on text columns for efficient searching
- JSONB GIN indexes for efficient querying of structured data
- Composite indexes for common query patterns

---

## 🚀 DEPLOYMENT

### Apply Migrations:
```bash
# Using Supabase CLI
supabase db push

# Or apply individually
psql -h <host> -U <user> -d <database> -f 20240101000006_create_real_time_sessions.sql
psql -h <host> -U <user> -d <database> -f 20240101000007_create_streaming_transcripts.sql
psql -h <host> -U <user> -d <database> -f 20240101000008_create_live_suggestions.sql
psql -h <host> -U <user> -d <database> -f 20240101000009_create_action_items.sql
psql -h <host> -U <user> -d <database> -f 20240101000010_create_contextual_insights.sql
psql -h <host> -U <user> -d <database> -f 20240101000011_create_context_analyses.sql
```

### Verify Migrations:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'real_time_sessions',
  'streaming_transcripts',
  'live_suggestions',
  'action_items',
  'contextual_insights',
  'context_analyses'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'real_time_sessions',
  'streaming_transcripts',
  'live_suggestions',
  'action_items',
  'contextual_insights',
  'context_analyses'
);
```

---

## 📊 DATABASE SCHEMA DIAGRAM

```
┌─────────────────────────┐
│  real_time_sessions     │
│  ─────────────────────  │
│  id (PK)                │
│  user_id (FK)           │
│  status                 │
│  started_at             │
│  ended_at               │
│  total_duration         │
│  ...                    │
└────────┬────────────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  streaming_transcripts  │    │  live_suggestions       │
│  ─────────────────────  │    │  ─────────────────────  │
│  id (PK)                │    │  id (PK)                │
│  session_id (FK)        │    │  session_id (FK)        │
│  text                   │    │  type                   │
│  is_final               │    │  original_text          │
│  confidence             │    │  suggested_text         │
│  timestamp              │    │  reason                 │
│  ...                    │    │  is_applied             │
└─────────────────────────┘    └─────────────────────────┘

         │                                  │
         ▼                                  ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  action_items           │    │  contextual_insights    │
│  ─────────────────────  │    │  ─────────────────────  │
│  id (PK)                │    │  id (PK)                │
│  session_id (FK)        │    │  session_id (FK)        │
│  text                   │    │  type                   │
│  priority               │    │  title                  │
│  assignee               │    │  description            │
│  is_confirmed           │    │  relevance              │
│  is_completed           │    │  timestamp              │
│  ...                    │    │  ...                    │
└─────────────────────────┘    └─────────────────────────┘

         │
         ▼
┌─────────────────────────┐
│  context_analyses       │
│  ─────────────────────  │
│  id (PK)                │
│  session_id (FK)        │
│  text                   │
│  topics (JSONB)         │
│  sentiment (JSONB)      │
│  entities (JSONB)       │
│  relationships (JSONB)  │
│  intents (JSONB)        │
│  summary                │
│  ...                    │
└─────────────────────────┘
```

---

**Status:** ✅ READY FOR DEPLOYMENT

