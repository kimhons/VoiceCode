# VoiceFlow Pro - Alert API Server

Backend API server for sending email alerts from VoiceFlow Pro monitoring dashboards.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your SMTP credentials
nano .env
```

### 3. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

---

## 📋 API Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T10:30:00.000Z",
  "service": "VoiceFlow Pro Alert API"
}
```

---

### Send Email Alert
```http
POST /api/alerts/email
Content-Type: application/json

{
  "to": ["admin@example.com", "team@example.com"],
  "subject": "[CRITICAL] Budget Alert",
  "html": "<h1>Alert</h1><p>Your budget is at 90%</p>"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "<abc123@gmail.com>",
  "recipients": 2,
  "timestamp": "2025-10-26T10:30:00.000Z"
}
```

---

### Send Slack Alert (Proxy)
```http
POST /api/alerts/slack
Content-Type: application/json

{
  "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "payload": {
    "text": "Alert message",
    "attachments": [...]
  }
}
```

---

### Send Custom Webhook Alert
```http
POST /api/alerts/webhook
Content-Type: application/json

{
  "url": "https://your-webhook-endpoint.com/alerts",
  "payload": { "alert": "data" },
  "headers": { "Authorization": "Bearer token" }
}
```

---

### Test Email
```http
POST /api/alerts/test
Content-Type: application/json

{
  "email": "your-email@example.com"
}
```

Sends a test email to verify SMTP configuration.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` or `production` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | `your-app-password` |

### Gmail Setup

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update .env**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

### Other SMTP Providers

#### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key-id
SMTP_PASSWORD=your-aws-secret-access-key
```

#### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

---

## 🔧 Development

### Run in Development Mode
```bash
npm run dev
```

Uses `tsx watch` for hot reloading.

### Build for Production
```bash
npm run build
```

Compiles TypeScript to JavaScript in `dist/` folder.

### Run in Production
```bash
npm start
```

Runs the compiled JavaScript from `dist/`.

---

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

### Test Email Sending
```bash
curl -X POST http://localhost:3001/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### Test with Frontend
1. Start API server: `npm run dev`
2. Start web app: `cd ../web && npm run dev`
3. Navigate to monitoring dashboard
4. Click "Send Alert" button

---

## 📦 Deployment

### Option 1: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

```bash
docker build -t voiceflow-api .
docker run -p 3001:3001 --env-file .env voiceflow-api
```

### Option 2: PM2

```bash
npm install -g pm2
npm run build
pm2 start dist/server.js --name voiceflow-api
```

### Option 3: Systemd Service

```ini
[Unit]
Description=VoiceFlow Pro Alert API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/voiceflow-api
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## 🔒 Security

### Best Practices

1. **Never commit .env file**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use App Passwords**
   - Don't use your main email password
   - Generate app-specific passwords

3. **Enable CORS properly**
   - Configure allowed origins in production
   - Don't use `*` in production

4. **Rate Limiting**
   - Add rate limiting middleware
   - Prevent abuse

5. **HTTPS Only**
   - Use HTTPS in production
   - Encrypt all traffic

---

## 🐛 Troubleshooting

### "SMTP not configured" Error
- Check `.env` file exists
- Verify `SMTP_USER` and `SMTP_PASSWORD` are set
- Restart server after changing `.env`

### "Authentication failed" Error
- For Gmail: Use App Password, not regular password
- Enable 2-factor authentication first
- Check username/password are correct

### "Connection timeout" Error
- Check SMTP host and port
- Verify firewall allows outbound connections
- Try different port (587 or 465)

### Emails not received
- Check spam folder
- Verify recipient email addresses
- Check SMTP provider logs
- Test with `/api/alerts/test` endpoint

---

## 📚 Integration with Frontend

Update `alertNotification.service.ts`:

```typescript
// Change API endpoint
const response = await fetch('http://localhost:3001/api/alerts/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: email.recipients,
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    html: this.formatEmailHtml(alert),
  }),
});
```

Or use Vite proxy in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 📊 Monitoring

### Logs
```bash
# Development
npm run dev

# Production with PM2
pm2 logs voiceflow-api
```

### Health Check
```bash
# Manual check
curl http://localhost:3001/health

# Automated monitoring
*/5 * * * * curl -f http://localhost:3001/health || systemctl restart voiceflow-api
```

---

## 🎉 Success!

Your Alert API server is now ready to send email alerts from VoiceFlow Pro!

**Next Steps:**
1. ✅ Configure SMTP credentials
2. ✅ Test with `/api/alerts/test`
3. ✅ Integrate with frontend
4. ✅ Deploy to production

---

**Need Help?**
- Check troubleshooting section
- Review SMTP provider documentation
- Test with curl commands

