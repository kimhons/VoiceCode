// VoiceCode Mobile - Mobile Export Service

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabaseService';

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'srt' | 'vtt' | 'json';

export interface ExportTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  format: ExportFormat;
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  includeConfidence: boolean;
  includeMetadata: boolean;
  fontSize: number;
  fontFamily: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportHistory {
  id: string;
  userId: string;
  transcriptId: string;
  format: ExportFormat;
  templateId?: string;
  fileSize?: number;
  exportedAt: string;
}

export interface ShareLink {
  id: string;
  transcriptId: string;
  sharedBy: string;
  sharedWithEmail?: string;
  shareLink: string;
  accessLevel: 'view' | 'comment' | 'edit';
  expiresAt?: string;
  passwordHash?: string;
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchExportJob {
  id: string;
  userId: string;
  transcriptIds: string[];
  format: ExportFormat;
  templateId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  errorMessage?: string;
  resultFileUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Mobile Export Service
 * Handles export and sharing functionality for mobile
 */
export class MobileExportService {
  /**
   * Get export templates for user
   */
  async getTemplates(userId: string): Promise<ExportTemplate[]> {
    const { data, error } = await supabase
      .from('export_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((template) => ({
      id: template.id,
      userId: template.user_id,
      name: template.name,
      description: template.description,
      format: template.format,
      includeTimestamps: template.include_timestamps,
      includeSpeakers: template.include_speakers,
      includeConfidence: template.include_confidence,
      includeMetadata: template.include_metadata,
      fontSize: template.font_size,
      fontFamily: template.font_family,
      isDefault: template.is_default,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
    }));
  }

