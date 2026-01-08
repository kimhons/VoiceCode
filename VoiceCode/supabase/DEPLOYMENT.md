# Supabase Edge Functions Deployment Guide

This guide covers deploying all Stripe payment Edge Functions to Supabase.

## Prerequisites

1. **Supabase CLI installed:**
   ```bash
   npm install -g supabase
   ```

2. **Supabase project created:**
   - Go to https://app.supabase.com
   - Create a new project or use existing one
   - Note your project reference ID (found in Settings > General)

3. **Stripe account set up:**
   - Create products and prices in Stripe Dashboard
   - Get API keys from https://dashboard.stripe.com/apikeys
   - Set up webhook endpoint (will be configured after deployment)

---

## Step 1: Login to Supabase CLI

```bash
supabase login
```

This will open a browser window for authentication.

---

## Step 2: Link to Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

---

## Step 3: Set Environment Secrets

Edge Functions need these secrets to work. Set them in Supabase Dashboard or via CLI:

### Required Secrets:

```bash
# Stripe Secret Key (from Stripe Dashboard > Developers > API keys)
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx

# Stripe Webhook Secret (will be generated after webhook setup)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Supabase Service Role Key (from Supabase Dashboard > Settings > API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Price IDs (from Stripe Dashboard > Products)
supabase secrets set STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxx
```

**Alternative: Set via Dashboard**
- Go to Supabase Dashboard > Edge Functions > Secrets
- Add each secret manually

---

## Step 4: Deploy Edge Functions

Deploy all functions at once:

```bash
# From the VoiceCode/supabase directory
supabase functions deploy create-checkout-session
supabase functions deploy create-payment-intent
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

Or deploy all at once:

```bash
supabase functions deploy
```

---

## Step 5: Configure Stripe Webhooks

After deployment, you'll get URLs for your Edge Functions:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

### Set up webhook in Stripe:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter webhook URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Update the secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## Step 6: Test the Deployment

### Test Checkout Session Creation:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_xxxxx",
    "successUrl": "https://yourapp.com/success",
    "cancelUrl": "https://yourapp.com/cancel"
  }'
```

### Test Payment Intent Creation:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "description": "Test payment"
  }'
```

### Test Webhook Locally:

```bash
# Install Stripe CLI
stripe listen --forward-to https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

---

## Step 7: Update Frontend Environment Variables

Update your `.env.local` file with the deployed function URLs:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxx
VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxxxx
VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxxxx
```

---

## Troubleshooting

### Function deployment fails
- Check you're logged in: `supabase login`
- Verify project link: `supabase projects list`
- Check function logs: `supabase functions logs FUNCTION_NAME`

### Webhook not receiving events
- Verify webhook URL is correct in Stripe Dashboard
- Check webhook signing secret is set correctly
- Test with Stripe CLI: `stripe listen --forward-to YOUR_WEBHOOK_URL`
- Check function logs for errors

### Authentication errors
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check user is authenticated when calling functions
- Verify Authorization header is being sent

### Payment errors
- Use Stripe test mode keys (pk_test_ and sk_test_)
- Verify price IDs exist in Stripe Dashboard
- Test with Stripe test cards: https://stripe.com/docs/testing
- Check Stripe Dashboard > Logs for detailed errors

---

## Production Deployment

For production:

1. **Use production API keys:**
   - Stripe: `sk_live_xxxxx` and `pk_live_xxxxx`
   - Create production price IDs

2. **Update secrets with production values:**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
   ```

3. **Update webhook endpoint:**
   - Use production Stripe account
   - Point to production Supabase URL

4. **Enable monitoring:**
   - Set up Sentry or similar error tracking
   - Monitor Stripe Dashboard > Logs
   - Monitor Supabase Dashboard > Edge Functions > Logs

5. **Test thoroughly:**
   - Test all payment flows
   - Test subscription creation/cancellation
   - Test webhook handling
   - Test error scenarios

---

## Monitoring & Logs

### View function logs:
```bash
supabase functions logs create-checkout-session
supabase functions logs stripe-webhook --tail
```

### View all secrets:
```bash
supabase secrets list
```

### Delete a function:
```bash
supabase functions delete FUNCTION_NAME
```

---

## Security Checklist

- [ ] All secrets set in Supabase (not in code)
- [ ] Webhook signing secret configured
- [ ] CORS headers properly configured
- [ ] Authentication required on all endpoints
- [ ] RLS policies enabled on database tables
- [ ] Production keys separate from test keys
- [ ] Webhook endpoint uses HTTPS
- [ ] Error messages don't expose sensitive data

---

## Need Help?

- Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
- Stripe webhooks docs: https://stripe.com/docs/webhooks
- Stripe testing: https://stripe.com/docs/testing
- Check function logs for detailed errors

