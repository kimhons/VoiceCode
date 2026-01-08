# Stripe Edge Functions Deployment Checklist

Use this checklist to ensure all steps are completed for a successful deployment.

## Pre-Deployment

### Stripe Setup
- [ ] Stripe account created
- [ ] Test mode enabled (for initial deployment)
- [ ] Products created in Stripe Dashboard
  - [ ] Pro Monthly plan
  - [ ] Pro Yearly plan
  - [ ] Enterprise Monthly plan
  - [ ] Enterprise Yearly plan
- [ ] Price IDs copied from Stripe Dashboard
- [ ] API keys obtained (Publishable and Secret)

### Supabase Setup
- [ ] Supabase project created
- [ ] Project reference ID noted
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Logged in to Supabase CLI (`supabase login`)
- [ ] Project linked (`supabase link --project-ref YOUR_REF`)
- [ ] Database migrations run
  - [ ] profiles table exists
  - [ ] subscriptions table exists
  - [ ] payments table exists
  - [ ] RLS policies enabled

---

## Deployment Steps

### 1. Set Environment Secrets
- [ ] Run `.\setup-secrets.ps1` or set manually:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET` (set after webhook creation)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STRIPE_PRO_MONTHLY_PRICE_ID`
  - [ ] `STRIPE_PRO_YEARLY_PRICE_ID`
  - [ ] `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID`
  - [ ] `STRIPE_ENTERPRISE_YEARLY_PRICE_ID`

### 2. Deploy Edge Functions
- [ ] Run `.\deploy-functions.ps1` or deploy manually:
  - [ ] `create-checkout-session` deployed
  - [ ] `create-payment-intent` deployed
  - [ ] `create-portal-session` deployed
  - [ ] `stripe-webhook` deployed
  - [ ] `send-push-notification` deployed
- [ ] All functions show "Active" status
- [ ] Function URLs noted

### 3. Configure Stripe Webhooks
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- [ ] Events selected:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
  - [ ] `payment_intent.succeeded`
- [ ] Webhook signing secret copied
- [ ] `STRIPE_WEBHOOK_SECRET` updated in Supabase

### 4. Update Frontend Environment Variables
- [ ] `.env.local` created (copy from `.env.example`)
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` set
- [ ] All `VITE_STRIPE_*_PRICE_ID` variables set

---

## Testing

### Manual Testing
- [ ] Test checkout session creation (authenticated)
- [ ] Test checkout session creation (unauthenticated - should fail)
- [ ] Test payment intent creation (authenticated)
- [ ] Test payment intent creation (unauthenticated - should fail)
- [ ] Test portal session creation (authenticated)
- [ ] Test CORS preflight (OPTIONS request)

### Automated Testing
- [ ] Run `.\test-payment-flow.ps1`
- [ ] All tests pass

### Stripe CLI Testing
- [ ] Stripe CLI installed
- [ ] Webhook forwarding tested: `stripe listen --forward-to YOUR_WEBHOOK_URL`
- [ ] Test events triggered:
  - [ ] `stripe trigger customer.subscription.created`
  - [ ] `stripe trigger invoice.payment_succeeded`
  - [ ] `stripe trigger payment_intent.succeeded`
- [ ] Webhook events received and processed correctly

### End-to-End Testing
- [ ] User can create account
- [ ] User can view pricing plans
- [ ] User can start checkout session
- [ ] User can complete payment (use test card: 4242 4242 4242 4242)
- [ ] Subscription created in database
- [ ] User profile updated with subscription tier
- [ ] User can access billing portal
- [ ] User can cancel subscription
- [ ] Subscription status updated in database

---

## Monitoring

### Function Logs
- [ ] View logs: `supabase functions logs FUNCTION_NAME --tail`
- [ ] No errors in logs
- [ ] Successful requests logged

### Stripe Dashboard
- [ ] Check Stripe Dashboard > Logs
- [ ] Verify API requests are successful
- [ ] Check webhook delivery status
- [ ] Verify test payments appear

### Database
- [ ] Check `subscriptions` table for new entries
- [ ] Check `payments` table for payment records
- [ ] Check `profiles` table for updated subscription tiers
- [ ] Verify RLS policies are working

---

## Production Deployment

### Before Going Live
- [ ] All tests pass in staging environment
- [ ] Switch to Stripe production mode
- [ ] Update secrets with production API keys
- [ ] Update webhook endpoint to production URL
- [ ] Update frontend environment variables
- [ ] Enable error monitoring (Sentry)
- [ ] Set up uptime monitoring
- [ ] Document rollback procedure

### Production Checklist
- [ ] Production Stripe keys set
- [ ] Production webhook configured
- [ ] Production database migrations run
- [ ] Production environment variables set
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

---

## Rollback Plan

If deployment fails:

1. **Revert Edge Functions:**
   ```bash
   supabase functions delete FUNCTION_NAME
   ```

2. **Revert Database Changes:**
   ```bash
   supabase db reset
   ```

3. **Disable Stripe Webhook:**
   - Go to Stripe Dashboard > Webhooks
   - Disable the webhook endpoint

4. **Notify Users:**
   - If in production, notify users of temporary service disruption

---

## Post-Deployment

- [ ] Monitor function logs for 24 hours
- [ ] Monitor Stripe webhook delivery
- [ ] Monitor error rates
- [ ] Test payment flow with real users (beta testers)
- [ ] Document any issues encountered
- [ ] Update documentation with lessons learned

---

## Support Resources

- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Stripe API:** https://stripe.com/docs/api
- **Stripe Webhooks:** https://stripe.com/docs/webhooks
- **Stripe Testing:** https://stripe.com/docs/testing
- **Supabase CLI:** https://supabase.com/docs/guides/cli

---

## Notes

**Date Deployed:** _______________

**Deployed By:** _______________

**Environment:** [ ] Development [ ] Staging [ ] Production

**Issues Encountered:**
- 
- 
- 

**Resolutions:**
- 
- 
- 

