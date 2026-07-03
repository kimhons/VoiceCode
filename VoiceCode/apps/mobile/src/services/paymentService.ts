/**
 * Payment Service
 * Stripe payment integration for subscriptions and one-time payments.
 * Calls Supabase edge functions for server-side Stripe operations.
 */

import { initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';
import { supabase } from './supabaseService';
import {
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICE_IDS,
  API_ENDPOINTS,
  SUPABASE_URL,
} from '@/config/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionInfo {
  id: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete';
  tier: 'free' | 'pro' | 'enterprise';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripePriceId: string | null;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  paymentIntentId?: string;
}

export interface CheckoutResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class PaymentService {
  private initialized = false;

  /**
   * Initialize Stripe SDK. Safe to call multiple times.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!STRIPE_PUBLISHABLE_KEY) {
      throw new Error('Stripe publishable key not configured');
    }

    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.voicecode.app',
      urlScheme: 'voicecode',
    });

    this.initialized = true;
  }

  /**
   * Get the current user's auth token for API calls.
   */
  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    return session.access_token;
  }

  /**
   * Create a Stripe Checkout Session via Supabase edge function.
   */
  async createCheckoutSession(priceId: string): Promise<CheckoutResult> {
    let token: string;
    try {
      token = await this.getAuthToken();
    } catch {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}${API_ENDPOINTS.createCheckoutSession}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl: 'voicecode://payment-success',
        cancelUrl: 'voicecode://payment-canceled',
        mode: 'subscription',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, url: data.url, sessionId: data.sessionId };
  }

  /**
   * Create a PaymentIntent via Supabase edge function.
   */
  async createPaymentIntent(amount: number, currency = 'usd'): Promise<PaymentResult> {
    let token: string;
    try {
      token = await this.getAuthToken();
    } catch {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}${API_ENDPOINTS.createPaymentIntent}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, currency }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, paymentIntentId: data.paymentIntentId };
  }

  /**
   * Present the Stripe Payment Sheet (for one-time payments).
   */
  async presentPayment(_clientSecret: string): Promise<PaymentResult> {
    await this.initialize();

    const { error } = await presentPaymentSheet();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  /**
   * Get the current user's active subscription from the database.
   */
  async getSubscription(): Promise<SubscriptionInfo | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      status: data.status,
      tier: this.deriveTierFromPriceId(data.stripe_price_id),
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      stripePriceId: data.stripe_price_id,
    };
  }

  /**
   * Check if the current user has an active subscription.
   */
  async hasActiveSubscription(): Promise<boolean> {
    const sub = await this.getSubscription();
    return sub !== null && (sub.status === 'active' || sub.status === 'trialing');
  }

  /**
   * Get the current user's subscription tier.
   */
  async getSubscriptionTier(): Promise<'free' | 'pro' | 'enterprise'> {
    const sub = await this.getSubscription();
    return sub?.tier ?? 'free';
  }

  /**
   * Open the Stripe Customer Portal for subscription management.
   */
  async openCustomerPortal(): Promise<CheckoutResult> {
    let token: string;
    try {
      token = await this.getAuthToken();
    } catch {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${SUPABASE_URL}${API_ENDPOINTS.createPortalSession}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ returnUrl: 'voicecode://subscription' }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, url: data.url };
  }

  /**
   * Derive subscription tier from the Stripe price ID.
   */
  private deriveTierFromPriceId(priceId: string | null): 'free' | 'pro' | 'enterprise' {
    if (!priceId) return 'free';

    const { proMonthly, proYearly, enterpriseMonthly, enterpriseYearly } = STRIPE_PRICE_IDS;

    if (priceId === enterpriseMonthly || priceId === enterpriseYearly) return 'enterprise';
    if (priceId === proMonthly || priceId === proYearly) return 'pro';

    // Fallback: check string content
    if (priceId.includes('enterprise')) return 'enterprise';
    if (priceId.includes('pro')) return 'pro';

    return 'free';
  }
}

export const paymentService = new PaymentService();
export default paymentService;

