# Environment Variables Setup Guide

This guide will help you set up all required environment variables for the VoiceCode web application.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in the required variables** (see sections below)

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

---

## Required Services Setup

### 1. Supabase (Database & Authentication)

**Required for:** User authentication, data storage, real-time sync

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** > **API**
4. Copy the following values to `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Database Setup:**
- Run the SQL migrations in `supabase/migrations/`
- Enable Row Level Security (RLS) on all tables
- Configure OAuth providers (Google, GitHub, Microsoft) in **Authentication** > **Providers**

---

### 2. AIML API (Transcription Service)

**Required for:** Voice transcription, AI features

1. Go to [https://aimlapi.com](https://aimlapi.com)
2. Sign up and get your API key
3. Add to `.env.local`:
   ```env
   VITE_AIML_API_KEY=your-api-key-here
   VITE_AIML_BASE_URL=https://api.aimlapi.com/v1
   VITE_AIML_WS_URL=wss://api.aimlapi.com/v1/realtime
   ```

---

### 3. Stripe (Payment Processing)

**Required for:** Subscription payments, billing

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your publishable key from **Developers** > **API keys**
3. Create products and prices in **Products**
4. Add to `.env.local`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
   VITE_STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
   VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxx
   VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxx
   ```

**Edge Functions Setup:**
- Deploy Stripe Edge Functions (see `supabase/functions/`)
- Add secrets in Supabase Dashboard > Edge Functions > Secrets:
  - `STRIPE_SECRET_KEY` (from Stripe Dashboard)
  - `STRIPE_WEBHOOK_SECRET` (from Stripe Webhooks)
  - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Settings > API)

---

## Optional Services

### 4. Push Notifications (Optional)

**For:** Browser push notifications

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add public key to `.env.local`:
   ```env
   VITE_VAPID_PUBLIC_KEY=BNxxx...
   ```

3. Add private key to Supabase Edge Function secrets

---

### 5. Email Alerts (Optional)

**For:** System alerts via email

```env
VITE_ALERT_EMAIL_ENABLED=true
VITE_ALERT_EMAIL_RECIPIENTS=admin@example.com
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASSWORD=your-app-password
```

**Gmail Setup:**
- Enable 2FA on your Google account
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use the app password in `VITE_SMTP_PASSWORD`

---

### 6. Slack Alerts (Optional)

**For:** System alerts in Slack

1. Create a Slack app: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Add webhook URL to `.env.local`:
   ```env
   VITE_ALERT_SLACK_ENABLED=true
   VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
   VITE_SLACK_CHANNEL=#alerts
   ```

---

## Verification

After setting up environment variables, verify they're loaded correctly:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Check the browser console** for any warnings about missing env variables

3. **Test each service:**
   - Sign in with Supabase auth
   - Record and transcribe audio
   - Test payment flow (use Stripe test mode)

---

## Troubleshooting

### Variables not loading
- Restart the dev server (`Ctrl+C` then `npm run dev`)
- Verify `.env.local` is in the same directory as `package.json`
- Check for typos in variable names (must start with `VITE_`)

### Supabase connection errors
- Verify URL and anon key are correct
- Check if project is paused (free tier)
- Verify RLS policies are set up correctly

### Transcription not working
- Verify AIML API key is valid
- Check API quota/limits
- Test with a short audio file first

### Payment errors
- Use Stripe test mode keys (pk_test_...)
- Verify price IDs exist in Stripe Dashboard
- Check Edge Functions are deployed
- Test with Stripe test cards: https://stripe.com/docs/testing

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets committed to version control
- [ ] Different API keys for dev/staging/production
- [ ] Stripe webhook secret configured
- [ ] RLS enabled on all Supabase tables
- [ ] OAuth redirect URLs configured correctly
- [ ] CORS configured in Supabase
- [ ] Rate limiting enabled on APIs

---

## Production Deployment

For production deployment (Vercel, Netlify, etc.):

1. **Do NOT use `.env.local`** - use platform environment variables
2. **Set all required variables** in your hosting platform dashboard
3. **Use production API keys** (not test keys)
4. **Enable monitoring** (Sentry, LogRocket, etc.)
5. **Test thoroughly** in staging environment first

**Vercel:**
- Go to Project Settings > Environment Variables
- Add all `VITE_*` variables
- Deploy

**Netlify:**
- Go to Site Settings > Build & Deploy > Environment
- Add all `VITE_*` variables
- Deploy

---

## Need Help?

- Check the main README.md
- Review the technical documentation in `/docs`
- Check Supabase logs: Dashboard > Logs
- Check Stripe logs: Dashboard > Developers > Logs
- Open an issue on GitHub

