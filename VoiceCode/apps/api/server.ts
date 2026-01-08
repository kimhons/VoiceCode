/**
 * VoiceFlow Pro - Alert API Server
 * Backend API for sending email alerts
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VoiceFlow Pro Alert API',
  });
});

// Email alert endpoint
app.post('/api/alerts/email', async (req: Request, res: Response) => {
  try {
    const { to, subject, html } = req.body;

    // Validation
    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        error: 'Invalid recipients',
        message: 'Recipients must be a non-empty array of email addresses',
      });
    }

    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({
        error: 'Invalid subject',
        message: 'Subject must be a non-empty string',
      });
    }

    if (!html || typeof html !== 'string') {
      return res.status(400).json({
        error: 'Invalid content',
        message: 'HTML content must be a non-empty string',
      });
    }

    // Check SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return res.status(500).json({
        error: 'SMTP not configured',
        message: 'SMTP credentials are not configured on the server',
      });
    }

    // Create transporter
    const transporter = createTransporter();

    // Send email
    const info = await transporter.sendMail({
      from: `"VoiceFlow Pro" <${process.env.SMTP_USER}>`,
      to: to.join(', '),
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      recipients: to.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Email sending failed:', error);

    res.status(500).json({
      error: 'Email sending failed',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

// Slack webhook proxy endpoint (optional)
app.post('/api/alerts/slack', async (req: Request, res: Response) => {
  try {
    const { webhookUrl, payload } = req.body;

    if (!webhookUrl || !payload) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'webhookUrl and payload are required',
      });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Slack alert failed:', error);

    res.status(500).json({
      error: 'Slack alert failed',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

// Custom webhook proxy endpoint (optional)
app.post('/api/alerts/webhook', async (req: Request, res: Response) => {
  try {
    const { url, payload, headers } = req.body;

    if (!url || !payload) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'url and payload are required',
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Webhook alert failed:', error);

    res.status(500).json({
      error: 'Webhook alert failed',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

// Test email endpoint (for development)
app.post('/api/alerts/test', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'email is required',
      });
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"VoiceFlow Pro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'VoiceFlow Pro - Test Alert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Test Alert Successful!</h1>
          <p>This is a test email from VoiceFlow Pro Alert API.</p>
          <p>If you received this email, your SMTP configuration is working correctly.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: VoiceFlow Pro Alert API
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Test email failed:', error);

    res.status(500).json({
      error: 'Test email failed',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown error occurred',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VoiceFlow Pro Alert API running on port ${PORT}`);
  console.log(`📧 SMTP configured: ${!!process.env.SMTP_USER}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;

