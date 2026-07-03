-- Create contextual_insights table for AI-generated insights
-- Phase 3 Week 10 Day 66-67: Real-Time AI Processing

CREATE TABLE IF NOT EXISTS public.contextual_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.real_time_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('summary', 'key_point', 'question', 'decision', 'risk')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_text TEXT NOT NULL,
  relevance REAL DEFAULT 0,
  timestamp BIGINT NOT NULL, -- Milliseconds since session start
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contextual_insights ENABLE ROW LEVEL SECURITY;

-- Users can read insights from their own sessions
CREATE POLICY "Users can read own contextual insights"
  ON public.contextual_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = contextual_insights.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contextual insights"
  ON public.contextual_insights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = contextual_insights.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own contextual insights"
  ON public.contextual_insights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = contextual_insights.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own contextual insights"
  ON public.contextual_insights FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = contextual_insights.session_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contextual_insights_session_id ON public.contextual_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_contextual_insights_type ON public.contextual_insights(type);
CREATE INDEX IF NOT EXISTS idx_contextual_insights_relevance ON public.contextual_insights(relevance DESC);
CREATE INDEX IF NOT EXISTS idx_contextual_insights_timestamp ON public.contextual_insights(timestamp);
CREATE INDEX IF NOT EXISTS idx_contextual_insights_created_at ON public.contextual_insights(created_at DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_contextual_insights_title_fts ON public.contextual_insights 
  USING GIN (to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_contextual_insights_description_fts ON public.contextual_insights 
  USING GIN (to_tsvector('english', description));

-- Comment
COMMENT ON TABLE public.contextual_insights IS 'AI-generated contextual insights from real-time sessions';

