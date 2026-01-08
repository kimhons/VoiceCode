-- VoiceFlow Pro Mobile - AI Features Database Schema
-- Migration: 20260105_ai_features
-- Description: Create tables for AI summaries, key points, action items, and speakers

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SPEAKERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Speaker',
  color TEXT NOT NULL DEFAULT '#667eea',
  segment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_speakers_transcript_id ON public.speakers(transcript_id);
CREATE INDEX IF NOT EXISTS idx_speakers_user_id ON public.speakers(user_id);

-- ============================================================================
-- AI SUMMARIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_summaries_transcript_id ON public.ai_summaries(transcript_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_user_id ON public.ai_summaries(user_id);

-- ============================================================================
-- AI KEY POINTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_key_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_key_points_transcript_id ON public.ai_key_points(transcript_id);
CREATE INDEX IF NOT EXISTS idx_ai_key_points_user_id ON public.ai_key_points(user_id);

-- ============================================================================
-- ACTION ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_action_items_transcript_id ON public.action_items(transcript_id);
CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON public.action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_completed ON public.action_items(completed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_key_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Speakers policies
CREATE POLICY "Users can view their own speakers"
  ON public.speakers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own speakers"
  ON public.speakers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own speakers"
  ON public.speakers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own speakers"
  ON public.speakers FOR DELETE
  USING (auth.uid() = user_id);

-- AI Summaries policies
CREATE POLICY "Users can view their own summaries"
  ON public.ai_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own summaries"
  ON public.ai_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries"
  ON public.ai_summaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
  ON public.ai_summaries FOR DELETE
  USING (auth.uid() = user_id);

-- AI Key Points policies
CREATE POLICY "Users can view their own key points"
  ON public.ai_key_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own key points"
  ON public.ai_key_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own key points"
  ON public.ai_key_points FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own key points"
  ON public.ai_key_points FOR DELETE
  USING (auth.uid() = user_id);

-- Action Items policies
CREATE POLICY "Users can view their own action items"
  ON public.action_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action items"
  ON public.action_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action items"
  ON public.action_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action items"
  ON public.action_items FOR DELETE
  USING (auth.uid() = user_id);

