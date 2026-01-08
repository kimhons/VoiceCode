import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SubscriptionScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.currentPlan}>
        <Text style={styles.currentPlanTitle}>Current Plan</Text>
        <Text style={styles.planName}>Free</Text>
        <Text style={styles.planDetails}>60 minutes/month</Text>
      </View>

      <View style={styles.plans}>
        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Pro</Text>
          <Text style={styles.planCardPrice}>$9.99/month</Text>
          <Text style={styles.planCardFeature}>✓ 600 minutes/month</Text>
          <Text style={styles.planCardFeature}>✓ 30 min max recording</Text>
          <Text style={styles.planCardFeature}>✓ 10GB storage</Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Enterprise</Text>
          <Text style={styles.planCardPrice}>$29.99/month</Text>
          <Text style={styles.planCardFeature}>✓ Unlimited minutes</Text>
          <Text style={styles.planCardFeature}>✓ 2 hour max recording</Text>
          <Text style={styles.planCardFeature}>✓ 100GB storage</Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  currentPlan: { padding: 24, backgroundColor: '#667eea', alignItems: 'center' },
  currentPlanTitle: { fontSize: 14, color: '#ffffff', opacity: 0.8, marginBottom: 8 },
  planName: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  planDetails: { fontSize: 16, color: '#ffffff', opacity: 0.9 },
  plans: { padding: 16 },
  planCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 20, marginBottom: 16 },
  planCardTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  planCardPrice: { fontSize: 20, color: '#667eea', marginBottom: 16 },
  planCardFeature: { fontSize: 14, color: '#666', marginBottom: 8 },
  upgradeButton: { backgroundColor: '#667eea', borderRadius: 8, padding: 12, marginTop: 16, alignItems: 'center' },
  upgradeButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

export default SubscriptionScreen;

