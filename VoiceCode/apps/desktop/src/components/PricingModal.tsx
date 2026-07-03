// VoiceFlow Pro Desktop - Pricing Modal Component

import React, { useState } from 'react';
import './PricingModal.css';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BillingCycle = 'monthly' | 'annual';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: string[];
  popular?: boolean;
  icon: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free Forever',
    description: 'Perfect for trying out VoiceFlow Pro',
    price: { monthly: 0, annual: 0 },
    features: [
      '120 minutes/month transcription',
      '10 recordings/month',
      '50+ languages',
      'Basic AI formatting',
      'Desktop + Mobile apps',
      'Export to TXT, PDF',
    ],
    icon: '✨',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users who need unlimited',
    price: { monthly: 7.99, annual: 6.99 },
    features: [
      'UNLIMITED transcription minutes',
      'UNLIMITED recordings',
      '150+ languages',
      'Advanced AI processing',
      'Offline mode (full functionality)',
      'Cloud sync (10GB storage)',
      'Priority email support',
    ],
    popular: true,
    icon: '🚀',
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For teams that need collaboration',
    price: { monthly: 14.99, annual: 12.99 },
    features: [
      'Everything in Pro',
      'Shared workspaces',
      'Team collaboration tools',
      'Admin dashboard & analytics',
      'Cloud sync (50GB per user)',
      'Priority chat support',
    ],
    icon: '👥',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations with advanced needs',
    price: { monthly: 0, annual: 0 },
    features: [
      'Everything in Team',
      'SSO/SAML authentication',
      'HIPAA compliance',
      'Custom AI model training',
      '24/7 phone support',
      'Unlimited cloud storage',
    ],
    icon: '🏢',
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  if (!isOpen) return null;

  const getPrice = (tier: PricingTier) => {
    if (tier.id === 'enterprise') return 'Custom';
    const price = billingCycle === 'monthly' ? tier.price.monthly : tier.price.annual;
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.id === 'free' || tier.id === 'enterprise') return null;
    const monthlyCost = tier.price.monthly * 12;
    const annualCost = tier.price.annual * 12;
    const savings = monthlyCost - annualCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  const handleSelectPlan = (tierId: string) => {
    // TODO: Implement plan selection logic
    console.log(`Selected plan: ${tierId}`);
    alert(`You selected the ${tierId} plan. Payment integration coming soon!`);
  };

  return (
    <div className="pricing-modal-overlay" onClick={onClose}>
      <div className="pricing-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="pricing-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="pricing-modal-header">
          <h1>Choose Your Plan</h1>
          <p>All plans include a 14-day free trial. No credit card required.</p>
        </div>

        {/* Billing Toggle */}
        <div className="billing-toggle">
          <button
            className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`billing-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="savings-badge">Save 13%</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-cards-grid">
          {pricingTiers.map((tier) => {
            const savings = billingCycle === 'annual' ? getSavings(tier) : null;

            return (
              <div
                key={tier.id}
                className={`pricing-card ${tier.popular ? 'popular' : ''}`}
              >
                {tier.popular && (
                  <div className="popular-badge">MOST POPULAR</div>
                )}

                <div className="pricing-card-icon">{tier.icon}</div>
                <h3 className="pricing-card-name">{tier.name}</h3>
                <p className="pricing-card-description">{tier.description}</p>

                <div className="pricing-card-price">
                  <span className="price-amount">{getPrice(tier)}</span>
                  {tier.id !== 'free' && tier.id !== 'enterprise' && (
                    <span className="price-unit">
                      /{billingCycle === 'monthly' ? 'mo' : 'mo'}
                    </span>
                  )}
                </div>

                {savings && billingCycle === 'annual' && (
                  <p className="savings-info">
                    Save ${savings.amount.toFixed(2)}/year ({savings.percentage}% off)
                  </p>
                )}

                <button
                  className={`pricing-card-cta ${tier.popular ? 'primary' : 'secondary'}`}
                  onClick={() => handleSelectPlan(tier.id)}
                >
                  {tier.id === 'enterprise'
                    ? 'Contact Sales'
                    : tier.id === 'free'
                    ? 'Get Started'
                    : 'Start Free Trial'}
                </button>

                <ul className="pricing-card-features">
                  {tier.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-checkmark">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="pricing-faq">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Can I switch plans at any time?</h4>
              <p>
                Yes! You can upgrade or downgrade your plan at any time. Changes take
                effect immediately.
              </p>
            </div>
            <div className="faq-item">
              <h4>What payment methods do you accept?</h4>
              <p>
                We accept all major credit cards (Visa, Mastercard, American Express)
                and PayPal.
              </p>
            </div>
            <div className="faq-item">
              <h4>Is there a free trial?</h4>
              <p>
                Yes! All paid plans include a 14-day free trial. No credit card
                required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

