// Payment Service for VoiceCode PRO Mobile App
import { initStripe, presentPaymentSheet, confirmPayment } from '@stripe/stripe-react-native';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || '';
const SUPABASE_FUNCTIONS_URL = Constants.expoConfig?.extra?.supabaseUrl + '/functions/v1';
const MERCHANT_ID = Constants.expoConfig?.extra?.merchantId || 'merchant.com.VoiceCodepro';

export interface PaymentSheetParams {
  paymentIntentClientSecret: string;
  merchantDisplayName: string;
  customerId?: string;
  customerEphemeralKeySecret?: string;
  applePay?: {
    merchantCountryCode: string;
  };
  googlePay?: {
    merchantCountryCode: string;
    testEnv: boolean;
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

class PaymentService {
  private initialized = false;

  /**
   * Initialize Stripe SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: MERCHANT_ID,
      urlScheme: 'VoiceCode',
    });

    this.initialized = true;
  }

  /**
   * Get auth token for API calls
   */
  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    return session.access_token;
  }

  /**
   * Create checkout session and open web browser
   */
  async createCheckoutSession(priceId: string): Promise<string> {
    const token = await this.getAuthToken();

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl: 'VoiceCode://payment-success',
        cancelUrl: 'VoiceCode://payment-canceled',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
  }

  /**
   * Create payment intent for payment sheet
   */
  async createPaymentIntent(amount: number): Promise<{ clientSecret: string }> {
    const token = await this.getAuthToken();

    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, currency: 'usd' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return response.json();
  }

  /**
   * Present payment sheet for one-time payment
   */
  async presentPaymentSheet(clientSecret: string): Promise<{ error?: string }> {
    await this.initialize();

    const { error } = await presentPaymentSheet();

    if (error) {
      return { error: error.message };
    }

    return {};
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<Subscription | null> {
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

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
    }

    return data;
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null && ['active', 'trialing'].includes(subscription.status);
  }

  /**
   * Get subscription tier
   */
  async getSubscriptionTier(): Promise<'free' | 'pro' | 'enterprise'> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'free';

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    return (profile?.subscription_tier as 'free' | 'pro' | 'enterprise') || 'free';
  }
}

export const paymentService = new PaymentService();
export default paymentService;

