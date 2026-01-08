/**
 * Alert Notification Service
 * Send alerts via email, Slack, and webhooks
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertChannel = 'email' | 'slack' | 'webhook' | 'all';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
    username?: string;
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
}

class AlertNotificationService {
  private static instance: AlertNotificationService;
  private config: NotificationConfig = {
    email: { enabled: false, recipients: [] },
    slack: { enabled: false, webhookUrl: '' },
    webhook: { enabled: false, url: '' },
  };

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): AlertNotificationService {
    if (!AlertNotificationService.instance) {
      AlertNotificationService.instance = new AlertNotificationService();
    }
    return AlertNotificationService.instance;
  }

  /**
   * Load configuration from environment or storage
   */
  private loadConfig(): void {
    // Load from environment variables
    this.config = {
      email: {
        enabled: import.meta.env.VITE_ALERT_EMAIL_ENABLED === 'true',
        recipients: (import.meta.env.VITE_ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
        smtpHost: import.meta.env.VITE_SMTP_HOST,
        smtpPort: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
        smtpUser: import.meta.env.VITE_SMTP_USER,
        smtpPassword: import.meta.env.VITE_SMTP_PASSWORD,
      },
      slack: {
        enabled: import.meta.env.VITE_ALERT_SLACK_ENABLED === 'true',
        webhookUrl: import.meta.env.VITE_SLACK_WEBHOOK_URL || '',
        channel: import.meta.env.VITE_SLACK_CHANNEL,
        username: import.meta.env.VITE_SLACK_USERNAME || 'VoiceFlow Pro',
      },
      webhook: {
        enabled: import.meta.env.VITE_ALERT_WEBHOOK_ENABLED === 'true',
        url: import.meta.env.VITE_ALERT_WEBHOOK_URL || '',
        headers: {},
      },
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send alert to specified channels
   */
  public async sendAlert(
    alert: Omit<Alert, 'id' | 'timestamp'>,
    channels: AlertChannel = 'all'
  ): Promise<void> {
    const fullAlert: Alert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
    };

    const promises: Promise<void>[] = [];

    if (channels === 'all' || channels === 'email') {
      if (this.config.email?.enabled) {
        promises.push(this.sendEmailAlert(fullAlert));
      }
    }

    if (channels === 'all' || channels === 'slack') {
      if (this.config.slack?.enabled) {
        promises.push(this.sendSlackAlert(fullAlert));
      }
    }

    if (channels === 'all' || channels === 'webhook') {
      if (this.config.webhook?.enabled) {
        promises.push(this.sendWebhookAlert(fullAlert));
      }
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      const { email } = this.config;
      if (!email?.enabled || !email.recipients.length) return;

      // In production, use a proper email service (SendGrid, AWS SES, etc.)
      // For now, we'll use a backend API endpoint
      const response = await fetch('/api/alerts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.recipients,
          subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          html: this.formatEmailHtml(alert),
        }),
      });

      if (!response.ok) {
        throw new Error(`Email alert failed: ${response.statusText}`);
      }

      console.log('Email alert sent:', alert.id);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: Alert): Promise<void> {
    try {
      const { slack } = this.config;
      if (!slack?.enabled || !slack.webhookUrl) return;

      const color = this.getSeverityColor(alert.severity);
      const emoji = this.getSeverityEmoji(alert.severity);

      const payload = {
        username: slack.username,
        channel: slack.channel,
        attachments: [
          {
            color,
            title: `${emoji} ${alert.title}`,
            text: alert.message,
            fields: [
              {
                title: 'Severity',
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Time',
                value: alert.timestamp.toLocaleString(),
                short: true,
              },
              ...(alert.metadata
                ? Object.entries(alert.metadata).map(([key, value]) => ({
                    title: key,
                    value: String(value),
                    short: true,
                  }))
                : []),
            ],
            footer: 'VoiceFlow Pro Monitoring',
            ts: Math.floor(alert.timestamp.getTime() / 1000),
          },
        ],
      };

      const response = await fetch(slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack alert failed: ${response.statusText}`);
      }

      console.log('Slack alert sent:', alert.id);
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert): Promise<void> {
    try {
      const { webhook } = this.config;
      if (!webhook?.enabled || !webhook.url) return;

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers,
        },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        throw new Error(`Webhook alert failed: ${response.statusText}`);
      }

      console.log('Webhook alert sent:', alert.id);
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Send budget alert
   */
  public async sendBudgetAlert(
    userId: string,
    budgetUsed: number,
    budget: number,
    totalCost: number
  ): Promise<void> {
    const percentage = (budgetUsed / budget) * 100;
    const severity: AlertSeverity = percentage >= 90 ? 'critical' : 'warning';

    await this.sendAlert({
      title: 'Budget Alert',
      message: `You've used ${percentage.toFixed(1)}% of your monthly budget ($${totalCost.toFixed(2)} / $${budget.toFixed(2)})`,
      severity,
      metadata: {
        userId,
        budgetUsed: `$${totalCost.toFixed(2)}`,
        budget: `$${budget.toFixed(2)}`,
        percentage: `${percentage.toFixed(1)}%`,
      },
    });
  }

  /**
   * Send security incident alert
   */
  public async sendSecurityAlert(
    userId: string,
    incidentType: string,
    severity: AlertSeverity,
    details: string
  ): Promise<void> {
    await this.sendAlert({
      title: 'Security Incident Detected',
      message: `${incidentType}: ${details}`,
      severity,
      metadata: {
        userId,
        incidentType,
        details,
      },
    });
  }

  /**
   * Send performance alert
   */
  public async sendPerformanceAlert(
    metric: string,
    value: number,
    threshold: number,
    unit: string
  ): Promise<void> {
    await this.sendAlert({
      title: 'Performance Alert',
      message: `${metric} is ${value}${unit}, exceeding threshold of ${threshold}${unit}`,
      severity: 'warning',
      metadata: {
        metric,
        value: `${value}${unit}`,
        threshold: `${threshold}${unit}`,
      },
    });
  }

  /**
   * Format email HTML
   */
  private formatEmailHtml(alert: Alert): string {
    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .metadata { background: white; padding: 15px; border-radius: 4px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} ${alert.title}</h1>
              <p>Severity: ${alert.severity.toUpperCase()}</p>
            </div>
            <div class="content">
              <p>${alert.message}</p>
              ${
                alert.metadata
                  ? `
                <div class="metadata">
                  <h3>Details:</h3>
                  ${Object.entries(alert.metadata)
                    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                    .join('')}
                </div>
              `
                  : ''
              }
              <p style="margin-top: 15px;"><strong>Time:</strong> ${alert.timestamp.toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>VoiceFlow Pro Monitoring System</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get severity color
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'info':
        return '#3b82f6'; // blue
      case 'warning':
        return '#f59e0b'; // yellow
      case 'critical':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      default:
        return '📢';
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton
export const alertNotificationService = AlertNotificationService.getInstance();

