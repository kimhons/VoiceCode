/**
 * VoiceCode - Alert API Server
 * Backend API for sending email alerts
 */

import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Optional API auth: when API_SECRET is set, require x-api-key header or Bearer token
const API_SECRET = process.env.API_SECRET || "";
const requireAuth = API_SECRET.length > 0;

const authMiddleware = (req: Request, res: Response, next: () => void) => {
	if (!requireAuth) {
		next();
		return;
	}
	const apiKey = req.headers["x-api-key"];
	const bearer = req.headers.authorization?.startsWith("Bearer ")
		? req.headers.authorization.slice(7)
		: null;
	const token = (typeof apiKey === "string" ? apiKey : null) ?? bearer;
	if (!token || token !== API_SECRET) {
		res.status(401).json({
			error: "Unauthorized",
			message:
				"Missing or invalid API key. Set x-api-key header or Authorization: Bearer <token>.",
		});
		return;
	}
	next();
};

// SSRF protection: reject private/local URLs
function isUrlAllowed(urlString: string): boolean {
	try {
		const u = new URL(urlString);
		const host = u.hostname.toLowerCase();
		if (
			host === "localhost" ||
			host === "127.0.0.1" ||
			host === "0.0.0.0" ||
			host === "::1"
		)
			return false;
		if (
			host.startsWith("10.") ||
			host.startsWith("192.168.") ||
			host.startsWith("172.16.") ||
			host.startsWith("172.17.") ||
			host.startsWith("172.18.") ||
			host.startsWith("172.19.") ||
			host.startsWith("172.2") ||
			host.startsWith("172.30.") ||
			host.startsWith("172.31.")
		)
			return false;
		if (host.endsWith(".local") || host === "[::1]") return false;
		return true;
	} catch {
		return false;
	}
}

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const createTransporter = () => {
	return nodemailer.createTransport({
		host: process.env.SMTP_HOST || "smtp.gmail.com",
		port: parseInt(process.env.SMTP_PORT || "587"),
		secure: false, // true for 465, false for other ports
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASSWORD,
		},
	});
};

// --- Zod Schemas ---
const EmailAlertSchema = z.object({
	to: z
		.array(z.string().email("Each recipient must be a valid email"))
		.min(1, "At least one recipient required")
		.max(100, "Too many recipients"),
	subject: z
		.string()
		.min(1, "Subject is required")
		.max(500, "Subject too long"),
	html: z
		.string()
		.min(1, "Content is required")
		.max(100000, "Content too long"),
});

const SlackAlertSchema = z.object({
	webhookUrl: z.string().url("Invalid webhook URL"),
	payload: z.record(z.string(), z.unknown()),
});

const WebhookAlertSchema = z.object({
	url: z.string().url("Invalid URL"),
	payload: z.record(z.string(), z.unknown()),
	headers: z.record(z.string(), z.string()).optional(),
});

const TestAlertSchema = z.object({
	email: z.string().email("Invalid email address"),
});

// Health check endpoint (no auth)
app.get("/health", (req: Request, res: Response) => {
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		service: "VoiceCode Alert API",
	});
});

// Protect alert endpoints when API_SECRET is set
app.use("/api/alerts", authMiddleware);

