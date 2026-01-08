-- Create live_suggestions table for AI suggestions
-- Phase 3 Week 10 Day 66-67: Real-Time AI Processing

CREATE TABLE IF NOT EXISTS public.live_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.real_time_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('correction', 'completion', 'clarification', 'formatting')),
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL DEFAULT 0,
  timestamp BIGINT NOT NULL, -- Milliseconds since session start
  is_applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can read suggestions from their own sessions
CREATE POLICY "Users can read own live suggestions"
  ON public.live_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = live_suggestions.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own live suggestions"
  ON public.live_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = live_suggestions.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own live suggestions"
  ON public.live_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = live_suggestions.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own live suggestions"
  ON public.live_suggestions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = live_suggestions.session_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_live_suggestions_session_id ON public.live_suggestions(session_id);
CREATE INDEX IF NOT EXISTS idx_live_suggestions_type ON public.live_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_live_suggestions_is_applied ON public.live_suggestions(is_applied);
CREATE INDEX IF NOT EXISTS idx_live_suggestions_timestamp ON public.live_suggestions(timestamp);
CREATE INDEX IF NOT EXISTS idx_live_suggestions_created_at ON public.live_suggestions(created_at DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_live_suggestions_original_text_fts ON public.live_suggestions 
  USING GIN (to_tsvector('english', original_text));

CREATE INDEX IF NOT EXISTS idx_live_suggestions_suggested_text_fts ON public.live_suggestions 
  USING GIN (to_tsvector('english', suggested_text));

-- Comment
COMMENT ON TABLE public.live_suggestions IS 'AI-generated suggestions for real-time transcription improvement';

