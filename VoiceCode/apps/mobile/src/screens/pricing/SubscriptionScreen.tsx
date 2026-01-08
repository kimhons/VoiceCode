// VoiceFlow Pro Mobile - Subscription Management Screen

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text, Button, Card } from '../../components/common';

interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  billingCycle: 'monthly' | 'annual';
  nextBillingDate?: string;
  trialEndsDate?: string;
  price: number;
  usageStats: {
    minutesUsed: number;
    minutesLimit: number;
    recordingsUsed: number;
    recordingsLimit: number;
  };
}

// Mock subscription data - replace with actual API call
const mockSubscription: SubscriptionInfo = {
  plan: 'pro',
  status: 'active',
  billingCycle: 'monthly',
  nextBillingDate: '2025-11-25',
  price: 7.99,
  usageStats: {
    minutesUsed: 450,
    minutesLimit: -1, // -1 means unlimited
    recordingsUsed: 87,
    recordingsLimit: -1,
  },
};

export const SubscriptionScreen: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo>(mockSubscription);
  const { theme } = useTheme();
  const navigation = useNavigation();

  const getPlanName = (plan: string) => {
    const names = {
      free: 'Free Forever',
      pro: 'Pro',
      team: 'Team',
      enterprise: 'Enterprise',
    };
    return names[plan as keyof typeof names] || plan;
  };

  const getPlanIcon = (plan: string) => {
    const icons = {
      free: '✨',
      pro: '🚀',
      team: '👥',
      enterprise: '🏢',
    };
    return icons[plan as keyof typeof icons] || '📦';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: '#10b981',
      trial: '#3b82f6',
      cancelled: '#f59e0b',
      expired: '#ef4444',
    };
    return colors[status as keyof typeof colors] || theme.colors.textSecondary;
  };

  const getStatusText = (status: string) => {
    const texts = {
      active: 'Active',
      trial: 'Trial',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const handleUpgrade = () => {
    // TODO: Navigate to pricing screen
    Alert.alert('Upgrade Plan', 'Navigate to pricing screen to upgrade your plan.');
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to cancel subscription
            Alert.alert('Success', 'Your subscription has been cancelled.');
          },
        },
      ]
    );
  };

  const handleManageBilling = () => {
    // TODO: Open Stripe billing portal
    Alert.alert('Manage Billing', 'Opening billing portal...');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current Plan Card */}
        <Card style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.planIcon}>{getPlanIcon(subscription.plan)}</Text>
              <View>
                <Text variant="h3" color={theme.colors.textPrimary}>
                  {getPlanName(subscription.plan)}
                </Text>
                <View style={styles.statusBadge}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(subscription.status) }
                    ]} 
                  />
                  <Text 
                    variant="caption" 
                    color={getStatusColor(subscription.status)}
                    style={styles.statusText}
                  >
                    {getStatusText(subscription.status)}
                  </Text>
                </View>
              </View>
            </View>
            {subscription.plan !== 'free' && (
              <View style={styles.priceContainer}>
                <Text variant="h2" color={theme.colors.textPrimary}>
                  ${subscription.price}
                </Text>
                <Text variant="caption" color={theme.colors.textSecondary}>
                  /{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
                </Text>
              </View>
            )}
          </View>

          {subscription.nextBillingDate && (
            <View style={styles.billingInfo}>
              <Text variant="body" color={theme.colors.textSecondary}>
                Next billing date: {formatDate(subscription.nextBillingDate)}
              </Text>
            </View>
          )}

          {subscription.trialEndsDate && (
            <View style={[styles.trialBanner, { backgroundColor: '#3b82f6' }]}>
              <Text variant="body" color="#ffffff">
                Trial ends on {formatDate(subscription.trialEndsDate)}
              </Text>
            </View>
          )}
        </Card>

        {/* Usage Stats */}
        <Card style={styles.usageCard}>
          <Text variant="h3" color={theme.colors.textPrimary} style={styles.sectionTitle}>
            Usage This Month
          </Text>

          {/* Minutes Used */}
          <View style={styles.usageItem}>
            <View style={styles.usageHeader}>
              <Text variant="body" color={theme.colors.textPrimary}>
                Transcription Minutes
              </Text>
              <Text variant="body" color={theme.colors.textPrimary} style={styles.usageValue}>
                {subscription.usageStats.minutesUsed}
                {subscription.usageStats.minutesLimit === -1 
                  ? ' / Unlimited' 
                  : ` / ${subscription.usageStats.minutesLimit}`}
              </Text>
            </View>
            {subscription.usageStats.minutesLimit !== -1 && (
              <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getUsagePercentage(
                        subscription.usageStats.minutesUsed, 
                        subscription.usageStats.minutesLimit
                      )}%`,
                      backgroundColor: theme.colors.primary,
                    }
                  ]} 
                />
              </View>
            )}
          </View>

          {/* Recordings Used */}
          <View style={styles.usageItem}>
            <View style={styles.usageHeader}>
              <Text variant="body" color={theme.colors.textPrimary}>
                Recordings
              </Text>
              <Text variant="body" color={theme.colors.textPrimary} style={styles.usageValue}>
                {subscription.usageStats.recordingsUsed}
                {subscription.usageStats.recordingsLimit === -1 
                  ? ' / Unlimited' 
                  : ` / ${subscription.usageStats.recordingsLimit}`}
              </Text>
            </View>
            {subscription.usageStats.recordingsLimit !== -1 && (
              <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${getUsagePercentage(
                        subscription.usageStats.recordingsUsed, 
                        subscription.usageStats.recordingsLimit
                      )}%`,
                      backgroundColor: theme.colors.primary,
                    }
                  ]} 
                />
              </View>
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {subscription.plan === 'free' && (
            <Button
              onPress={handleUpgrade}
              variant="primary"
              style={styles.actionButton}
            >
              Upgrade to Pro
            </Button>
          )}

          {subscription.plan !== 'free' && subscription.plan !== 'enterprise' && (
            <>
              <Button
                onPress={handleManageBilling}
                variant="outline"
                style={styles.actionButton}
              >
                Manage Billing
              </Button>
              <Button
                onPress={handleUpgrade}
                variant="outline"
                style={styles.actionButton}
              >
                Change Plan
              </Button>
              {subscription.status === 'active' && (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelSubscription}
                >
                  <Text variant="body" color="#ef4444">
                    Cancel Subscription
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {subscription.plan === 'enterprise' && (
            <Button
              onPress={() => Alert.alert('Contact', 'Opening email to your account manager...')}
              variant="outline"
              style={styles.actionButton}
            >
              Contact Account Manager
            </Button>
          )}
        </View>

        {/* Benefits Section */}
        <Card style={styles.benefitsCard}>
          <Text variant="h3" color={theme.colors.textPrimary} style={styles.sectionTitle}>
            Your Benefits
          </Text>
          {subscription.plan === 'free' ? (
            <>
              <BenefitItem icon="✓" text="120 minutes/month transcription" />
              <BenefitItem icon="✓" text="10 recordings/month" />
              <BenefitItem icon="✓" text="50+ languages" />
              <BenefitItem icon="✓" text="Basic AI formatting" />
            </>
          ) : subscription.plan === 'pro' ? (
            <>
              <BenefitItem icon="✓" text="UNLIMITED transcription minutes" />
              <BenefitItem icon="✓" text="UNLIMITED recordings" />
              <BenefitItem icon="✓" text="150+ languages" />
              <BenefitItem icon="✓" text="Advanced AI processing" />
              <BenefitItem icon="✓" text="Offline mode" />
              <BenefitItem icon="✓" text="Priority support" />
            </>
          ) : null}
        </Card>
      </ScrollView>
    </View>
  );
};

const BenefitItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.benefitItem}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <Text variant="body" color={theme.colors.textPrimary}>
        {text}
      </Text>
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
  planCard: {
    padding: 20,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIcon: {
    fontSize: 40,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  billingInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  trialBanner: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  usageCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageValue: {
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  benefitsCard: {
    padding: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    color: '#10b981',
    fontSize: 18,
    marginRight: 12,
    fontWeight: '700',
  },
});

