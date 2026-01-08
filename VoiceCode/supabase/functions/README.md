# Supabase Edge Functions

This directory contains all Supabase Edge Functions for VoiceCode, including Stripe payment processing, push notifications, and more.

## Functions Overview

### Payment Functions

#### 1. `create-checkout-session`
Creates a Stripe Checkout Session for subscription payments.

**Endpoint:** `POST /functions/v1/create-checkout-session`

**Request:**
```json
{
  "priceId": "price_xxxxx",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel",
  "mode": "subscription"  // or "payment"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_xxxxx"
}
```

**Authentication:** Required (Bearer token)

---

#### 2. `create-payment-intent`
Creates a Stripe Payment Intent for one-time payments.

**Endpoint:** `POST /functions/v1/create-payment-intent`

**Request:**
```json
{
  "amount": 1000,  // Amount in cents
  "currency": "usd",
  "description": "Payment description",
  "metadata": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "paymentIntentId": "pi_xxxxx"
}
```

**Authentication:** Required (Bearer token)

---

#### 3. `create-portal-session`
Creates a Stripe Customer Portal session for managing subscriptions.

**Endpoint:** `POST /functions/v1/create-portal-session`

**Request:**
```json
{
  "returnUrl": "https://yourapp.com/account"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

**Authentication:** Required (Bearer token)

---

#### 4. `stripe-webhook`
Handles Stripe webhook events for subscription and payment updates.

**Endpoint:** `POST /functions/v1/stripe-webhook`

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_intent.succeeded`

**Authentication:** Stripe signature verification

---

### Notification Functions

#### 5. `send-push-notification`
Sends web push notifications to subscribed users.

**Endpoint:** `POST /functions/v1/send-push-notification`

**Request:**
```json
{
  "userId": "user-uuid",
  "title": "Notification Title",
  "body": "Notification message",
  "icon": "/icons/icon-192x192.png",
  "data": {
    "url": "/transcripts/123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "sent": 3
}
```

**Authentication:** Required (Bearer token)

---

## Shared Modules

### `_shared/cors.ts`
CORS headers and OPTIONS request handler.

### `_shared/stripe.ts`
Stripe client initialization and helper functions.

### `_shared/supabase.ts`
Supabase client creation and admin client.

---

## Local Development

### Start Supabase locally:
```bash
supabase start
```

### Serve functions locally:
```bash
supabase functions serve
```

### Test a function:
```bash
curl -X POST http://localhost:54321/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_test","successUrl":"http://localhost:5173/success","cancelUrl":"http://localhost:5173/cancel"}'
```

---

## Deployment

### Quick deployment:
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy create-checkout-session
```

### Using the deployment script:
```powershell
.\deploy-functions.ps1 -ProjectRef YOUR_PROJECT_REF
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions.

---

## Environment Variables

All functions require these secrets to be set in Supabase:

**Required:**
- `STRIPE_SECRET_KEY` - Stripe secret API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Optional (for price IDs):**
- `STRIPE_PRO_MONTHLY_PRICE_ID`
- `STRIPE_PRO_YEARLY_PRICE_ID`
- `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
- `STRIPE_ENTERPRISE_YEARLY_PRICE_ID`

Set secrets with:
```bash
supabase secrets set SECRET_NAME=value
```

Or use the setup script:
```powershell
.\setup-secrets.ps1
```

---

## Testing

### Run the test suite:
```powershell
.\test-payment-flow.ps1 -ProjectRef YOUR_PROJECT_REF -AnonKey YOUR_ANON_KEY
```

### Test with Stripe CLI:
```bash
# Listen for webhooks
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

---

## Monitoring

### View function logs:
```bash
# Tail logs in real-time
supabase functions logs stripe-webhook --tail

# View recent logs
supabase functions logs create-checkout-session
```

### Check function status:
```bash
supabase functions list
```

---

## Troubleshooting

### Function returns 500 error
- Check function logs: `supabase functions logs FUNCTION_NAME`
- Verify all secrets are set: `supabase secrets list`
- Check Stripe Dashboard > Logs for API errors

### Webhook not receiving events
- Verify webhook URL in Stripe Dashboard
- Check webhook signing secret is correct
- Test with Stripe CLI: `stripe listen --forward-to YOUR_URL`

### Authentication errors
- Verify Authorization header is being sent
- Check token is valid (not expired)
- Verify SUPABASE_SERVICE_ROLE_KEY is set

---

## Security

- All payment functions require authentication
- Webhook uses Stripe signature verification
- Secrets stored in Supabase (not in code)
- CORS configured for specific origins
- Input validation on all endpoints
- Error messages don't expose sensitive data

---

## Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe API](https://stripe.com/docs/api)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

