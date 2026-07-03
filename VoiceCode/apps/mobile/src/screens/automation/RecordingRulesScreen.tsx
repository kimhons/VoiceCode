import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface RecordingRule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  action: string;
  enabled: boolean;
}

const RecordingRulesScreen: React.FC = () => {
  const [rules, setRules] = useState<RecordingRule[]>([
    {
      id: '1',
      name: 'Client Meetings',
      description: 'Auto-record client calls',
      conditions: ['Meeting title contains "Client"', 'External participants present'],
      action: 'Record + Transcribe',
      enabled: true,
    },
    {
      id: '2',
      name: 'One-on-Ones',
      description: 'Skip recording 1:1 meetings',
      conditions: ['2 participants only', 'Internal meeting'],
      action: 'Do not record',
      enabled: true,
    },
    {
      id: '3',
      name: 'All Hands',
      description: 'Record company meetings',
      conditions: ['Title contains "All Hands"', 'More than 10 participants'],
      action: 'Record + Summary',
      enabled: false,
    },
    {
      id: '4',
      name: 'Sales Calls',
      description: 'Auto-record sales meetings',
      conditions: ['Calendar: Sales', 'External participant'],
      action: 'Record + AI Notes',
      enabled: true,
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Recording Rules</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBar}>
        <Ionicons name="information-circle" size={18} color="#007AFF" />
        <Text style={styles.infoText}>
          Rules are evaluated in order. First matching rule applies.
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {rules.map((rule, idx) => (
          <View key={rule.id} style={styles.ruleCard}>
            <View style={styles.ruleHeader}>
              <View style={styles.ruleNumber}>
                <Text style={styles.numberText}>{idx + 1}</Text>
              </View>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleName}>{rule.name}</Text>
                <Text style={styles.ruleDesc}>{rule.description}</Text>
              </View>
              <Switch
                value={rule.enabled}
                onValueChange={() => toggleRule(rule.id)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.conditionsSection}>
              <Text style={styles.conditionsLabel}>When:</Text>
              {rule.conditions.map((condition, cidx) => (
                <View key={cidx} style={styles.conditionRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionSection}>
              <Text style={styles.actionLabel}>Action:</Text>
              <View
                style={[
                  styles.actionBadge,
                  {
                    backgroundColor: rule.action.includes('not') ? '#FF3B3020' : '#34C75920',
                  },
                ]}
              >
                <Ionicons
                  name={rule.action.includes('not') ? 'close-circle' : 'radio-button-on'}
                  size={14}
                  color={rule.action.includes('not') ? '#FF3B30' : '#34C759'}
                />
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: rule.action.includes('not') ? '#FF3B30' : '#34C759',
                    },
                  ]}
                >
                  {rule.action}
                </Text>
              </View>
            </View>

            <View style={styles.ruleActions}>
              <TouchableOpacity style={styles.ruleAction}>
                <Ionicons name="create-outline" size={18} color="#007AFF" />
                <Text style={styles.ruleActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ruleAction}>
                <Ionicons name="copy-outline" size={18} color="#8E8E93" />
                <Text style={[styles.ruleActionText, { color: '#8E8E93' }]}>Duplicate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ruleAction}>
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                <Text style={[styles.ruleActionText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.createRuleButton}>
          <View style={styles.createIcon}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </View>
          <View style={styles.createInfo}>
            <Text style={styles.createTitle}>Create New Rule</Text>
            <Text style={styles.createDesc}>Set conditions for automatic recording</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Behavior</Text>
          <View style={styles.defaultCard}>
            <View style={styles.defaultRow}>
              <View style={styles.defaultInfo}>
                <Text style={styles.defaultLabel}>When no rules match</Text>
                <Text style={styles.defaultDesc}>Default action for meetings</Text>
              </View>
              <TouchableOpacity style={styles.defaultSelect}>
                <Text style={styles.defaultValue}>Ask before recording</Text>
                <Ionicons name="chevron-down" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  addButton: { padding: 4 },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoText: { fontSize: 13, color: '#8E8E93', marginLeft: 8 },
  content: { flex: 1, padding: 16 },
  ruleCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  ruleHeader: { flexDirection: 'row', alignItems: 'center' },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  ruleInfo: { flex: 1 },
  ruleName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  ruleDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  conditionsSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  conditionsLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  conditionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  conditionText: { fontSize: 14, color: '#1C1C1E', marginLeft: 8 },
  actionSection: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginRight: 8 },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionText: { fontSize: 13, fontWeight: '500', marginLeft: 4 },
  ruleActions: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  ruleAction: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  ruleActionText: { fontSize: 13, color: '#007AFF', marginLeft: 4 },
  createRuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createInfo: { flex: 1 },
  createTitle: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  createDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  defaultCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  defaultRow: { flexDirection: 'row', alignItems: 'center' },
  defaultInfo: { flex: 1 },
  defaultLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  defaultDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  defaultSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  defaultValue: { fontSize: 14, color: '#1C1C1E', marginRight: 4 },
  bottomPadding: { height: 40 },
});

export default RecordingRulesScreen;
