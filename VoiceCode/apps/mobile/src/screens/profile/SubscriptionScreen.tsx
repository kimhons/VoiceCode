import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

type BillingCycle = 'monthly' | 'yearly';

const USAGE = { minutesUsed: 42, minutesLimit: 60 };

const SubscriptionScreen: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [activated, setActivated] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [restored, setRestored] = useState(false);

  const handleSubscribe = () => setShowPaymentSheet(true);

  const handleConfirmPayment = () => {
    setShowPaymentSheet(false);
    setActivated(true);
  };

  const handleCancel = () => setShowCancelConfirm(true);

  const handleRestore = () => setRestored(true);

  return (
    <ScrollView style={styles.container} testID="subscription-screen">
      <View style={styles.currentPlan}>
        <Text style={styles.currentPlanTitle}>Current Plan</Text>
        <Text style={styles.planName}>Free</Text>
        <Text style={styles.planDetails}>60 minutes/month</Text>
        <View style={styles.currentBadge} testID="current-plan-indicator">
          <Text style={styles.currentBadgeText}>Current</Text>
        </View>
      </View>

      <View style={styles.billingToggle}>
        <TouchableOpacity
          testID="billing-monthly"
          style={[styles.billingOption, billingCycle === 'monthly' && styles.billingOptionActive]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={styles.billingOptionText}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="billing-yearly"
          style={[styles.billingOption, billingCycle === 'yearly' && styles.billingOptionActive]}
          onPress={() => setBillingCycle('yearly')}
        >
          <Text style={styles.billingOptionText}>Yearly</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.plans}>
        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Pro</Text>
          <Text style={styles.planCardPrice}>$9.99/month</Text>
          <Text style={styles.planCardFeature}>✓ 600 minutes/month</Text>
          <Text style={styles.planCardFeature}>✓ 30 min max recording</Text>
          <Text style={styles.planCardFeature}>✓ 10GB storage</Text>
          <TouchableOpacity
            testID="select-pro"
            style={[styles.selectButton, selectedPlan === 'pro' && styles.selectButtonActive]}
            onPress={() => setSelectedPlan('pro')}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Enterprise</Text>
          <Text style={styles.planCardPrice}>$29.99/month</Text>
          <Text style={styles.planCardFeature}>✓ Unlimited transcriptions</Text>
          <Text style={styles.planCardFeature}>✓ 2 hour max recording</Text>
          <Text style={styles.planCardFeature}>✓ 100GB storage</Text>
          <TouchableOpacity
            testID="select-enterprise"
            style={[styles.selectButton, selectedPlan === 'enterprise' && styles.selectButtonActive]}
            onPress={() => setSelectedPlan('enterprise')}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity testID="subscribe-button" style={styles.subscribeButton} onPress={handleSubscribe}>
        <Text style={styles.subscribeButtonText}>Subscribe</Text>
      </TouchableOpacity>

      <View style={styles.usage} testID="usage-summary">
        <Text style={styles.usageTitle}>Usage This Month</Text>
        <Text style={styles.usageText}>
          {USAGE.minutesUsed} of {USAGE.minutesLimit} minutes used
        </Text>
      </View>

      <TouchableOpacity testID="cancel-subscription" style={styles.secondaryButton} onPress={handleCancel}>
        <Text style={styles.secondaryButtonText}>Cancel Subscription</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="restore-purchases" style={styles.secondaryButton} onPress={handleRestore}>
        <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
      </TouchableOpacity>

      {showPaymentSheet && (
        <View style={styles.paymentSheet} testID="payment-sheet">
          <Text style={styles.paymentTitle}>Payment Details</Text>
          <TouchableOpacity testID="confirm-payment" style={styles.confirmButton} onPress={handleConfirmPayment}>
            <Text style={styles.confirmButtonText}>Confirm Payment</Text>
          </TouchableOpacity>
        </View>
      )}

      {activated && <Text style={styles.statusText}>Subscription activated</Text>}

      {showCancelConfirm && (
        <View style={styles.cancelConfirm} testID="cancel-confirm">
          <Text style={styles.statusText}>Are you sure you want to cancel?</Text>
        </View>
      )}

      {restored && <Text style={styles.statusText}>Purchases restored</Text>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  currentPlan: { padding: 24, backgroundColor: '#667eea', alignItems: 'center' },
  currentPlanTitle: { fontSize: 14, color: '#ffffff', opacity: 0.8, marginBottom: 8 },
  planName: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  planDetails: { fontSize: 16, color: '#ffffff', opacity: 0.9 },
  currentBadge: { marginTop: 12, backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  currentBadgeText: { color: '#667eea', fontSize: 12, fontWeight: '700' },
  billingToggle: { flexDirection: 'row', margin: 16, borderRadius: 8, backgroundColor: '#f0f0f0', padding: 4 },
  billingOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  billingOptionActive: { backgroundColor: '#ffffff' },
  billingOptionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  plans: { padding: 16 },
  planCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 20, marginBottom: 16 },
  planCardTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  planCardPrice: { fontSize: 20, color: '#667eea', marginBottom: 16 },
  planCardFeature: { fontSize: 14, color: '#666', marginBottom: 8 },
  selectButton: { backgroundColor: '#667eea', borderRadius: 8, padding: 12, marginTop: 16, alignItems: 'center' },
  selectButtonActive: { backgroundColor: '#4c51bf' },
  selectButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  subscribeButton: { backgroundColor: '#667eea', borderRadius: 8, padding: 16, marginHorizontal: 16, alignItems: 'center' },
  subscribeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  usage: { padding: 20, margin: 16, backgroundColor: '#f9f9f9', borderRadius: 12 },
  usageTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  usageText: { fontSize: 14, color: '#666' },
  secondaryButton: { padding: 16, marginHorizontal: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#667eea', fontSize: 15, fontWeight: '600' },
  paymentSheet: { padding: 20, margin: 16, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  paymentTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16 },
  confirmButton: { backgroundColor: '#10b981', borderRadius: 8, padding: 14, alignItems: 'center' },
  confirmButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#10b981', textAlign: 'center', margin: 16 },
  cancelConfirm: { padding: 16, marginHorizontal: 16, backgroundColor: '#fff7ed', borderRadius: 12 },
});

export default SubscriptionScreen;
