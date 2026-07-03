# 💳 VoiceCode - Payment Integration Guide

**Priority**: CRITICAL for Revenue Generation  
**Estimated Time**: 40-50 hours  
**Current MRR**: $0  
**Target MRR**: $8K (Month 3)

---

## 📋 Overview

This guide covers complete Stripe payment integration for:
- **Web App**: Subscription management with Stripe Checkout
- **Mobile App**: In-app purchases with Apple Pay & Google Pay
- **Backend**: Supabase Edge Functions for payment processing
- **Database**: Payment and subscription tracking

---

## 🎯 Pricing Strategy

### Free Tier
- 100 voice commands/month
- Basic AI integration (GPT-3.5)
- Community support

### Pro Tier - $15/month
- Unlimited voice commands
- Advanced AI (GPT-4, Claude 3.5)
- Priority support
- Custom commands
- Analytics dashboard

### Enterprise Tier - $50/user/month
- Everything in Pro
- Team collaboration
- SSO/SAML
- Dedicated support
- SLA guarantee
- Custom integrations

---

## Step 1: Set Up Stripe Account (1 hour)

### 1.1 Create Stripe Account

1. Go to https://stripe.com
2. Sign up for account
3. Complete business verification
4. Enable test mode

### 1.2 Get API Keys

```bash
# Test Mode Keys (for development)
# Dashboard → Developers → API keys

STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_SECRET_KEY_TEST=sk_test_...

# Production Keys (for launch)
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
STRIPE_SECRET_KEY_LIVE=sk_live_...
```

### 1.3 Create Products and Prices

**In Stripe Dashboard**:
1. Go to Products → Add Product
2. Create "VoiceCode - Pro Tier"
   - Name: VoiceCode - Pro
   - Description: Unlimited voice commands with advanced AI
   - Price: $15/month (recurring)
   - Currency: USD
   - Billing period: Monthly
3. Copy Price ID: `price_...`
4. Create "VoiceCode - Enterprise"
   - Price: $50/user/month
   - Copy Price ID: `price_...`

### 1.4 Configure Webhook Endpoint

```bash
# Webhook URL (will create in Step 3)
https://[your-project-id].supabase.co/functions/v1/stripe-webhook

# Events to listen for:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- payment_intent.succeeded
- payment_intent.payment_failed
- invoice.payment_succeeded
- invoice.payment_failed
```

---

## Step 2: Database Schema (4 hours)

### 2.1 Create Tables

```sql
-- File: supabase/migrations/20250101_payment_schema.sql

-- Customers table (links Stripe customers to users)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  price_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Payments table (for one-time payments and invoice tracking)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- succeeded, failed, pending
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking (for metering and limits)
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- first day of month
  voice_commands_count INTEGER DEFAULT 0,
  ai_requests_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Indexes for performance
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_usage_user_month ON usage(user_id, month);

-- Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own customer data"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage"
  ON usage FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access customers"
  ON customers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access usage"
  ON usage FOR ALL
  USING (auth.role() = 'service_role');
```

### 2.2 Create Helper Functions

```sql
-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_subscription_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_price_id TEXT;
BEGIN
  SELECT price_id INTO v_price_id
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  AND current_period_end > NOW()
  LIMIT 1;
  
  IF v_price_id IS NULL THEN
    RETURN 'free';
  ELSIF v_price_id = 'price_pro_monthly' THEN
    RETURN 'pro';
  ELSIF v_price_id = 'price_enterprise_monthly' THEN
    RETURN 'enterprise';
  ELSE
    RETURN 'free';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_type TEXT, -- 'voice_commands' or 'ai_requests'
  p_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_month DATE := DATE_TRUNC('month', NOW());
BEGIN
  INSERT INTO usage (user_id, month, voice_commands_count, ai_requests_count)
  VALUES (
    p_user_id,
    v_month,
    CASE WHEN p_type = 'voice_commands' THEN p_count ELSE 0 END,
    CASE WHEN p_type = 'ai_requests' THEN p_count ELSE 0 END
  )
  ON CONFLICT (user_id, month)
  DO UPDATE SET
    voice_commands_count = usage.voice_commands_count + 
      CASE WHEN p_type = 'voice_commands' THEN p_count ELSE 0 END,
    ai_requests_count = usage.ai_requests_count + 
      CASE WHEN p_type = 'ai_requests' THEN p_count ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_month DATE := DATE_TRUNC('month', NOW());
BEGIN
  -- Get subscription tier
  v_tier := get_subscription_tier(p_user_id);
  
  -- Pro and Enterprise have unlimited usage
  IF v_tier IN ('pro', 'enterprise') THEN
    RETURN TRUE;
  END IF;
  
  -- Free tier: check limits
  SELECT 
    CASE 
      WHEN p_type = 'voice_commands' THEN voice_commands_count
      WHEN p_type = 'ai_requests' THEN ai_requests_count
      ELSE 0
    END
  INTO v_count
  FROM usage
  WHERE user_id = p_user_id AND month = v_month;
  
  -- If no usage record, allow
  IF v_count IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Free tier limits
  IF p_type = 'voice_commands' AND v_count >= 100 THEN
    RETURN FALSE;
  END IF;
  
  IF p_type = 'ai_requests' AND v_count >= 50 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.3 Apply Migration

```bash
# Connect to Supabase
supabase db push

# Or via Supabase Dashboard
# SQL Editor → New Query → Paste SQL → Run
```

---

## Step 3: Supabase Edge Functions (20 hours)

### 3.1 Create Edge Function: create-checkout-session

```bash
# Create function
supabase functions new create-checkout-session
```

```typescript
// File: supabase/functions/create-checkout-session/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

serve(async (req) => {
  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const { priceId, successUrl, cancelUrl } = await req.json()

    // Get or create Stripe customer
    let customerId: string
    const { data: customer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (customer) {
      customerId = customer.stripe_customer_id
    } else {
      // Create new Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = stripeCustomer.id

      // Save to database
      await supabase.from('customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        email: user.email,
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
      },
    })

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

---

**Continue to PAYMENT_INTEGRATION_GUIDE_PART2.md for:**
- Edge Function: stripe-webhook
- Edge Function: create-payment-intent
- Web App PaymentService
- Mobile App Payment Integration
- Apple Pay & Google Pay Setup
- Testing Guide

