/**
 * Video Transcription Service
 * Phase 5.10: Video Transcription
 * 
 * Video upload, audio extraction, transcription, and subtitle generation
 */

import { getSupabaseService } from './supabase.service';

// Types
export interface VideoTranscription {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileSize: number;
  duration: number;
  format: string;
  status: 'uploading' | 'processing' | 'extracting' | 'transcribing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  audioUrl?: string;
  transcriptId?: string;
  subtitles?: SubtitleTrack[];
  metadata: VideoMetadata;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
  audioCodec: string;
  audioChannels: number;
  audioSampleRate: number;
}

export interface SubtitleTrack {
  id: string;
  videoId: string;
  format: 'srt' | 'vtt' | 'ass' | 'sbv';
  language: string;
  content: string;
  url?: string;
  createdAt: Date;
}

export interface SubtitleEntry {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
  speakerId?: string;
}

export interface VideoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Video Transcription Service
class VideoTranscriptionService {
  // =====================================================
  // VIDEO UPLOAD
  // =====================================================

  async uploadVideo(
    userId: string,
    file: File,
    title: string,
    onProgress?: (progress: VideoUploadProgress) => void
  ): Promise<VideoTranscription> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Create video transcription record
      const { data: videoRecord, error: createError } = await client
        .from('video_transcriptions')
        .insert({
          user_id: userId,
          title,
          file_name: file.name,
          file_size: file.size,
          format: file.type,
          status: 'uploading',
          progress: 0,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      // Upload video file to storage
      const filePath = `videos/${userId}/${videoRecord.id}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await client.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      // Report initial upload progress
      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });
      }

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = client.storage.from('videos').getPublicUrl(filePath);

      // Update video record with URL
      const { data: updatedRecord, error: updateError } = await client
        .from('video_transcriptions')
        .update({
          video_url: urlData.publicUrl,
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Start processing
      this.processVideo(updatedRecord.id);

      return updatedRecord as VideoTranscription;
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw error;
    }
  }

  // =====================================================
  // VIDEO PROCESSING
  // =====================================================

  private async processVideo(videoId: string): Promise<void> {
    try {
      // Update status
      await this.updateVideoStatus(videoId, 'extracting');

      // Extract audio from video
      const audioUrl = await this.extractAudio(videoId);

      // Update status
      await this.updateVideoStatus(videoId, 'transcribing');

      // Transcribe audio
      const transcriptId = await this.transcribeAudio(videoId, audioUrl);

      // Generate subtitles
      await this.generateSubtitles(videoId, transcriptId);

      // Update status
      await this.updateVideoStatus(videoId, 'completed');
    } catch (error) {
      console.error('Failed to process video:', error);
      await this.updateVideoStatus(videoId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async extractAudio(videoId: string): Promise<string> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Get video record
      const { data: video } = await client
        .from('video_transcriptions')
        .select('*')
        .eq('id', videoId)
        .single();

      if (!video) throw new Error('Video not found');

      // In production, this would use FFmpeg or a video processing service
      // For now, we'll simulate the process
      
      // Simulate audio extraction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create audio URL (in production, this would be the extracted audio file)
      const audioUrl = video.video_url; // Placeholder

      // Update video record
      await client
        .from('video_transcriptions')
        .update({
          audio_url: audioUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      return audioUrl;
    } catch (error) {
      console.error('Failed to extract audio:', error);
      throw error;
    }
  }

  private async transcribeAudio(videoId: string, audioUrl: string): Promise<string> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Get video record
      const { data: video } = await client
        .from('video_transcriptions')
        .select('*')
        .eq('id', videoId)
        .single();

      if (!video) throw new Error('Video not found');

      // Create transcript record
      const { data: transcript, error: transcriptError } = await client
        .from('transcripts')
        .insert({
          user_id: video.user_id,
          title: `${video.title} (Video)`,
          status: 'processing',
          mode: 'general',
          language: 'en',
          source: 'video',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (transcriptError) throw transcriptError;

      // In production, this would call the transcription API
      // For now, we'll simulate the process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update transcript with mock data
      await client
        .from('transcripts')
        .update({
          status: 'completed',
          text: 'This is a sample transcription from the video.',
          word_count: 8,
          duration: 10,
          confidence: 0.95,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transcript.id);

      // Update video record
      await client
        .from('video_transcriptions')
        .update({
          transcript_id: transcript.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      return transcript.id;
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      throw error;
    }
  }

  // =====================================================
  // SUBTITLE GENERATION
  // =====================================================

  async generateSubtitles(videoId: string, transcriptId: string): Promise<SubtitleTrack[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Get transcript
      const { data: transcript } = await client
        .from('transcripts')
        .select('*')
        .eq('id', transcriptId)
        .single();

      if (!transcript) throw new Error('Transcript not found');

      // Parse transcript into subtitle entries
      const entries = this.parseTranscriptToEntries(transcript.text, transcript.duration);

      // Generate subtitles in multiple formats
      const formats: Array<'srt' | 'vtt' | 'ass' | 'sbv'> = ['srt', 'vtt', 'ass', 'sbv'];
      const subtitleTracks: SubtitleTrack[] = [];

      for (const format of formats) {
        const content = this.generateSubtitleContent(entries, format);
        
        const { data: subtitleTrack, error } = await client
          .from('subtitle_tracks')
          .insert({
            video_id: videoId,
            format,
            language: transcript.language,
            content,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        subtitleTracks.push(subtitleTrack as SubtitleTrack);
      }

      return subtitleTracks;
    } catch (error) {
      console.error('Failed to generate subtitles:', error);
      throw error;
    }
  }

  private parseTranscriptToEntries(text: string, duration: number): SubtitleEntry[] {
    // Simple parsing - split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const entries: SubtitleEntry[] = [];
    const timePerSentence = duration / sentences.length;

    sentences.forEach((sentence, index) => {
      entries.push({
        index: index + 1,
        startTime: index * timePerSentence,
        endTime: (index + 1) * timePerSentence,
        text: sentence.trim(),
      });
    });

    return entries;
  }

  private generateSubtitleContent(entries: SubtitleEntry[], format: 'srt' | 'vtt' | 'ass' | 'sbv'): string {
    switch (format) {
      case 'srt':
        return this.generateSRT(entries);
      case 'vtt':
        return this.generateVTT(entries);
      case 'ass':
        return this.generateASS(entries);
      case 'sbv':
        return this.generateSBV(entries);
      default:
        return this.generateSRT(entries);
    }
  }

  private generateSRT(entries: SubtitleEntry[]): string {
    return entries
      .map((entry) => {
        const start = this.formatTime(entry.startTime, 'srt');
        const end = this.formatTime(entry.endTime, 'srt');
        return `${entry.index}\n${start} --> ${end}\n${entry.text}\n`;
      })
      .join('\n');
  }

  private generateVTT(entries: SubtitleEntry[]): string {
    const header = 'WEBVTT\n\n';
    const content = entries
      .map((entry) => {
        const start = this.formatTime(entry.startTime, 'vtt');
        const end = this.formatTime(entry.endTime, 'vtt');
        return `${start} --> ${end}\n${entry.text}\n`;
      })
      .join('\n');
    return header + content;
  }

  private generateASS(entries: SubtitleEntry[]): string {
    const header = `[Script Info]
Title: VoiceFlow Pro Subtitles
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    const content = entries
      .map((entry) => {
        const start = this.formatTime(entry.startTime, 'ass');
        const end = this.formatTime(entry.endTime, 'ass');
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${entry.text}`;
      })
      .join('\n');
    return header + content;
  }

  private generateSBV(entries: SubtitleEntry[]): string {
    return entries
      .map((entry) => {
        const start = this.formatTime(entry.startTime, 'sbv');
        const end = this.formatTime(entry.endTime, 'sbv');
        return `${start},${end}\n${entry.text}\n`;
      })
      .join('\n');
  }

  private formatTime(seconds: number, format: 'srt' | 'vtt' | 'ass' | 'sbv'): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    switch (format) {
      case 'srt':
      case 'vtt':
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
      case 'ass':
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(Math.floor(ms / 10)).padStart(2, '0')}`;
      case 'sbv':
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
      default:
        return '';
    }
  }

  // =====================================================
  // VIDEO MANAGEMENT
  // =====================================================

  async getVideoTranscription(videoId: string): Promise<VideoTranscription | null> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('video_transcriptions')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      return data as VideoTranscription;
    } catch (error) {
      console.error('Failed to get video transcription:', error);
      return null;
    }
  }

