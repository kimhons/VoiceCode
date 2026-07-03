# 💳 VoiceCode - Payment Integration Guide (Part 2)

**Continuation from PAYMENT_INTEGRATION_GUIDE.md**

---

## Step 3.2: Create Edge Function: stripe-webhook

```bash
supabase functions new stripe-webhook
```

```typescript
// File: supabase/functions/stripe-webhook/index.ts

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

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Webhook received: ${event.type}`)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error updating subscription:', error)
  } else {
    console.log(`Subscription updated for user ${userId}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error deleting subscription:', error)
  } else {
    console.log(`Subscription deleted: ${subscription.id}`)
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.user_id
  if (!userId) {
    console.error('No user_id in payment intent metadata')
    return
  }

  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      description: paymentIntent.description,
    })

  if (error) {
    console.error('Error recording payment:', error)
  } else {
    console.log(`Payment succeeded for user ${userId}`)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.user_id
  if (!userId) return

  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      description: paymentIntent.description,
    })

  if (error) {
    console.error('Error recording failed payment:', error)
  }
}
```

---

## Step 3.3: Deploy Edge Functions

```bash
# Set environment variables
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook

# Get function URLs
# https://[project-id].supabase.co/functions/v1/create-checkout-session
# https://[project-id].supabase.co/functions/v1/stripe-webhook
```

---

## Step 4: Web App Payment Service (8 hours)

### 4.1 Install Stripe.js

```bash
cd VoiceCodeWeb
npm install @stripe/stripe-js
```

### 4.2 Create PaymentService

```typescript
// File: VoiceCodeWeb/src/services/PaymentService.ts

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export class PaymentService {
  private stripe: Stripe | null = null

  async initialize() {
    if (!this.stripe) {
      this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY)
    }
    return this.stripe
  }

  async createCheckoutSession(priceId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`,
        },
      })

      if (response.error) throw response.error

      const { url } = response.data
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  async getSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('Error getting subscription:', error)
      return null
    }
  }

  async cancelSubscription() {
    try {
      const subscription = await this.getSubscription()
      if (!subscription) throw new Error('No active subscription')

      // Call Stripe API to cancel subscription
      const response = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.stripe_subscription_id },
      })

      if (response.error) throw response.error
      return response.data
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  }

  async getUsage() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const month = new Date().toISOString().slice(0, 7) + '-01'
      const { data, error } = await supabase
        .from('usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || { voice_commands_count: 0, ai_requests_count: 0 }
    } catch (error) {
      console.error('Error getting usage:', error)
      return { voice_commands_count: 0, ai_requests_count: 0 }
    }
  }

  async checkUsageLimit(type: 'voice_commands' | 'ai_requests'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase.rpc('check_usage_limit', {
        p_user_id: user.id,
        p_type: type,
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error checking usage limit:', error)
      return false
    }
  }

  async incrementUsage(type: 'voice_commands' | 'ai_requests', count: number = 1) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_type: type,
        p_count: count,
      })
    } catch (error) {
      console.error('Error incrementing usage:', error)
    }
  }
}

export const paymentService = new PaymentService()
```

### 4.3 Create Subscription Page

```tsx
// File: VoiceCodeWeb/src/pages/Subscription.tsx

import React, { useEffect, useState } from 'react'
import { paymentService } from '../services/PaymentService'

const PRICE_IDS = {
  pro: 'price_pro_monthly', // Replace with actual Stripe price ID
  enterprise: 'price_enterprise_monthly',
}

export function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [sub, use] = await Promise.all([
      paymentService.getSubscription(),
      paymentService.getUsage(),
    ])
    setSubscription(sub)
    setUsage(use)
    setLoading(false)
  }

  async function handleSubscribe(tier: 'pro' | 'enterprise') {
    try {
      await paymentService.createCheckoutSession(PRICE_IDS[tier])
    } catch (error) {
      alert('Error creating checkout session')
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your subscription?')) return
    
    try {
      await paymentService.cancelSubscription()
      await loadData()
      alert('Subscription canceled')
    } catch (error) {
      alert('Error canceling subscription')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="subscription-page">
      <h1>Subscription</h1>

      {/* Current Plan */}
      <div className="current-plan">
        <h2>Current Plan</h2>
        {subscription ? (
          <div>
            <p>Status: {subscription.status}</p>
            <p>Tier: {subscription.price_id === PRICE_IDS.pro ? 'Pro' : 'Enterprise'}</p>
            <p>Renews: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
            <button onClick={handleCancel}>Cancel Subscription</button>
          </div>
        ) : (
          <p>Free Tier</p>
        )}
      </div>

      {/* Usage */}
      <div className="usage">
        <h2>Usage This Month</h2>
        <p>Voice Commands: {usage?.voice_commands_count || 0} / {subscription ? '∞' : '100'}</p>
        <p>AI Requests: {usage?.ai_requests_count || 0} / {subscription ? '∞' : '50'}</p>
      </div>

      {/* Pricing Plans */}
      {!subscription && (
        <div className="pricing-plans">
          <h2>Upgrade</h2>
          
          <div className="plan">
            <h3>Pro - $15/month</h3>
            <ul>
              <li>Unlimited voice commands</li>
              <li>Advanced AI (GPT-4, Claude)</li>
              <li>Priority support</li>
            </ul>
            <button onClick={() => handleSubscribe('pro')}>Subscribe</button>
          </div>

          <div className="plan">
            <h3>Enterprise - $50/user/month</h3>
            <ul>
              <li>Everything in Pro</li>
              <li>Team collaboration</li>
              <li>SSO/SAML</li>
              <li>Dedicated support</li>
            </ul>
            <button onClick={() => handleSubscribe('enterprise')}>Contact Sales</button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Step 5: Mobile App Payment Integration (16 hours)

### 5.1 Install Stripe React Native

```bash
cd VoiceCodeMobile
npm install @stripe/stripe-react-native
```

### 5.2 Configure iOS (Apple Pay)

```bash
# Add to app.json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.voicecode",
          "enableGooglePay": true
        }
      ]
    ]
  }
}

# Create Apple Pay merchant ID in Apple Developer Portal
# 1. Go to Certificates, Identifiers & Profiles
# 2. Identifiers → Merchant IDs → Create
# 3. ID: merchant.com.voicecode
# 4. Add to Xcode capabilities
```

### 5.3 Configure Android (Google Pay)

```json
// Add to app.json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### 5.4 Create Mobile PaymentService

```typescript
// File: VoiceCodeMobile/src/services/PaymentService.ts

import { useStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native'
import { supabase } from './supabase'

export class MobilePaymentService {
  async subscribe(priceId: string) {
    try {
      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      })

      if (error) throw error

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'VoiceCode',
        customerId: data.customerId,
        customerEphemeralKeySecret: data.ephemeralKey,
        paymentIntentClientSecret: data.paymentIntent,
        allowsDelayedPaymentMethods: true,
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
        },
      })

      if (initError) throw initError

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet()
      if (presentError) throw presentError

      return { success: true }
    } catch (error) {
      console.error('Payment error:', error)
      return { success: false, error }
    }
  }
}

export const mobilePaymentService = new MobilePaymentService()
```

---

**Continue to PAYMENT_INTEGRATION_GUIDE_PART3.md for:**
- Testing payment flows
- Webhook testing
- Production deployment
- Monitoring and analytics

