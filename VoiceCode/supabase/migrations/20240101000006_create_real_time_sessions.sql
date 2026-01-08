-- Create real_time_sessions table for real-time AI sessions
-- Phase 3 Week 10 Day 66-67: Real-Time AI Processing

CREATE TABLE IF NOT EXISTS public.real_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'connecting', 'active', 'paused', 'ended', 'error')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER DEFAULT 0, -- Duration in seconds
  audio_chunks_processed INTEGER DEFAULT 0,
  transcription_accuracy REAL DEFAULT 0,
  suggestions_count INTEGER DEFAULT 0,
  action_items_count INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}', -- Session configuration
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.real_time_sessions ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own sessions
CREATE POLICY "Users can read own real-time sessions"
  ON public.real_time_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own real-time sessions"
  ON public.real_time_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own real-time sessions"
  ON public.real_time_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own real-time sessions"
  ON public.real_time_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_real_time_sessions_user_id ON public.real_time_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_real_time_sessions_status ON public.real_time_sessions(status);
CREATE INDEX IF NOT EXISTS idx_real_time_sessions_started_at ON public.real_time_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_real_time_sessions_created_at ON public.real_time_sessions(created_at DESC);

-- Update timestamp trigger
CREATE TRIGGER real_time_sessions_updated_at
  BEFORE UPDATE ON public.real_time_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Comment
COMMENT ON TABLE public.real_time_sessions IS 'Real-time AI session management with WebSocket streaming';

