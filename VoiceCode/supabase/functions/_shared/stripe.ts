// Stripe client for Edge Functions
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Price IDs for different tiers
export const PRICE_IDS = {
  pro_monthly: Deno.env.get('STRIPE_PRO_MONTHLY_PRICE_ID') ?? '',
  pro_yearly: Deno.env.get('STRIPE_PRO_YEARLY_PRICE_ID') ?? '',
  enterprise_monthly: Deno.env.get('STRIPE_ENTERPRISE_MONTHLY_PRICE_ID') ?? '',
  enterprise_yearly: Deno.env.get('STRIPE_ENTERPRISE_YEARLY_PRICE_ID') ?? '',
};

// Convert cents to dollars for display
export function formatAmount(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

