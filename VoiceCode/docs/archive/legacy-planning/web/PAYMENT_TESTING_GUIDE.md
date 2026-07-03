# Payment Flow End-to-End Testing Guide

This guide provides comprehensive testing procedures for the VoiceCode payment integration.

## Prerequisites

Before testing, ensure:
- [ ] Supabase Edge Functions deployed
- [ ] Stripe test mode enabled
- [ ] Environment variables configured
- [ ] Dev server running (`npm run dev`)
- [ ] Stripe CLI installed (for webhook testing)

---

## Test Environment Setup

### 1. Stripe Test Mode

Ensure you're using Stripe test keys:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

In Supabase secrets:
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 2. Test Cards

Use these Stripe test cards:

| Card Number | Description | Expected Result |
|------------|-------------|-----------------|
| 4242 4242 4242 4242 | Success | Payment succeeds |
| 4000 0000 0000 9995 | Decline | Card declined |
| 4000 0025 0000 3155 | 3D Secure | Requires authentication |
| 4000 0000 0000 0341 | Attach fails | Card can't be attached |

**For all cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

---

## Test Scenarios

### Scenario 1: Subscription Checkout (Happy Path)

**Objective:** User successfully subscribes to Pro Monthly plan

**Steps:**
1. Navigate to pricing page: `http://localhost:5173/pricing`
2. Click "Get Started" on Pro Monthly plan
3. Verify redirect to Stripe Checkout
4. Fill in test card: 4242 4242 4242 4242
5. Complete checkout
6. Verify redirect to success page
7. Check user profile shows "Pro" tier
8. Check database `subscriptions` table for new entry

**Expected Results:**
- [ ] Checkout session created successfully
- [ ] Stripe Checkout page loads
- [ ] Payment processes without errors
- [ ] User redirected to success page
- [ ] Subscription status: "active"
- [ ] User tier updated to "pro"
- [ ] Webhook received and processed

**Database Verification:**
```sql
-- Check subscription
SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';

-- Check profile
SELECT subscription_tier, subscription_status FROM profiles WHERE id = 'YOUR_USER_ID';
```

---

### Scenario 2: Subscription Checkout (Declined Card)

**Objective:** Handle declined payment gracefully

**Steps:**
1. Navigate to pricing page
2. Click "Get Started" on any plan
3. Use declined card: 4000 0000 0000 9995
4. Attempt to complete checkout

**Expected Results:**
- [ ] Stripe shows "Card declined" error
- [ ] User remains on checkout page
- [ ] No subscription created in database
- [ ] User tier remains "free"
- [ ] Error message is user-friendly

---

### Scenario 3: 3D Secure Authentication

**Objective:** Handle 3D Secure authentication flow

**Steps:**
1. Navigate to pricing page
2. Click "Get Started" on any plan
3. Use 3D Secure card: 4000 0025 0000 3155
4. Complete 3D Secure challenge
5. Complete checkout

**Expected Results:**
- [ ] 3D Secure modal appears
- [ ] User can complete authentication
- [ ] Payment succeeds after authentication
- [ ] Subscription created successfully

---

### Scenario 4: Billing Portal Access

**Objective:** User can manage subscription via Stripe portal

**Steps:**
1. Log in as user with active subscription
2. Navigate to account/billing page
3. Click "Manage Subscription"
4. Verify redirect to Stripe Customer Portal
5. Test portal features:
   - View invoices
   - Update payment method
   - Cancel subscription

**Expected Results:**
- [ ] Portal session created successfully
- [ ] User redirected to Stripe portal
- [ ] Portal shows correct subscription
- [ ] User can view invoices
- [ ] User can update payment method
- [ ] Cancellation works correctly

---

### Scenario 5: Subscription Cancellation

**Objective:** User can cancel subscription and tier is downgraded

**Steps:**
1. User with active subscription accesses billing portal
2. Click "Cancel subscription"
3. Confirm cancellation
4. Return to app

**Expected Results:**
- [ ] Subscription marked as `cancel_at_period_end: true`
- [ ] User retains access until period end
- [ ] Webhook `customer.subscription.updated` received
- [ ] Database updated correctly
- [ ] User sees cancellation notice

**Database Verification:**
```sql
SELECT cancel_at_period_end, current_period_end, status 
FROM subscriptions 
WHERE user_id = 'YOUR_USER_ID';
```

---

### Scenario 6: Subscription Renewal

**Objective:** Subscription renews automatically

**Steps:**
1. Create subscription with test clock (Stripe Dashboard)
2. Advance test clock to renewal date
3. Verify renewal webhook received

