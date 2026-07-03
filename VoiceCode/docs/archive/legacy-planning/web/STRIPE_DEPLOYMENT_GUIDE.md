# 🚀 Stripe Payment Backend Deployment Guide

**Date:** January 8, 2026  
**Task:** Week 1, Task 2 - Deploy Stripe Payment Backend  
**Estimated Time:** 4-6 hours

---

## 📋 Overview

This guide will walk you through deploying the complete Stripe payment infrastructure for VoiceCode, including:
- Stripe account setup
- Product and pricing configuration
- Supabase Edge Functions deployment
- Webhook configuration
- Testing the payment flow

---

## ✅ Prerequisites Checklist

Before starting, ensure you have:
- [ ] Stripe account (create at https://stripe.com)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Supabase project (VoiceFlow Pro or create new)
- [ ] Access to Supabase dashboard
- [ ] PowerShell or terminal access

---

## 📦 Step 1: Stripe Account Setup (30 minutes)

### 1.1 Create Stripe Account
1. Go to https://stripe.com
2. Click "Start now" or "Sign in"
3. Complete account registration
4. Verify your email address

### 1.2 Enable Test Mode
1. In Stripe Dashboard, toggle "Test mode" ON (top right)
2. You'll see "Test mode" badge - this is important for development

### 1.3 Get API Keys
1. Go to **Developers** → **API keys**
2. Copy these keys (keep them secure):
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

**Save these for later:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

---

## 💰 Step 2: Create Products and Prices (30 minutes)

### 2.1 Create Pro Monthly Plan
1. Go to **Products** → **Add product**
2. Fill in:
   - **Name:** VoiceCode Pro Monthly
   - **Description:** Unlimited voice transcription with advanced AI features
   - **Pricing model:** Standard pricing
   - **Price:** $7.99 USD
   - **Billing period:** Monthly
   - **Currency:** USD
3. Click **Save product**
4. **Copy the Price ID** (starts with `price_`)

### 2.2 Create Pro Yearly Plan
1. In the same product, click **Add another price**
2. Fill in:
   - **Price:** $6.99 USD (per month, billed annually = $83.88/year)
   - **Billing period:** Yearly
3. Click **Save**
4. **Copy the Price ID**

### 2.3 Create Enterprise Plans (Optional)
Repeat the process for Enterprise tier:
- **Enterprise Monthly:** $14.99/month
- **Enterprise Yearly:** $12.99/month (billed annually)

**Save all Price IDs:**
```
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxx
```

---

## 🔧 Step 3: Supabase Project Setup (15 minutes)

### 3.1 Identify Your Supabase Project
You have a "VoiceFlow Pro" project. Get the project reference:
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **General**
4. Copy **Reference ID** (e.g., `gyyojhispujtawtnpzji`)

### 3.2 Get Supabase Keys
1. Go to **Settings** → **API**
2. Copy these keys:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

**Save these:**
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

## 🚀 Step 4: Deploy Edge Functions (30 minutes)

### 4.1 Login to Supabase CLI
Open PowerShell and run:
```powershell
supabase login
```
This will open a browser for authentication.

### 4.2 Link to Your Project
```powershell
cd C:\Githhub\VoiceCode\VoiceCode\supabase
supabase link --project-ref YOUR_PROJECT_REF
```
Replace `YOUR_PROJECT_REF` with your actual reference ID.

### 4.3 Set Secrets
Run the interactive setup script:
```powershell
.\setup-secrets.ps1
```

Or set manually:
```powershell
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
supabase secrets set STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxx
```

**Note:** We'll set `STRIPE_WEBHOOK_SECRET` after creating the webhook.

### 4.4 Deploy Functions
```powershell
.\deploy-functions.ps1
```

Or deploy manually:
```powershell
supabase functions deploy create-checkout-session
supabase functions deploy create-payment-intent
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

### 4.5 Verify Deployment
Check the deployment:
```powershell
supabase functions list
```

You should see all 4 functions listed.

---

## 🔗 Step 5: Configure Stripe Webhooks (20 minutes)

### 5.1 Get Webhook URL
Your webhook URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

### 5.2 Create Webhook in Stripe
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
5. Click **Add endpoint**

### 5.3 Get Webhook Secret
1. Click on the newly created webhook
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### 5.4 Set Webhook Secret
```powershell
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 🌐 Step 6: Update Web App Environment Variables (10 minutes)

Create `.env` file in `VoiceCode/VoiceCode/apps/web/`:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxx
```

---

## ✅ Next Steps

After completing this guide:
1. Test the payment flow (see PAYMENT_TESTING_GUIDE.md)
2. Create `.env.example` file (Task 4)
3. Proceed to Week 2 tasks

---

**Status:** Ready to deploy! Follow the steps above to complete Task 2.

