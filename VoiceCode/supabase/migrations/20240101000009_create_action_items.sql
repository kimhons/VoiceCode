-- Create action_items table for detected action items
-- Phase 3 Week 10 Day 66-67: Real-Time AI Processing

CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.real_time_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  context TEXT,
  timestamp BIGINT NOT NULL, -- Milliseconds since session start
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Users can read action items from their own sessions
CREATE POLICY "Users can read own action items"
  ON public.action_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = action_items.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own action items"
  ON public.action_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = action_items.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own action items"
  ON public.action_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = action_items.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own action items"
  ON public.action_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.real_time_sessions
      WHERE id = action_items.session_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_action_items_session_id ON public.action_items(session_id);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON public.action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_is_confirmed ON public.action_items(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_action_items_is_completed ON public.action_items(is_completed);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON public.action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_action_items_timestamp ON public.action_items(timestamp);
CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON public.action_items(created_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_action_items_text_fts ON public.action_items 
  USING GIN (to_tsvector('english', text));

-- Update timestamp trigger
CREATE TRIGGER action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Comment
COMMENT ON TABLE public.action_items IS 'AI-detected action items from real-time sessions';

