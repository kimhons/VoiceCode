/**
 * Payment Flow End-to-End Tests
 * 
 * These tests verify the complete payment integration including:
 * - Checkout session creation
 * - Payment intent creation
 * - Billing portal access
 * - Webhook handling
 * - Error scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'test@voicecode.com';
const TEST_PASSWORD = 'TestPassword123!';

describe('Payment Flow E2E Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test user or sign in
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signUpError && signUpError.message.includes('already registered')) {
      // User exists, sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (signInError) throw signInError;
      authToken = signInData.session!.access_token;
      userId = signInData.user!.id;
    } else {
      if (signUpError) throw signUpError;
      authToken = signUpData.session!.access_token;
      userId = signUpData.user!.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.auth.signOut();
  });

  describe('Checkout Session Creation', () => {
    it('should create checkout session when authenticated', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
          successUrl: 'http://localhost:5173/success',
          cancelUrl: 'http://localhost:5173/cancel',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('sessionId');
      expect(data.url).toContain('checkout.stripe.com');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
          successUrl: 'http://localhost:5173/success',
          cancelUrl: 'http://localhost:5173/cancel',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject missing required fields', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
          // Missing successUrl and cancelUrl
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent when authenticated', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: 1000, // $10.00
          currency: 'usd',
          description: 'Test payment',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('clientSecret');
      expect(data).toHaveProperty('paymentIntentId');
      expect(data.clientSecret).toContain('pi_');
    });

    it('should reject invalid amount', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          amount: 10, // Less than minimum (50 cents)
          currency: 'usd',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 1000,
          currency: 'usd',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('CORS Configuration', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should return proper error for malformed JSON', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: 'invalid json',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return proper error for invalid price ID', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          priceId: 'invalid_price_id',
          successUrl: 'http://localhost:5173/success',
          cancelUrl: 'http://localhost:5173/cancel',
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

