import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
  successRate: number;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  permissions: string[];
}

const WebhooksAPIScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'webhooks' | 'api'>('webhooks');

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: '1', name: 'Transcript Complete', url: 'https://api.myapp.com/webhooks/transcript', events: ['transcript.complete'], isActive: true, lastTriggered: '2 hours ago', successRate: 99 },
    { id: '2', name: 'Recording Started', url: 'https://hooks.zapier.com/...', events: ['recording.start', 'recording.end'], isActive: true, lastTriggered: 'Yesterday', successRate: 100 },
    { id: '3', name: 'AI Summary Ready', url: 'https://n8n.myserver.com/webhook/...', events: ['summary.complete'], isActive: false, successRate: 85 },
  ]);

  const apiKeys: APIKey[] = [
    { id: '1', name: 'Production API', key: 'vk_live_xxxxx...xxxxx', created: 'Jan 1, 2026', lastUsed: 'Today', permissions: ['read', 'write'] },
    { id: '2', name: 'Development', key: 'vk_test_xxxxx...xxxxx', created: 'Dec 15, 2025', lastUsed: 'Yesterday', permissions: ['read', 'write', 'admin'] },
    { id: '3', name: 'Read Only', key: 'vk_ro_xxxxx...xxxxx', created: 'Nov 20, 2025', lastUsed: 'Last week', permissions: ['read'] },
  ];

  const eventTypes = [
    { id: 'recording.start', label: 'Recording Started' },
    { id: 'recording.end', label: 'Recording Ended' },
    { id: 'transcript.complete', label: 'Transcript Complete' },
    { id: 'summary.complete', label: 'AI Summary Ready' },
    { id: 'action_items.extracted', label: 'Action Items Extracted' },
    { id: 'share.created', label: 'Document Shared' },
  ];

  const toggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(wh =>
      wh.id === id ? { ...wh, isActive: !wh.isActive } : wh
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Webhooks & API</Text>
        <TouchableOpacity style={styles.docsButton}>
          <Ionicons name="book-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'webhooks' && styles.tabActive]}
          onPress={() => setSelectedTab('webhooks')}
        >
          <Ionicons name="link" size={18} color={selectedTab === 'webhooks' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabText, selectedTab === 'webhooks' && styles.tabTextActive]}>Webhooks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'api' && styles.tabActive]}
          onPress={() => setSelectedTab('api')}
        >
          <Ionicons name="key" size={18} color={selectedTab === 'api' ? '#007AFF' : '#8E8E93'} />
          <Text style={[styles.tabText, selectedTab === 'api' && styles.tabTextActive]}>API Keys</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'webhooks' ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Webhooks</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={18} color="#007AFF" />
                  <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
              </View>

              {webhooks.map(webhook => (
                <View key={webhook.id} style={styles.webhookCard}>
                  <View style={styles.webhookHeader}>
                    <View style={styles.webhookInfo}>
                      <Text style={styles.webhookName}>{webhook.name}</Text>
                      <Text style={styles.webhookUrl} numberOfLines={1}>{webhook.url}</Text>
                    </View>
                    <Switch
                      value={webhook.isActive}
                      onValueChange={() => toggleWebhook(webhook.id)}
                      trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                      thumbColor="#FFF"
                    />
                  </View>
                  <View style={styles.webhookEvents}>
                    {webhook.events.map((event, idx) => (
                      <View key={idx} style={styles.eventTag}>
                        <Text style={styles.eventTagText}>{event}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.webhookFooter}>
                    <View style={styles.webhookMeta}>
                      {webhook.lastTriggered && (
                        <>
                          <Ionicons name="time" size={12} color="#8E8E93" />
                          <Text style={styles.metaText}>{webhook.lastTriggered}</Text>
                        </>
                      )}
                    </View>
                    <View style={[styles.successBadge, { backgroundColor: webhook.successRate >= 95 ? '#34C75920' : '#FF950020' }]}>
                      <Text style={[styles.successText, { color: webhook.successRate >= 95 ? '#34C759' : '#FF9500' }]}>
                        {webhook.successRate}% success
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Events</Text>
              <View style={styles.eventsCard}>
                {eventTypes.map((event, idx) => (
                  <View key={event.id}>
                    <View style={styles.eventRow}>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventLabel}>{event.label}</Text>
                        <Text style={styles.eventId}>{event.id}</Text>
                      </View>
                      <TouchableOpacity style={styles.copyButton}>
                        <Ionicons name="copy" size={16} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                    {idx < eventTypes.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>API Keys</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={18} color="#007AFF" />
                  <Text style={styles.addText}>Create</Text>
                </TouchableOpacity>
              </View>

              {apiKeys.map(key => (
                <View key={key.id} style={styles.apiKeyCard}>
                  <View style={styles.keyHeader}>
                    <View style={styles.keyIcon}>
                      <Ionicons name="key" size={20} color="#AF52DE" />
                    </View>
                    <View style={styles.keyInfo}>
                      <Text style={styles.keyName}>{key.name}</Text>
                      <Text style={styles.keyValue}>{key.key}</Text>
                    </View>
                    <TouchableOpacity style={styles.keyActions}>
                      <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.keyMeta}>
                    <View style={styles.permissionTags}>
                      {key.permissions.map((perm, idx) => (
                        <View key={idx} style={styles.permTag}>
                          <Text style={styles.permTagText}>{perm}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.keyDate}>Last used: {key.lastUsed}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>API Usage</Text>
              <View style={styles.usageCard}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageTitle}>This Month</Text>
                  <Text style={styles.usageValue}>12,450 / 50,000 requests</Text>
                </View>
                <View style={styles.usageBar}>
                  <View style={[styles.usageFill, { width: '25%' }]} />
                </View>
                <View style={styles.usageStats}>
                  <View style={styles.usageStat}>
                    <Text style={styles.statValue}>99.9%</Text>
                    <Text style={styles.statLabel}>Uptime</Text>
                  </View>
                  <View style={styles.usageStat}>
                    <Text style={styles.statValue}>45ms</Text>
                    <Text style={styles.statLabel}>Avg Latency</Text>
                  </View>
                  <View style={styles.usageStat}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Errors</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.docsLink}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <Text style={styles.docsLinkText}>View API Documentation</Text>
              <Ionicons name="open-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  docsButton: { padding: 4 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#007AFF15' },
  tabText: { fontSize: 14, color: '#8E8E93', marginLeft: 6 },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 },
  addButton: { flexDirection: 'row', alignItems: 'center' },
  addText: { fontSize: 14, color: '#007AFF', marginLeft: 4 },
  webhookCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  webhookHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  webhookInfo: { flex: 1 },
  webhookName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  webhookUrl: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  webhookEvents: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  eventTag: { backgroundColor: '#007AFF15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 4 },
  eventTagText: { fontSize: 12, color: '#007AFF', fontFamily: 'Courier' },
  webhookFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  webhookMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  successBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  successText: { fontSize: 12, fontWeight: '500' },
  eventsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  eventRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  eventInfo: { flex: 1 },
  eventLabel: { fontSize: 15, color: '#1C1C1E' },
  eventId: { fontSize: 12, color: '#8E8E93', fontFamily: 'Courier', marginTop: 2 },
  copyButton: { padding: 8 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  apiKeyCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  keyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  keyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#AF52DE20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  keyInfo: { flex: 1 },
  keyName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  keyValue: { fontSize: 12, color: '#8E8E93', fontFamily: 'Courier', marginTop: 2 },
  keyActions: { padding: 4 },
  keyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  permissionTags: { flexDirection: 'row' },
  permTag: { backgroundColor: '#34C75920', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 6 },
  permTagText: { fontSize: 11, color: '#34C759', fontWeight: '500' },
  keyDate: { fontSize: 12, color: '#8E8E93' },
  usageCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  usageTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  usageValue: { fontSize: 13, color: '#8E8E93' },
  usageBar: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, marginBottom: 16 },
  usageFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  usageStats: { flexDirection: 'row', justifyContent: 'space-around' },
  usageStat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  docsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', marginHorizontal: 16, padding: 14, borderRadius: 14 },
  docsLinkText: { fontSize: 15, color: '#007AFF', marginHorizontal: 8 },
  bottomPadding: { height: 40 },
});

export default WebhooksAPIScreen;
