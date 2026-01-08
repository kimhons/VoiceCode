// VoiceFlow Pro Mobile - Pricing Screen

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button, Card } from '../../components/common';

const { width } = Dimensions.get('window');

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
      '120 minutes/month',
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
      'UNLIMITED transcription',
      'UNLIMITED recordings',
      '150+ languages',
      'Advanced AI processing',
      'Offline mode',
      'Cloud sync (10GB)',
      'Priority support',
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
      'Team collaboration',
      'Admin dashboard',
      'Cloud sync (50GB/user)',
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
      'SSO/SAML',
      'HIPAA compliance',
      'Custom AI models',
      '24/7 phone support',
      'Unlimited storage',
    ],
    icon: '🏢',
  },
];

export const PricingScreen: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const { theme } = useTheme();
  const navigation = useNavigation();

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" color={theme.colors.textPrimary} style={styles.title}>
            Choose Your Plan
          </Text>
          <Text variant="body" color={theme.colors.textSecondary} style={styles.subtitle}>
            All plans include a 14-day free trial
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={[styles.billingToggle, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingCycle === 'monthly' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text
              variant="body"
              color={billingCycle === 'monthly' ? '#ffffff' : theme.colors.textPrimary}
              style={styles.toggleText}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingCycle === 'annual' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setBillingCycle('annual')}
          >
            <Text
              variant="body"
              color={billingCycle === 'annual' ? '#ffffff' : theme.colors.textPrimary}
              style={styles.toggleText}
            >
              Annual
            </Text>
            <View style={styles.savingsBadge}>
              <Text variant="caption" color="#ffffff" style={styles.savingsText}>
                Save 13%
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pricing Cards */}
        {pricingTiers.map((tier) => {
          const savings = billingCycle === 'annual' ? getSavings(tier) : null;

          return (
            <Card
              key={tier.id}
              style={[
                styles.pricingCard,
                tier.popular && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                },
              ]}
            >
              {tier.popular && (
                <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text variant="caption" color="#ffffff" style={styles.popularText}>
                    MOST POPULAR
                  </Text>
                </View>
              )}

              {/* Icon */}
              <Text style={styles.tierIcon}>{tier.icon}</Text>

              {/* Tier Name */}
              <Text variant="h3" color={theme.colors.textPrimary} style={styles.tierName}>
                {tier.name}
              </Text>

              {/* Description */}
              <Text variant="body" color={theme.colors.textSecondary} style={styles.tierDescription}>
                {tier.description}
              </Text>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text variant="h1" color={theme.colors.textPrimary} style={styles.price}>
                  {getPrice(tier)}
                </Text>
                {tier.id !== 'free' && tier.id !== 'enterprise' && (
                  <Text variant="body" color={theme.colors.textSecondary} style={styles.priceUnit}>
                    /{billingCycle === 'monthly' ? 'mo' : 'mo'}
                  </Text>
                )}
              </View>

              {savings && billingCycle === 'annual' && (
                <Text variant="caption" color="#10b981" style={styles.savingsInfo}>
                  Save ${savings.amount.toFixed(2)}/year ({savings.percentage}% off)
                </Text>
              )}

              {/* CTA Button */}
              <Button
                onPress={() => {
                  // TODO: Navigate to subscription flow
                  console.log(`Selected ${tier.name}`);
                }}
                variant={tier.popular ? 'primary' : 'outline'}
                style={styles.ctaButton}
              >
                {tier.id === 'enterprise' ? 'Contact Sales' : tier.id === 'free' ? 'Get Started' : 'Start Free Trial'}
              </Button>

              {/* Features */}
              <View style={styles.featuresContainer}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Text style={styles.checkmark}>✓</Text>
                    <Text variant="body" color={theme.colors.textPrimary} style={styles.featureText}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          );
        })}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text variant="h2" color={theme.colors.textPrimary} style={styles.faqTitle}>
            Frequently Asked Questions
          </Text>

          {[
            {
              q: 'Can I switch plans at any time?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes! All paid plans include a 14-day free trial. No credit card required.',
            },
          ].map((faq, index) => (
            <Card key={index} style={styles.faqCard}>
              <Text variant="h4" color={theme.colors.textPrimary} style={styles.faqQuestion}>
                {faq.q}
              </Text>
              <Text variant="body" color={theme.colors.textSecondary} style={styles.faqAnswer}>
                {faq.a}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  billingToggle: {
    flexDirection: 'row',
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  toggleText: {
    fontWeight: '600',
  },
  savingsBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pricingCard: {
    marginBottom: 20,
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tierIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  tierName: {
    marginBottom: 8,
  },
  tierDescription: {
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
  },
  priceUnit: {
    marginLeft: 4,
  },
  savingsInfo: {
    marginBottom: 16,
  },
  ctaButton: {
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkmark: {
    color: '#10b981',
    fontSize: 18,
    marginRight: 8,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
  },
  faqSection: {
    marginTop: 32,
  },
  faqTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  faqCard: {
    marginBottom: 12,
    padding: 16,
  },
  faqQuestion: {
    marginBottom: 8,
  },
  faqAnswer: {
    lineHeight: 20,
  },
});

