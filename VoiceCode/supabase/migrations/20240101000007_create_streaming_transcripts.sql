-- Create streaming_transcripts table for real-time transcription
-- Phase 3 Week 10 Day 66-67: Real-Time AI Processing

CREATE TABLE IF NOT EXISTS public.streaming_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.real_time_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_final BOOLEAN DEFAULT FALSE,
  confidence REAL DEFAULT 0,
  timestamp BIGINT NOT NULL, -- Milliseconds since session start
  speaker_id TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  alternatives TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.streaming_transcripts ENABLE ROW LEVEL SECURITY;

-- Users can read transcripts from their own sessions
CREATE POLICY "Users can read own streaming transcripts"
  ON public.streaming_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = streaming_transcripts.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own streaming transcripts"
  ON public.streaming_transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = streaming_transcripts.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own streaming transcripts"
  ON public.streaming_transcripts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = streaming_transcripts.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own streaming transcripts"
  ON public.streaming_transcripts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = streaming_transcripts.session_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_streaming_transcripts_session_id ON public.streaming_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_streaming_transcripts_timestamp ON public.streaming_transcripts(timestamp);
CREATE INDEX IF NOT EXISTS idx_streaming_transcripts_is_final ON public.streaming_transcripts(is_final);
CREATE INDEX IF NOT EXISTS idx_streaming_transcripts_created_at ON public.streaming_transcripts(created_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_streaming_transcripts_text_fts ON public.streaming_transcripts 
  USING GIN (to_tsvector('english', text));

-- Comment
COMMENT ON TABLE public.streaming_transcripts IS 'Real-time streaming transcription with confidence scores';

