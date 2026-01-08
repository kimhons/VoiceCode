-- Create context_analyses table for NLP context analysis
-- Phase 3 Week 10 Day 66-67: Real-Time AI Processing

CREATE TABLE IF NOT EXISTS public.context_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.real_time_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  topics JSONB DEFAULT '[]', -- Array of Topic objects
  sentiment JSONB DEFAULT '{}', -- SentimentAnalysis object
  entities JSONB DEFAULT '[]', -- Array of Entity objects
  relationships JSONB DEFAULT '[]', -- Array of Relationship objects
  intents JSONB DEFAULT '[]', -- Array of Intent objects
  summary TEXT,
  confidence REAL DEFAULT 0,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.context_analyses ENABLE ROW LEVEL SECURITY;

-- Users can read analyses from their own sessions (or standalone analyses)
CREATE POLICY "Users can read own context analyses"
  ON public.context_analyses FOR SELECT
  USING (
    session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = context_analyses.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own context analyses"
  ON public.context_analyses FOR INSERT
  WITH CHECK (
    session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = context_analyses.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own context analyses"
  ON public.context_analyses FOR UPDATE
  USING (
    session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = context_analyses.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own context analyses"
  ON public.context_analyses FOR DELETE
  USING (
    session_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = context_analyses.session_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_context_analyses_session_id ON public.context_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_context_analyses_analyzed_at ON public.context_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_context_analyses_created_at ON public.context_analyses(created_at DESC);

-- JSONB indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_context_analyses_topics ON public.context_analyses USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_context_analyses_entities ON public.context_analyses USING GIN (entities);
CREATE INDEX IF NOT EXISTS idx_context_analyses_sentiment ON public.context_analyses USING GIN (sentiment);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_context_analyses_text_fts ON public.context_analyses 
  USING GIN (to_tsvector('english', text));

CREATE INDEX IF NOT EXISTS idx_context_analyses_summary_fts ON public.context_analyses 
  USING GIN (to_tsvector('english', summary));

-- Comment
COMMENT ON TABLE public.context_analyses IS 'NLP-based context analysis with topics, sentiment, entities, and relationships';

