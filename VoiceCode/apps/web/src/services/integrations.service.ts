/**
 * Integrations Service
 * Phase 5.8: Third-Party Integrations
 * 
 * Integrations with Slack, Teams, Google Drive, Dropbox, Zoom, Notion, Trello, Zapier
 */

import { getSupabaseService } from './supabase.service';

// Types
export interface Integration {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  name: string;
  enabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationProvider = 
  | 'slack'
  | 'microsoft_teams'
  | 'google_drive'
  | 'dropbox'
  | 'zoom'
  | 'notion'
  | 'trello'
  | 'zapier';

export interface SlackConfig {
  workspaceId: string;
  workspaceName: string;
  channelId?: string;
  channelName?: string;
  webhookUrl?: string;
}

export interface TeamsConfig {
  tenantId: string;
  teamId: string;
  teamName: string;
  channelId?: string;
  channelName?: string;
  webhookUrl?: string;
}

export interface GoogleDriveConfig {
  folderId?: string;
  folderName?: string;
  autoSync: boolean;
}

export interface DropboxConfig {
  folderId?: string;
  folderPath?: string;
  autoSync: boolean;
}

export interface ZoomConfig {
  accountId: string;
  autoImport: boolean;
  importRecordings: boolean;
}

export interface NotionConfig {
  workspaceId: string;
  databaseId?: string;
  databaseName?: string;
  autoSync: boolean;
}

export interface TrelloConfig {
  boardId: string;
  boardName: string;
  listId?: string;
  listName?: string;
}

export interface ZapierConfig {
  webhookUrl: string;
  events: string[];
}

export interface IntegrationAction {
  id: string;
  integrationId: string;
  action: string;
  status: 'pending' | 'success' | 'failed';
  metadata: Record<string, any>;
  error?: string;
  createdAt: Date;
}

// Integrations Service
class IntegrationsService {
  // =====================================================
  // INTEGRATION MANAGEMENT
  // =====================================================

  async getIntegrations(userId: string): Promise<Integration[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Integration[];
    } catch (error) {
      console.error('Failed to get integrations:', error);
      throw error;
    }
  }

