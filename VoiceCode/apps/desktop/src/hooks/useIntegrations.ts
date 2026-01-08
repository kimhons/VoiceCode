/**
 * useIntegrations Hook
 * Phase 5.8: Third-Party Integrations
 * 
 * React hook for third-party integrations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getIntegrationsService,
  Integration,
  IntegrationProvider,
  IntegrationAction,
} from '../services/integrations.service';

export interface UseIntegrationsOptions {
  userId?: string;
  autoLoad?: boolean;
}

export interface UseIntegrationsReturn {
  // Integration Management
  getIntegrations: () => Promise<Integration[]>;
  getIntegration: (integrationId: string) => Promise<Integration | null>;
  createIntegration: (
    provider: IntegrationProvider,
    name: string,
    config: Record<string, any>,
    accessToken?: string,
    refreshToken?: string,
    expiresAt?: Date
  ) => Promise<Integration>;
  updateIntegration: (integrationId: string, updates: Partial<Integration>) => Promise<Integration>;
  deleteIntegration: (integrationId: string) => Promise<void>;
  toggleIntegration: (integrationId: string, enabled: boolean) => Promise<Integration>;

  // Slack
  sendToSlack: (integrationId: string, message: string, attachments?: any[]) => Promise<void>;
  shareTranscriptToSlack: (
    integrationId: string,
    transcriptId: string,
    transcriptTitle: string,
    transcriptUrl: string
  ) => Promise<void>;

  // Microsoft Teams
  sendToTeams: (integrationId: string, title: string, text: string, sections?: any[]) => Promise<void>;
  shareTranscriptToTeams: (
    integrationId: string,
    transcriptId: string,
    transcriptTitle: string,
    transcriptUrl: string
  ) => Promise<void>;

  // Zapier
  triggerZapierWebhook: (integrationId: string, event: string, data: Record<string, any>) => Promise<void>;

  // Actions
  getIntegrationActions: (integrationId: string, limit?: number) => Promise<IntegrationAction[]>;

  // State
  integrations: Integration[];
  selectedIntegration: Integration | null;
  actions: IntegrationAction[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useIntegrations(options: UseIntegrationsOptions = {}): UseIntegrationsReturn {
  const { userId, autoLoad = true } = options;

  // Service
  const service = useRef(getIntegrationsService());

  // State
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [actions, setActions] = useState<IntegrationAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load integrations
  useEffect(() => {
    if (autoLoad && userId) {
      getIntegrations();
    }
  }, [userId, autoLoad]);

  // Get Integrations
  const getIntegrations = useCallback(async (): Promise<Integration[]> => {
    if (!userId) throw new Error('User ID is required');

    setError(null);
    setIsLoading(true);
    try {
      const data = await service.current.getIntegrations(userId);
      setIntegrations(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get integrations';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Get Integration
  const getIntegration = useCallback(async (integrationId: string): Promise<Integration | null> => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await service.current.getIntegration(integrationId);
      setSelectedIntegration(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get integration';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create Integration
  const createIntegration = useCallback(
    async (
      provider: IntegrationProvider,
      name: string,
      config: Record<string, any>,
      accessToken?: string,
      refreshToken?: string,
      expiresAt?: Date
    ): Promise<Integration> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const integration = await service.current.createIntegration(
          userId,
          provider,
          name,
          config,
          accessToken,
          refreshToken,
          expiresAt
        );
        setIntegrations((prev) => [integration, ...prev]);
        return integration;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create integration';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Update Integration
  const updateIntegration = useCallback(
    async (integrationId: string, updates: Partial<Integration>): Promise<Integration> => {
      setError(null);
      setIsLoading(true);
      try {
        const integration = await service.current.updateIntegration(integrationId, updates);
        setIntegrations((prev) => prev.map((i) => (i.id === integrationId ? integration : i)));
        if (selectedIntegration?.id === integrationId) {
          setSelectedIntegration(integration);
        }
        return integration;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update integration';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedIntegration]
  );

  // Delete Integration
  const deleteIntegration = useCallback(async (integrationId: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await service.current.deleteIntegration(integrationId);
      setIntegrations((prev) => prev.filter((i) => i.id !== integrationId));
      if (selectedIntegration?.id === integrationId) {
        setSelectedIntegration(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete integration';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedIntegration]);

  // Toggle Integration
  const toggleIntegration = useCallback(
    async (integrationId: string, enabled: boolean): Promise<Integration> => {
      return updateIntegration(integrationId, { enabled });
    },
    [updateIntegration]
  );

  // Send to Slack
  const sendToSlack = useCallback(
    async (integrationId: string, message: string, attachments?: any[]): Promise<void> => {
      setError(null);
      setIsLoading(true);
      try {
        await service.current.sendToSlack(integrationId, message, attachments);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send to Slack';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Share Transcript to Slack
  const shareTranscriptToSlack = useCallback(
    async (
      integrationId: string,
      transcriptId: string,
      transcriptTitle: string,
      transcriptUrl: string
    ): Promise<void> => {
      setError(null);
      setIsLoading(true);
      try {
        await service.current.shareTranscriptToSlack(integrationId, transcriptId, transcriptTitle, transcriptUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to share to Slack';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Send to Teams
  const sendToTeams = useCallback(
    async (integrationId: string, title: string, text: string, sections?: any[]): Promise<void> => {
      setError(null);
      setIsLoading(true);
      try {
        await service.current.sendToTeams(integrationId, title, text, sections);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send to Teams';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Share Transcript to Teams
  const shareTranscriptToTeams = useCallback(
    async (
      integrationId: string,
      transcriptId: string,
      transcriptTitle: string,
      transcriptUrl: string
    ): Promise<void> => {
      setError(null);
      setIsLoading(true);
      try {
        await service.current.shareTranscriptToTeams(integrationId, transcriptId, transcriptTitle, transcriptUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to share to Teams';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger Zapier Webhook
  const triggerZapierWebhook = useCallback(
    async (integrationId: string, event: string, data: Record<string, any>): Promise<void> => {
      setError(null);
      setIsLoading(true);
      try {
        await service.current.triggerZapierWebhook(integrationId, event, data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to trigger Zapier webhook';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get Integration Actions
  const getIntegrationActions = useCallback(
    async (integrationId: string, limit: number = 50): Promise<IntegrationAction[]> => {
      setError(null);
      setIsLoading(true);
      try {
        const data = await service.current.getIntegrationActions(integrationId, limit);
        setActions(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get integration actions';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear Error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    getIntegrations,
    getIntegration,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    sendToSlack,
    shareTranscriptToSlack,
    sendToTeams,
    shareTranscriptToTeams,
    triggerZapierWebhook,
    getIntegrationActions,
    integrations,
    selectedIntegration,
    actions,
    isLoading,
    error,
    clearError,
  };
}

