import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

const AuditLogScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'auth', label: 'Authentication' },
    { id: 'data', label: 'Data Access' },
    { id: 'admin', label: 'Admin' },
    { id: 'security', label: 'Security' },
  ];

  const auditEntries: AuditEntry[] = [
    {
      id: '1',
      action: 'Login Success',
      user: 'sarah@company.com',
      resource: 'Authentication',
      timestamp: '2 min ago',
      ipAddress: '192.168.1.45',
      status: 'success',
    },
    {
      id: '2',
      action: 'Document Accessed',
      user: 'mike@company.com',
      resource: 'Q1 Planning Notes',
      timestamp: '15 min ago',
      ipAddress: '10.0.0.123',
      status: 'success',
      details: 'Viewed transcript for 12 minutes',
    },
    {
      id: '3',
      action: 'Export Downloaded',
      user: 'emily@company.com',
      resource: 'Client Meeting Recording',
      timestamp: '1 hour ago',
      ipAddress: '172.16.0.89',
      status: 'success',
    },
    {
      id: '4',
      action: 'Permission Changed',
      user: 'admin@company.com',
      resource: 'User: alex@company.com',
      timestamp: '2 hours ago',
      ipAddress: '192.168.1.1',
      status: 'warning',
      details: 'Role changed from Viewer to Editor',
    },
    {
      id: '5',
      action: 'Failed Login Attempt',
      user: 'unknown@external.com',
      resource: 'Authentication',
      timestamp: '3 hours ago',
      ipAddress: '203.45.67.89',
      status: 'error',
      details: 'Invalid credentials - 3rd attempt',
    },
    {
      id: '6',
      action: 'API Key Created',
      user: 'admin@company.com',
      resource: 'API Management',
      timestamp: '5 hours ago',
      ipAddress: '192.168.1.1',
      status: 'success',
    },
    {
      id: '7',
      action: 'Recording Deleted',
      user: 'jordan@company.com',
      resource: 'Old Meeting Archive',
      timestamp: 'Yesterday',
      ipAddress: '10.0.0.56',
      status: 'warning',
    },
    {
      id: '8',
      action: 'Password Reset',
      user: 'sarah@company.com',
      resource: 'Account Security',
      timestamp: 'Yesterday',
      ipAddress: '192.168.1.45',
      status: 'success',
    },
  ];

  const getStatusIcon = (status: string): { icon: string; color: string } => {
    switch (status) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#34C759' };
      case 'warning':
        return { icon: 'alert-circle', color: '#FF9500' };
      case 'error':
        return { icon: 'close-circle', color: '#FF3B30' };
      default:
        return { icon: 'information-circle', color: '#8E8E93' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Audit Log</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="calendar-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{auditEntries.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>
            {auditEntries.filter(e => e.status === 'success').length}
          </Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>
            {auditEntries.filter(e => e.status === 'warning').length}
          </Text>
          <Text style={styles.statLabel}>Warnings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>
            {auditEntries.filter(e => e.status === 'error').length}
          </Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
      </View>

      <ScrollView style={styles.logsList} showsVerticalScrollIndicator={false}>
        {auditEntries.map(entry => {
          const statusInfo = getStatusIcon(entry.status);
          const isExpanded = expandedEntry === entry.id;

          return (
            <TouchableOpacity
              key={entry.id}
              style={styles.logEntry}
              onPress={() => setExpandedEntry(isExpanded ? null : entry.id)}
            >
              <View style={styles.entryHeader}>
                <View style={[styles.statusIcon, { backgroundColor: statusInfo.color + '20' }]}>
                  <Ionicons name={statusInfo.icon as any} size={18} color={statusInfo.color} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.actionText}>{entry.action}</Text>
                  <Text style={styles.resourceText}>{entry.resource}</Text>
                </View>
                <View style={styles.entryMeta}>
                  <Text style={styles.timestamp}>{entry.timestamp}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#8E8E93"
                  />
                </View>
              </View>

              {isExpanded && (
                <View style={styles.entryDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User</Text>
                    <Text style={styles.detailValue}>{entry.user}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IP Address</Text>
                    <Text style={styles.detailValue}>{entry.ipAddress}</Text>
                  </View>
                  {entry.details && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Details</Text>
                      <Text style={styles.detailValue}>{entry.details}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

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
  exportButton: { padding: 4 },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 8 },
  filterButton: { padding: 10, marginLeft: 8 },
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#8E8E93' },
  filterTextActive: { color: '#FFF', fontWeight: '500' },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E5EA' },
  logsList: { flex: 1, padding: 16 },
  logEntry: { backgroundColor: '#FFF', borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryInfo: { flex: 1 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  resourceText: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  entryMeta: { alignItems: 'flex-end' },
  timestamp: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  entryDetails: {
    backgroundColor: '#F9F9FB',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: '#8E8E93' },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  bottomPadding: { height: 40 },
});

export default AuditLogScreen;
