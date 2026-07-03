-- Create transcripts table for voice recordings
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en',
  professional_mode TEXT DEFAULT 'general',
  duration INTEGER DEFAULT 0, -- Duration in seconds
  word_count INTEGER DEFAULT 0,
  confidence REAL DEFAULT 0,
  audio_url TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own transcripts
CREATE POLICY "Users can read own transcripts"
  ON public.transcripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts"
  ON public.transcripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts"
  ON public.transcripts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts"
  ON public.transcripts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON public.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON public.transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcripts_is_deleted ON public.transcripts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transcripts_language ON public.transcripts(language);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_transcripts_content_fts ON public.transcripts 
  USING GIN (to_tsvector('english', content));

-- Update timestamp trigger
CREATE TRIGGER transcripts_updated_at
  BEFORE UPDATE ON public.transcripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