// Email alert endpoint
app.post("/api/alerts/email", async (req: Request, res: Response) => {
	try {
		const result = EmailAlertSchema.safeParse(req.body);
		if (!result.success) {
			const firstIssue = result.error.issues[0];
			const path = firstIssue.path[0];
			let errorMessage = "Invalid request";
			if (path === "to") errorMessage = "Invalid recipients";
			else if (path === "subject") errorMessage = "Invalid subject";
			else if (path === "html") errorMessage = "Invalid content";
			return res
				.status(400)
				.json({ error: errorMessage, message: firstIssue.message });
		}
		const { to, subject, html } = result.data;

		// Check SMTP configuration
		if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
			return res.status(500).json({
				error: "SMTP not configured",
				message: "SMTP credentials are not configured on the server",
			});
		}

		// Create transporter
		const transporter = createTransporter();

		// Send email
		const info = await transporter.sendMail({
			from: `"VoiceCode" <${process.env.SMTP_USER}>`,
			to: to.join(", "),
			subject,
			html,
		});

		console.log("Email sent:", info.messageId);

		res.json({
			success: true,
			messageId: info.messageId,
			recipients: to.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error("Email sending failed:", error);

		res.status(500).json({
			error: "Email sending failed",
			message: error.message || "Unknown error occurred",
			timestamp: new Date().toISOString(),
		});
	}
});

// Slack webhook proxy endpoint (optional)
app.post("/api/alerts/slack", async (req: Request, res: Response) => {
	try {
		const result = SlackAlertSchema.safeParse(req.body);
		if (!result.success) {
			return res.status(400).json({
				error: "Invalid request",
				message: result.error.issues[0].message,
			});
		}
		const { webhookUrl, payload } = result.data;

		if (!isUrlAllowed(webhookUrl)) {
			return res.status(403).json({
				error: "URL not allowed",
				message: "Private or local URLs are not allowed (SSRF protection).",
			});
		}

		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
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
		console.error("Slack alert failed:", error);

		res.status(500).json({
			error: "Slack alert failed",
			message: error.message || "Unknown error occurred",
			timestamp: new Date().toISOString(),
		});
	}
});

// Custom webhook proxy endpoint (optional)
app.post("/api/alerts/webhook", async (req: Request, res: Response) => {
	try {
		const result = WebhookAlertSchema.safeParse(req.body);
		if (!result.success) {
			return res.status(400).json({
				error: "Invalid request",
				message: result.error.issues[0].message,
			});
		}
		const { url, payload, headers } = result.data;

		if (!isUrlAllowed(url)) {
			return res.status(403).json({
				error: "URL not allowed",
				message: "Private or local URLs are not allowed (SSRF protection).",
			});
		}

		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
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
		console.error("Webhook alert failed:", error);

		res.status(500).json({
			error: "Webhook alert failed",
			message: error.message || "Unknown error occurred",
			timestamp: new Date().toISOString(),
		});
	}
});

// Test email endpoint (for development)
app.post("/api/alerts/test", async (req: Request, res: Response) => {
	try {
		const result = TestAlertSchema.safeParse(req.body);
		if (!result.success) {
			return res.status(400).json({
				error: "Invalid request",
				message: result.error.issues[0].message,
			});
		}
		const { email } = result.data;

		const transporter = createTransporter();

		const info = await transporter.sendMail({
			from: `"VoiceCode" <${process.env.SMTP_USER}>`,
			to: email,
			subject: "VoiceCode - Test Alert",
			html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">✅ Test Alert Successful!</h1>
          <p>This is a test email from VoiceCode Alert API.</p>
          <p>If you received this email, your SMTP configuration is working correctly.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: VoiceCode Alert API
          </p>
        </div>
      `,
		});

		res.json({
			success: true,
			messageId: info.messageId,
			message: "Test email sent successfully",
			timestamp: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error("Test email failed:", error);

		res.status(500).json({
			error: "Test email failed",
			message: error.message || "Unknown error occurred",
			timestamp: new Date().toISOString(),
		});
	}
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
	console.error("Unhandled error:", err);
	res.status(500).json({
		error: "Internal server error",
		message: err.message || "Unknown error occurred",
		timestamp: new Date().toISOString(),
	});
});

// Start server only when run directly (not imported by tests)
const isDirectRun =
	process.argv[1]?.endsWith("server.ts") ||
	process.argv[1]?.endsWith("server.js");
if (isDirectRun) {
	app.listen(PORT, () => {
		console.log(`🚀 VoiceCode Alert API running on port ${PORT}`);
		console.log(`📧 SMTP configured: ${!!process.env.SMTP_USER}`);
		console.log(`🔗 Health check: http://localhost:${PORT}/health`);
	});
}

export { app };
export default app;
