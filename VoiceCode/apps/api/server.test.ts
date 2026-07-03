import http from "http";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "./server";

let server: http.Server;

beforeAll(async () => {
	server = http.createServer(app);
	await new Promise<void>((resolve) => {
		server.listen(0, () => resolve());
	});
});

afterAll(() => {
	return new Promise<void>((resolve) => {
		server.close(() => resolve());
	});
});

describe("VoiceCode Alert API", () => {
	describe("GET /health", () => {
		it("should return 200 with healthy status", async () => {
			const res = await request(server).get("/health");
			expect(res.status).toBe(200);
			expect(res.body.status).toBe("healthy");
			expect(res.body.service).toBe("VoiceCode Alert API");
			expect(res.body.timestamp).toBeDefined();
		});
	});

	describe("POST /api/alerts/email", () => {
		it("should return 400 when recipients missing", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({ subject: "Test", html: "<p>Test</p>" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid recipients");
		});

		it("should return 400 when recipients is not an array", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({ to: "not-array", subject: "Test", html: "<p>Test</p>" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid recipients");
		});

		it("should return 400 when subject missing", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({ to: ["test@example.com"], html: "<p>Test</p>" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid subject");
		});

		it("should return 400 when html missing", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({ to: ["test@example.com"], subject: "Test" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid content");
		});

		it("should return 500 when SMTP not configured", async () => {
			const origUser = process.env.SMTP_USER;
			const origPass = process.env.SMTP_PASSWORD;
			delete process.env.SMTP_USER;
			delete process.env.SMTP_PASSWORD;

			const res = await request(server)
				.post("/api/alerts/email")
				.send({
					to: ["test@example.com"],
					subject: "Test",
					html: "<p>Test</p>",
				});
			expect(res.status).toBe(500);
			expect(res.body.error).toBe("SMTP not configured");

			if (origUser) process.env.SMTP_USER = origUser;
			if (origPass) process.env.SMTP_PASSWORD = origPass;
		});

		it("should return 400 when email in to array has invalid format", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({ to: ["not-an-email"], subject: "Test", html: "<p>Test</p>" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid recipients");
			expect(res.body.message).toBe("Each recipient must be a valid email");
		});

		it("should return 400 when to array is empty", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({ to: [], subject: "Test", html: "<p>Test</p>" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid recipients");
		});

		it("should return 400 when subject exceeds max length", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({
					to: ["test@example.com"],
					subject: "x".repeat(501),
					html: "<p>Test</p>",
				});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid subject");
			expect(res.body.message).toBe("Subject too long");
		});

		it("should return 400 when html exceeds max length", async () => {
			const res = await request(server)
				.post("/api/alerts/email")
				.send({
					to: ["test@example.com"],
					subject: "Test",
					html: "x".repeat(100001),
				});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid content");
			expect(res.body.message).toBe("Content too long");
		});

		it("should accept valid email addresses and pass validation", async () => {
			// Will fail at SMTP stage (500) but should pass validation (not 400)
			const res = await request(server)
				.post("/api/alerts/email")
				.send({
					to: ["user@example.com", "admin@test.org"],
					subject: "Test",
					html: "<p>Hello</p>",
				});
			expect(res.status).not.toBe(400);
		});

		it("should ignore extra fields in the request body", async () => {
			// Extra fields should not cause validation errors
			const res = await request(server)
				.post("/api/alerts/email")
				.send({
					to: ["user@example.com"],
					subject: "Test",
					html: "<p>Hi</p>",
					extraField: "ignored",
				});
			expect(res.status).not.toBe(400);
		});
	});

	describe("POST /api/alerts/slack", () => {
		it("should return 400 when webhookUrl missing", async () => {
			const res = await request(server)
				.post("/api/alerts/slack")
				.send({ payload: { text: "Hello" } });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
		});

		it("should return 400 when payload missing", async () => {
			const res = await request(server)
				.post("/api/alerts/slack")
				.send({ webhookUrl: "https://hooks.slack.com/test" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
		});

		it("should return 400 when webhookUrl is not a valid URL", async () => {
			const res = await request(server)
				.post("/api/alerts/slack")
				.send({ webhookUrl: "not-a-url", payload: { text: "Hello" } });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
			expect(res.body.message).toBe("Invalid webhook URL");
		});

		it("should return 400 when body is empty", async () => {
			const res = await request(server).post("/api/alerts/slack").send({});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
		});
	});

	describe("POST /api/alerts/webhook", () => {
		it("should return 400 when url missing", async () => {
			const res = await request(server)
				.post("/api/alerts/webhook")
				.send({ payload: { data: "test" } });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
		});

		it("should return 400 when payload missing", async () => {
			const res = await request(server)
				.post("/api/alerts/webhook")
				.send({ url: "https://example.com/webhook" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
		});

		it("should return 400 when url is not a valid URL", async () => {
			const res = await request(server)
				.post("/api/alerts/webhook")
				.send({ url: "not-a-url", payload: { data: "test" } });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
			expect(res.body.message).toBe("Invalid URL");
		});

		it("should return 403 for private/local URLs (SSRF protection)", async () => {
			const res = await request(server)
				.post("/api/alerts/webhook")
				.send({ url: "http://127.0.0.1:1/evil", payload: { data: "test" } });
			expect(res.status).toBe(403);
			expect(res.body.error).toBe("URL not allowed");
			expect(res.body.message).toContain("SSRF protection");
		});
	});

	describe("POST /api/alerts/test", () => {
		it("should return 400 when email missing", async () => {
			const res = await request(server).post("/api/alerts/test").send({});
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
		});

		it("should return 400 when email has invalid format", async () => {
			const res = await request(server)
				.post("/api/alerts/test")
				.send({ email: "not-an-email" });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid request");
			expect(res.body.message).toBe("Invalid email address");
		});
	});
});
