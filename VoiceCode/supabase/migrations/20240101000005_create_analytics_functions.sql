-- Analytics functions for dashboard

-- Get recordings by day for a user
CREATE OR REPLACE FUNCTION public.get_recordings_by_day(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  count BIGINT,
  total_duration BIGINT,
  avg_confidence REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(t.created_at) as date,
    COUNT(*)::BIGINT as count,
    COALESCE(SUM(t.duration), 0)::BIGINT as total_duration,
    AVG(t.confidence)::REAL as avg_confidence
  FROM public.transcripts t
  WHERE t.user_id = p_user_id
    AND t.is_deleted = FALSE
    AND t.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(t.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get language distribution for a user
CREATE OR REPLACE FUNCTION public.get_language_distribution(p_user_id UUID)
RETURNS TABLE (
  language TEXT,
  count BIGINT,
  percentage REAL
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM public.transcripts
  WHERE user_id = p_user_id AND is_deleted = FALSE;

  RETURN QUERY
  SELECT 
    t.language,
    COUNT(*)::BIGINT as count,
    (COUNT(*)::REAL / NULLIF(total_count, 0) * 100)::REAL as percentage
  FROM public.transcripts t
  WHERE t.user_id = p_user_id AND t.is_deleted = FALSE
  GROUP BY t.language
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get usage stats for a user
CREATE OR REPLACE FUNCTION public.get_usage_stats(p_user_id UUID)
RETURNS TABLE (
  total_transcripts BIGINT,
  total_duration BIGINT,
  total_words BIGINT,
  avg_confidence REAL,
  transcripts_this_month BIGINT,
  duration_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_transcripts,
    COALESCE(SUM(duration), 0)::BIGINT as total_duration,
    COALESCE(SUM(word_count), 0)::BIGINT as total_words,
    AVG(confidence)::REAL as avg_confidence,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))::BIGINT as transcripts_this_month,
    COALESCE(SUM(duration) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())), 0)::BIGINT as duration_this_month
  FROM public.transcripts
  WHERE user_id = p_user_id AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_recordings_by_day TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_language_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_usage_stats TO authenticated;