  async getUserVideoTranscriptions(userId: string, limit: number = 50): Promise<VideoTranscription[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('video_transcriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as VideoTranscription[];
    } catch (error) {
      console.error('Failed to get user video transcriptions:', error);
      throw error;
    }
  }

  async getSubtitleTracks(videoId: string): Promise<SubtitleTrack[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('subtitle_tracks')
        .select('*')
        .eq('video_id', videoId);

      if (error) throw error;
      return data as SubtitleTrack[];
    } catch (error) {
      console.error('Failed to get subtitle tracks:', error);
      throw error;
    }
  }

  async downloadSubtitles(subtitleId: string): Promise<Blob> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('subtitle_tracks')
        .select('*')
        .eq('id', subtitleId)
        .single();

      if (error) throw error;

      const subtitle = data as SubtitleTrack;
      return new Blob([subtitle.content], { type: 'text/plain' });
    } catch (error) {
      console.error('Failed to download subtitles:', error);
      throw error;
    }
  }

  async deleteVideoTranscription(videoId: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Delete video file from storage
      const { data: video } = await client
        .from('video_transcriptions')
        .select('video_url')
        .eq('id', videoId)
        .single();

      if (video?.video_url) {
        // Extract file path from URL
        const url = new URL(video.video_url);
        const filePath = url.pathname.split('/storage/v1/object/public/videos/')[1];
        
        if (filePath) {
          await client.storage.from('videos').remove([filePath]);
        }
      }

      // Delete video record (cascades to subtitle_tracks)
      const { error } = await client
        .from('video_transcriptions')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete video transcription:', error);
      throw error;
    }
  }

  private async updateVideoStatus(
    videoId: string,
    status: VideoTranscription['status'],
    error?: string
  ): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client
        .from('video_transcriptions')
        .update({
          status,
          error,
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId);
    } catch (err) {
      console.error('Failed to update video status:', err);
    }
  }
}

// Singleton instance
let videoTranscriptionInstance: VideoTranscriptionService | null = null;

export function getVideoTranscriptionService(): VideoTranscriptionService {
  if (!videoTranscriptionInstance) {
    videoTranscriptionInstance = new VideoTranscriptionService();
  }
  return videoTranscriptionInstance;
}

export default VideoTranscriptionService;