  async getIntegration(integrationId: string): Promise<Integration | null> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error) throw error;
      return data as Integration;
    } catch (error) {
      console.error('Failed to get integration:', error);
      return null;
    }
  }

  async createIntegration(
    userId: string,
    provider: IntegrationProvider,
    name: string,
    config: Record<string, any>,
    accessToken?: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<Integration> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('integrations')
        .insert({
          user_id: userId,
          provider,
          name,
          enabled: true,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt?.toISOString(),
          config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Integration;
    } catch (error) {
      console.error('Failed to create integration:', error);
      throw error;
    }
  }

  async updateIntegration(
    integrationId: string,
    updates: Partial<Integration>
  ): Promise<Integration> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;
      return data as Integration;
    } catch (error) {
      console.error('Failed to update integration:', error);
      throw error;
    }
  }

  async deleteIntegration(integrationId: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { error } = await client
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete integration:', error);
      throw error;
    }
  }

  async toggleIntegration(integrationId: string, enabled: boolean): Promise<Integration> {
    return this.updateIntegration(integrationId, { enabled });
  }

  // =====================================================
  // SLACK INTEGRATION
  // =====================================================

  async sendToSlack(
    integrationId: string,
    message: string,
    attachments?: any[]
  ): Promise<void> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration || !integration.enabled) {
        throw new Error('Integration not found or disabled');
      }

      const config = integration.config as SlackConfig;
      const webhookUrl = config.webhookUrl;

      if (!webhookUrl) {
        throw new Error('Slack webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          attachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message to Slack');
      }

      await this.logAction(integrationId, 'send_message', { message }, 'success');
    } catch (error) {
      await this.logAction(integrationId, 'send_message', { message }, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async shareTranscriptToSlack(
    integrationId: string,
    transcriptId: string,
    transcriptTitle: string,
    transcriptUrl: string
  ): Promise<void> {
    const message = `📝 New Transcript: ${transcriptTitle}`;
    const attachments = [
      {
        color: '#667eea',
        title: transcriptTitle,
        title_link: transcriptUrl,
        text: 'Click to view the full transcript',
        footer: 'VoiceFlow Pro',
        ts: Math.floor(Date.now() / 1000),
      },
    ];

    await this.sendToSlack(integrationId, message, attachments);
  }

  // =====================================================
  // MICROSOFT TEAMS INTEGRATION
  // =====================================================

  async sendToTeams(
    integrationId: string,
    title: string,
    text: string,
    sections?: any[]
  ): Promise<void> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration || !integration.enabled) {
        throw new Error('Integration not found or disabled');
      }

      const config = integration.config as TeamsConfig;
      const webhookUrl = config.webhookUrl;

      if (!webhookUrl) {
        throw new Error('Teams webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: title,
          themeColor: '667eea',
          title,
          text,
          sections,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message to Teams');
      }

      await this.logAction(integrationId, 'send_message', { title, text }, 'success');
    } catch (error) {
      await this.logAction(integrationId, 'send_message', { title, text }, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async shareTranscriptToTeams(
    integrationId: string,
    transcriptId: string,
    transcriptTitle: string,
    transcriptUrl: string
  ): Promise<void> {
    const title = '📝 New Transcript Available';
    const text = transcriptTitle;
    const sections = [
      {
        activityTitle: 'VoiceFlow Pro',
        activitySubtitle: new Date().toLocaleString(),
        facts: [
          { name: 'Transcript:', value: transcriptTitle },
          { name: 'ID:', value: transcriptId },
        ],
        markdown: true,
      },
    ];

    await this.sendToTeams(integrationId, title, text, sections);
  }

  // =====================================================
  // GOOGLE DRIVE INTEGRATION
  // =====================================================

  async uploadToGoogleDrive(
    integrationId: string,
    fileName: string,
    fileContent: string,
    mimeType: string = 'text/plain'
  ): Promise<string> {
    // Note: This is a simplified implementation
    // In production, use Google Drive API with proper OAuth
    throw new Error('Google Drive integration requires OAuth setup');
  }

  // =====================================================
  // DROPBOX INTEGRATION
  // =====================================================

  async uploadToDropbox(
    integrationId: string,
    fileName: string,
    fileContent: string
  ): Promise<string> {
    // Note: This is a simplified implementation
    // In production, use Dropbox API with proper OAuth
    throw new Error('Dropbox integration requires OAuth setup');
  }

  // =====================================================
  // ZAPIER WEBHOOKS
  // =====================================================

  async triggerZapierWebhook(
    integrationId: string,
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration || !integration.enabled) {
        throw new Error('Integration not found or disabled');
      }

      const config = integration.config as ZapierConfig;
      const webhookUrl = config.webhookUrl;

      if (!webhookUrl) {
        throw new Error('Zapier webhook URL not configured');
      }

      // Check if event is enabled
      if (!config.events.includes(event)) {
        return; // Event not enabled, skip
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger Zapier webhook');
      }

      await this.logAction(integrationId, 'trigger_webhook', { event, data }, 'success');
    } catch (error) {
      await this.logAction(integrationId, 'trigger_webhook', { event, data }, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // =====================================================
  // ACTION LOGGING
  // =====================================================

  private async logAction(
    integrationId: string,
    action: string,
    metadata: Record<string, any>,
    status: 'success' | 'failed',
    error?: string
  ): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client.from('integration_actions').insert({
        integration_id: integrationId,
        action,
        status,
        metadata,
        error,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log integration action:', err);
    }
  }

  async getIntegrationActions(integrationId: string, limit: number = 50): Promise<IntegrationAction[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('integration_actions')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as IntegrationAction[];
    } catch (error) {
      console.error('Failed to get integration actions:', error);
      throw error;
    }
  }
}

// Singleton instance
let integrationsInstance: IntegrationsService | null = null;

export function getIntegrationsService(): IntegrationsService {
  if (!integrationsInstance) {
    integrationsInstance = new IntegrationsService();
  }
  return integrationsInstance;
}

export default IntegrationsService;

