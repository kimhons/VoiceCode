/**
 * Billing Service (PRO TIER)
 * Manages subscriptions, payments, and billing operations
 */

import * as vscode from 'vscode';

export interface SubscriptionInfo {
  tier: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface UsageMetrics {
  transcriptionMinutes: number;
  apiCalls: number;
  storageUsedMB: number;
  limit: {
    transcriptionMinutes: number;
    apiCalls: number;
    storageUsedMB: number;
  };
}

export class BillingService {
  /**
   * Get current subscription info
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    // Stub implementation
    return {
      tier: 'PRO',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    };
  }

  /**
   * Get usage metrics for current billing period
   */
  async getUsageMetrics(): Promise<UsageMetrics> {
    return {
      transcriptionMinutes: 45,
      apiCalls: 1250,
      storageUsedMB: 128,
      limit: {
        transcriptionMinutes: 300, // 5 hours
        apiCalls: 10000,
        storageUsedMB: 1024, // 1 GB
      },
    };
  }

  /**
   * Show billing dashboard
   */
  async showDashboard(): Promise<void> {
    const info = await this.getSubscriptionInfo();
    const usage = await this.getUsageMetrics();

    vscode.window.showInformationMessage(
      `VoiceFlow Pro - ${info.tier} tier (${info.status})\\n` +
        `Usage: ${usage.transcriptionMinutes}/${usage.limit.transcriptionMinutes} minutes`
    );
  }

  /**
   * Upgrade subscription
   */
  async upgrade(): Promise<void> {
    const result = await vscode.window.showInformationMessage(
      'Upgrade to VoiceFlow Pro Enterprise?',
      'Upgrade',
      'Cancel'
    );

    if (result === 'Upgrade') {
      vscode.env.openExternal(vscode.Uri.parse('https://voiceflow.pro/pricing'));
    }
  }

  /**
   * Cancel subscription
   */
  async cancel(): Promise<void> {
    const result = await vscode.window.showWarningMessage(
      'Cancel your VoiceFlow Pro subscription?',
      { modal: true },
      'Yes, Cancel',
      'No'
    );

    if (result === 'Yes, Cancel') {
      vscode.window.showInformationMessage(
        'Subscription will be canceled at the end of the current period'
      );
    }
  }
}
