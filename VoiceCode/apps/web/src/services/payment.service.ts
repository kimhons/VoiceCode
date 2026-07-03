/**
 * Payment Service for VoiceCode Web App
 * Handles Stripe payments, subscriptions, and billing portal
 */
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { SupabaseService } from './supabase.service';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

// Singleton Stripe instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Singleton SupabaseService instance
const supabaseService = new SupabaseService();

// Price IDs for subscription tiers
export const PRICE_IDS = {
  pro_monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || '',
  pro_yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || '',
  enterprise_monthly: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
  enterprise_yearly: import.meta.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
};

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export class PaymentService {
  private static async getAuthToken(): Promise<string> {
    const client = supabaseService.getClient();
    const { data: { session } } = await client.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    return session.access_token;
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    priceId: string,
    successUrl: string = `${window.location.origin}/settings?payment=success`,
    cancelUrl: string = `${window.location.origin}/settings?payment=canceled`
  ): Promise<{ url: string; sessionId: string }> {
    const token = await this.getAuthToken();

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ priceId, successUrl, cancelUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    return response.json();
  }

  /**
   * Create a payment intent for one-time payments
   */
  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    description?: string
  ): Promise<PaymentIntent> {
    const token = await this.getAuthToken();

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, currency, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return response.json();
  }

  /**
   * Get current user's subscription
   */
  static async getSubscription(): Promise<Subscription | null> {
    const client = supabaseService.getClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;

    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
    }

    return data;
  }

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null && ['active', 'trialing'].includes(subscription.status);
  }

  /**
   * Get subscription tier from profile
   */
  static async getSubscriptionTier(): Promise<'free' | 'pro' | 'enterprise'> {
    const client = supabaseService.getClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return 'free';

    const { data: profile } = await client
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    return (profile?.subscription_tier as 'free' | 'pro' | 'enterprise') || 'free';
  }

  /**
   * Redirect to Stripe checkout
   */
  static async redirectToCheckout(priceId: string): Promise<void> {
    const { url } = await this.createCheckoutSession(priceId);
    if (url) {
      window.location.href = url;
    }
  }

  /**
   * Get billing portal URL for managing subscription
   */
  static async getBillingPortalUrl(): Promise<string> {
    const token = await this.getAuthToken();

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        returnUrl: `${window.location.origin}/settings`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  }
}

export default PaymentService;

