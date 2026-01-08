-- VoiceFlow Pro Mobile - Export & Sharing Features Migration
-- Phase 1 - Week 3: Export & Sharing

-- Export Templates Table
CREATE TABLE IF NOT EXISTS export_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'txt', 'srt', 'vtt', 'json')),
  include_timestamps BOOLEAN DEFAULT true,
  include_speakers BOOLEAN DEFAULT true,
  include_confidence BOOLEAN DEFAULT false,
  include_metadata BOOLEAN DEFAULT true,
  font_size INTEGER DEFAULT 12,
  font_family TEXT DEFAULT 'Arial',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export History Table
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  template_id UUID REFERENCES export_templates(id) ON DELETE SET NULL,
  file_size INTEGER,
  exported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared Transcripts Table
CREATE TABLE IF NOT EXISTS shared_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  share_link TEXT UNIQUE,
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'comment', 'edit')),
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Export Jobs Table
CREATE TABLE IF NOT EXISTS batch_export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript_ids UUID[] NOT NULL,
  format TEXT NOT NULL,
  template_id UUID REFERENCES export_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  total_count INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_message TEXT,
  result_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_templates_user_id ON export_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_export_templates_format ON export_templates(format);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_transcript_id ON export_history(transcript_id);
CREATE INDEX IF NOT EXISTS idx_shared_transcripts_transcript_id ON shared_transcripts(transcript_id);
CREATE INDEX IF NOT EXISTS idx_shared_transcripts_shared_by ON shared_transcripts(shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_transcripts_share_link ON shared_transcripts(share_link);
CREATE INDEX IF NOT EXISTS idx_batch_export_jobs_user_id ON batch_export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_export_jobs_status ON batch_export_jobs(status);

-- Row Level Security Policies

-- Export Templates RLS
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export templates"
  ON export_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export templates"
  ON export_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export templates"
  ON export_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own export templates"
  ON export_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Export History RLS
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own export history"
  ON export_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export history"
  ON export_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Shared Transcripts RLS
ALTER TABLE shared_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transcripts they shared"
  ON shared_transcripts FOR SELECT
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can create shared transcripts"
  ON shared_transcripts FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update transcripts they shared"
  ON shared_transcripts FOR UPDATE
  USING (auth.uid() = shared_by);

CREATE POLICY "Users can delete transcripts they shared"
  ON shared_transcripts FOR DELETE
  USING (auth.uid() = shared_by);

-- Batch Export Jobs RLS
ALTER TABLE batch_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own batch export jobs"
  ON batch_export_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch export jobs"
  ON batch_export_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch export jobs"
  ON batch_export_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_export_templates_updated_at
  BEFORE UPDATE ON export_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_transcripts_updated_at
  BEFORE UPDATE ON shared_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_export_jobs_updated_at
  BEFORE UPDATE ON batch_export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

