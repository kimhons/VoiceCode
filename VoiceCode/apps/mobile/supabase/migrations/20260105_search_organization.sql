-- VoiceFlow Pro Mobile - Search & Organization Database Schema
-- Migration: 20260105_search_organization
-- Description: Create tables for tags, folders, and search functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#667eea',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

-- ============================================================================
-- FOLDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  color TEXT NOT NULL DEFAULT '#667eea',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name, parent_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);

-- ============================================================================
-- TRANSCRIPT_TAGS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transcript_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transcript_id, tag_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transcript_tags_transcript_id ON public.transcript_tags(transcript_id);
CREATE INDEX IF NOT EXISTS idx_transcript_tags_tag_id ON public.transcript_tags(tag_id);

-- ============================================================================
-- TRANSCRIPT_FOLDERS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transcript_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transcript_id, folder_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transcript_folders_transcript_id ON public.transcript_folders(transcript_id);
CREATE INDEX IF NOT EXISTS idx_transcript_folders_folder_id ON public.transcript_folders(folder_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_folders ENABLE ROW LEVEL SECURITY;

-- Tags Policies
CREATE POLICY "Users can view their own tags"
  ON public.tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.tags FOR DELETE
  USING (auth.uid() = user_id);

-- Folders Policies
CREATE POLICY "Users can view their own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- Transcript Tags Policies
CREATE POLICY "Users can view transcript tags for their transcripts"
  ON public.transcript_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transcripts
      WHERE transcripts.id = transcript_tags.transcript_id
      AND transcripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transcript tags for their transcripts"
  ON public.transcript_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transcripts
      WHERE transcripts.id = transcript_tags.transcript_id
      AND transcripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transcript tags for their transcripts"
  ON public.transcript_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.transcripts
      WHERE transcripts.id = transcript_tags.transcript_id
      AND transcripts.user_id = auth.uid()
    )
  );

-- Transcript Folders Policies
CREATE POLICY "Users can view transcript folders for their transcripts"
  ON public.transcript_folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transcripts
      WHERE transcripts.id = transcript_folders.transcript_id
      AND transcripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transcript folders for their transcripts"
  ON public.transcript_folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transcripts
      WHERE transcripts.id = transcript_folders.transcript_id
      AND transcripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transcript folders for their transcripts"
  ON public.transcript_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.transcripts
      WHERE transcripts.id = transcript_folders.transcript_id
      AND transcripts.user_id = auth.uid()
    )
  );