  /**
   * Create export template
   */
  async createTemplate(
    userId: string,
    template: Omit<ExportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ExportTemplate> {
    const { data, error } = await supabase
      .from('export_templates')
      .insert({
        user_id: userId,
        name: template.name,
        description: template.description,
        format: template.format,
        include_timestamps: template.includeTimestamps,
        include_speakers: template.includeSpeakers,
        include_confidence: template.includeConfidence,
        include_metadata: template.includeMetadata,
        font_size: template.fontSize,
        font_family: template.fontFamily,
        is_default: template.isDefault,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      format: data.format,
      includeTimestamps: data.include_timestamps,
      includeSpeakers: data.include_speakers,
      includeConfidence: data.include_confidence,
      includeMetadata: data.include_metadata,
      fontSize: data.font_size,
      fontFamily: data.font_family,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Update export template
   */
  async updateTemplate(
    id: string,
    updates: Partial<Omit<ExportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ExportTemplate> {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.format !== undefined) updateData.format = updates.format;
    if (updates.includeTimestamps !== undefined) updateData.include_timestamps = updates.includeTimestamps;
    if (updates.includeSpeakers !== undefined) updateData.include_speakers = updates.includeSpeakers;
    if (updates.includeConfidence !== undefined) updateData.include_confidence = updates.includeConfidence;
    if (updates.includeMetadata !== undefined) updateData.include_metadata = updates.includeMetadata;
    if (updates.fontSize !== undefined) updateData.font_size = updates.fontSize;
    if (updates.fontFamily !== undefined) updateData.font_family = updates.fontFamily;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

    const { data, error } = await supabase
      .from('export_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      format: data.format,
      includeTimestamps: data.include_timestamps,
      includeSpeakers: data.include_speakers,
      includeConfidence: data.include_confidence,
      includeMetadata: data.include_metadata,
      fontSize: data.font_size,
      fontFamily: data.font_family,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Delete export template
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from('export_templates').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Get export history for a user
   */
  async getExportHistory(userId: string, transcriptId?: string): Promise<ExportHistory[]> {
    let query = supabase
      .from('export_history')
      .select('*')
      .eq('user_id', userId)
      .order('exported_at', { ascending: false });

    if (transcriptId) {
      query = query.eq('transcript_id', transcriptId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      transcriptId: item.transcript_id,
      format: item.format,
      templateId: item.template_id,
      fileSize: item.file_size,
      exportedAt: item.exported_at,
    }));
  }

  /**
   * Save export history
   */
  async saveExportHistory(
    history: Omit<ExportHistory, 'id'>
  ): Promise<ExportHistory> {
    const { data, error } = await supabase
      .from('export_history')
      .insert({
        user_id: history.userId,
        transcript_id: history.transcriptId,
        format: history.format,
        template_id: history.templateId,
        file_size: history.fileSize,
        exported_at: history.exportedAt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      transcriptId: data.transcript_id,
      format: data.format,
      templateId: data.template_id,
      fileSize: data.file_size,
      exportedAt: data.exported_at,
    };
  }

  /**
   * Delete export history entry
   */
  async deleteExportHistory(id: string): Promise<void> {
    const { error } = await supabase.from('export_history').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Export transcript to text format
   */
  async exportToText(
    transcriptText: string,
    title: string,
    template: ExportTemplate
  ): Promise<string> {
    const fileUri = `${FileSystem.documentDirectory}${title}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, transcriptText);
    return fileUri;
  }

  /**
   * Export transcript to SRT format
   */
  async exportToSRT(
    transcriptText: string,
    title: string,
    timestamps?: Array<{ start: number; end: number; text: string }>
  ): Promise<string> {
    let srtContent = '';
    if (timestamps && timestamps.length > 0) {
      timestamps.forEach((segment, index) => {
        const startTime = this.formatSRTTime(segment.start);
        const endTime = this.formatSRTTime(segment.end);
        srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
      });
    } else {
      srtContent = transcriptText;
    }

    const fileUri = `${FileSystem.documentDirectory}${title}.srt`;
    await FileSystem.writeAsStringAsync(fileUri, srtContent);
    return fileUri;
  }

  /**
   * Export transcript to VTT format
   */
  async exportToVTT(
    transcriptText: string,
    title: string,
    timestamps?: Array<{ start: number; end: number; text: string }>
  ): Promise<string> {
    let vttContent = 'WEBVTT\n\n';
    if (timestamps && timestamps.length > 0) {
      timestamps.forEach((segment) => {
        const startTime = this.formatVTTTime(segment.start);
        const endTime = this.formatVTTTime(segment.end);
        vttContent += `${startTime} --> ${endTime}\n${segment.text}\n\n`;
      });
    } else {
      vttContent += transcriptText;
    }

    const fileUri = `${FileSystem.documentDirectory}${title}.vtt`;
    await FileSystem.writeAsStringAsync(fileUri, vttContent);
    return fileUri;
  }

  /**
   * Export transcript to JSON format
   */
  async exportToJSON(data: unknown, title: string): Promise<string> {
    const jsonContent = JSON.stringify(data, null, 2);
    const fileUri = `${FileSystem.documentDirectory}${title}.json`;
    await FileSystem.writeAsStringAsync(fileUri, jsonContent);
    return fileUri;
  }

  /**
   * Share file using native share dialog
   */
  async shareFile(fileUri: string, mimeType: string = 'text/plain'): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: 'Share Transcript',
    });
  }

  /**
   * Create share link for transcript
   */
  async createShareLink(
    transcriptId: string,
    userId: string,
    options: {
      email?: string;
      accessLevel: 'view' | 'comment' | 'edit';
      expiresAt?: string;
      password?: string;
    }
  ): Promise<ShareLink> {
    const shareLink = this.generateShareLink();

    const { data, error } = await supabase
      .from('shared_transcripts')
      .insert({
        transcript_id: transcriptId,
        shared_by: userId,
        shared_with_email: options.email,
        share_link: shareLink,
        access_level: options.accessLevel,
        expires_at: options.expiresAt,
        password_hash: options.password ? await this.hashPassword(options.password) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      transcriptId: data.transcript_id,
      sharedBy: data.shared_by,
      sharedWithEmail: data.shared_with_email,
      shareLink: data.share_link,
      accessLevel: data.access_level,
      expiresAt: data.expires_at,
      passwordHash: data.password_hash,
      viewCount: data.view_count,
      lastViewedAt: data.last_viewed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get shared transcripts
   */
  async getSharedTranscripts(userId: string): Promise<ShareLink[]> {
    const { data, error } = await supabase
      .from('shared_transcripts')
      .select('*')
      .eq('shared_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((share) => ({
      id: share.id,
      transcriptId: share.transcript_id,
      sharedBy: share.shared_by,
      sharedWithEmail: share.shared_with_email,
      shareLink: share.share_link,
      accessLevel: share.access_level,
      expiresAt: share.expires_at,
      passwordHash: share.password_hash,
      viewCount: share.view_count,
      lastViewedAt: share.last_viewed_at,
      createdAt: share.created_at,
      updatedAt: share.updated_at,
    }));
  }

  /**
   * Delete share link
   */
  async deleteShareLink(id: string): Promise<void> {
    const { error } = await supabase.from('shared_transcripts').delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Create batch export job
   */
  async createBatchExportJob(
    userId: string,
    transcriptIds: string[],
    format: ExportFormat,
    templateId?: string
  ): Promise<BatchExportJob> {
    const { data, error } = await supabase
      .from('batch_export_jobs')
      .insert({
        user_id: userId,
        transcript_ids: transcriptIds,
        format,
        template_id: templateId,
        status: 'pending',
        total_count: transcriptIds.length,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      transcriptIds: data.transcript_ids,
      format: data.format,
      templateId: data.template_id,
      status: data.status,
      progress: data.progress,
      totalCount: data.total_count,
      completedCount: data.completed_count,
      failedCount: data.failed_count,
      errorMessage: data.error_message,
      resultFileUrl: data.result_file_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };
  }

  /**
   * Get batch export jobs
   */
  async getBatchExportJobs(userId: string): Promise<BatchExportJob[]> {
    const { data, error } = await supabase
      .from('batch_export_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((job) => ({
      id: job.id,
      userId: job.user_id,
      transcriptIds: job.transcript_ids,
      format: job.format,
      templateId: job.template_id,
      status: job.status,
      progress: job.progress,
      totalCount: job.total_count,
      completedCount: job.completed_count,
      failedCount: job.failed_count,
      errorMessage: job.error_message,
      resultFileUrl: job.result_file_url,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      completedAt: job.completed_at,
    }));
  }

  /**
   * Helper: Format time for SRT (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  /**
   * Helper: Format time for VTT (HH:MM:SS.mmm)
   */
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  }

  /**
   * Helper: Generate unique share link
   */
  private generateShareLink(): string {
    return `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Helper: Hash password (simple implementation)
   */
  private async hashPassword(password: string): Promise<string> {
    // In production, use a proper hashing library like bcrypt
    return btoa(password);
  }
}

export const mobileExportService = new MobileExportService();