**Expected Results:**
- [ ] Invoice created
- [ ] Payment succeeds
- [ ] Webhook `invoice.payment_succeeded` received
- [ ] Subscription `current_period_end` updated
- [ ] User retains access

---

### Scenario 7: Failed Renewal Payment

**Objective:** Handle failed renewal gracefully

**Steps:**
1. Create subscription
2. Update payment method to declined card
3. Advance test clock to renewal date

**Expected Results:**
- [ ] Webhook `invoice.payment_failed` received
- [ ] Subscription status: "past_due"
- [ ] User notified of payment failure
- [ ] Retry logic triggered

---

### Scenario 8: One-Time Payment (Payment Intent)

**Objective:** User makes one-time payment

**Steps:**
1. Navigate to feature requiring one-time payment
2. Click "Pay Now"
3. Enter test card: 4242 4242 4242 4242
4. Complete payment

**Expected Results:**
- [ ] Payment intent created
- [ ] Payment succeeds
- [ ] Webhook `payment_intent.succeeded` received
- [ ] Payment recorded in `payments` table
- [ ] User receives confirmation

---

### Scenario 9: Unauthenticated Access

**Objective:** Prevent unauthenticated payment attempts

**Steps:**
1. Log out
2. Attempt to access checkout directly
3. Attempt to call Edge Function directly

**Expected Results:**
- [ ] Redirect to login page
- [ ] Edge Function returns 401 Unauthorized
- [ ] No checkout session created

---

### Scenario 10: Webhook Verification

**Objective:** Ensure webhooks are properly verified

**Steps:**
1. Start Stripe CLI: `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`
2. Trigger test events:
   ```bash
   stripe trigger customer.subscription.created
   stripe trigger invoice.payment_succeeded
   stripe trigger payment_intent.succeeded
   ```
3. Check function logs

**Expected Results:**
- [ ] All webhooks received
- [ ] Signature verification passes
- [ ] Events processed correctly
- [ ] Database updated
- [ ] No errors in logs

---

## Automated Testing

### Run Test Suite

```bash
# From VoiceCode/supabase directory
.\test-payment-flow.ps1 -ProjectRef YOUR_PROJECT_REF -AnonKey YOUR_ANON_KEY
```

**Expected:** All tests pass

---

## Manual Testing Checklist

### Pre-Flight Checks
- [ ] All Edge Functions deployed
- [ ] All secrets configured
- [ ] Webhook endpoint configured
- [ ] Test mode enabled
- [ ] Dev server running

### Checkout Flow
- [ ] Can view pricing page
- [ ] Can click "Get Started"
- [ ] Redirects to Stripe Checkout
- [ ] Can enter payment details
- [ ] Can complete payment
- [ ] Redirects to success page
- [ ] Subscription created in database

### Billing Portal
- [ ] Can access billing portal
- [ ] Can view subscription details
- [ ] Can view invoices
- [ ] Can update payment method
- [ ] Can cancel subscription

### Error Handling
- [ ] Declined card shows error
- [ ] Network error handled gracefully
- [ ] Invalid input rejected
- [ ] Unauthenticated access blocked

### Webhooks
- [ ] Subscription created webhook works
- [ ] Subscription updated webhook works
- [ ] Subscription deleted webhook works
- [ ] Invoice paid webhook works
- [ ] Invoice failed webhook works
- [ ] Payment intent webhook works

---

## Troubleshooting

### Checkout session not creating
- Check browser console for errors
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Check Edge Function logs
- Verify user is authenticated

### Webhook not received
- Check Stripe Dashboard > Webhooks > Events
- Verify webhook URL is correct
- Check webhook signing secret
- Test with Stripe CLI

### Payment succeeds but database not updated
- Check Edge Function logs
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check RLS policies on tables
- Verify webhook signature

### User tier not updating
- Check `stripe-webhook` function logs
- Verify `getTierFromPriceId()` logic
- Check price ID matches expected format

---

## Success Criteria

All scenarios must pass:
- [x] Scenario 1: Subscription Checkout (Happy Path)
- [x] Scenario 2: Declined Card
- [x] Scenario 3: 3D Secure
- [x] Scenario 4: Billing Portal
- [x] Scenario 5: Cancellation
- [x] Scenario 6: Renewal
- [x] Scenario 7: Failed Renewal
- [x] Scenario 8: One-Time Payment
- [x] Scenario 9: Unauthenticated Access
- [x] Scenario 10: Webhook Verification

---

## Next Steps

After all tests pass:
1. Document any issues found
2. Fix any bugs discovered
3. Update error messages for clarity
4. Add analytics tracking
5. Prepare for production deployment

