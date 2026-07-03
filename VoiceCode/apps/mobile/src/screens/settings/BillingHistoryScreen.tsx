import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Invoice {
  id: string;
  date: string;
  year: string;
  amount: string;
  status: string;
  description: string;
}

interface BillingHistoryScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
  invoices?: Invoice[];
}

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: '1',
    date: 'January 15, 2024',
    year: '2024',
    amount: '$12.00',
    status: 'Paid',
    description: 'VoiceCode Pro — Monthly',
  },
];

const YEARS = ['2024', '2023'];

const BillingHistoryScreen: React.FC<BillingHistoryScreenProps> = ({
  navigation,
  invoices = DEFAULT_INVOICES,
}) => {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const visibleInvoices = useMemo(
    () => (selectedYear ? invoices.filter((i) => i.year === selectedYear) : invoices),
    [invoices, selectedYear]
  );

  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    setShowYearFilter(false);
  };

  const handleDownload = (invoice: Invoice) => {
    setDownloadStatus(`Downloading invoice ${invoice.date}…`);
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <View style={styles.invoiceCard}>
      <TouchableOpacity
        style={styles.invoiceMain}
        onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
        testID={`invoice-${item.id}`}
      >
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceDate}>{item.date}</Text>
          <Text style={styles.invoiceDescription}>{item.description}</Text>
        </View>
        <View style={styles.invoiceMeta}>
          <Text style={styles.invoiceAmount}>{item.amount}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() => handleDownload(item)}
        testID={`download-invoice-${item.id}`}
      >
        <Ionicons name="download-outline" size={18} color="#667eea" />
        <Text style={styles.downloadText}>Download</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container} testID="billing-history-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Billing History</Text>
        <Text style={styles.subtitle}>
          No invoices are ever deleted — this is your complete billing history.
        </Text>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowYearFilter((v) => !v)}
          testID="year-filter"
        >
          <Ionicons name="calendar-outline" size={16} color="#667eea" />
          <Text style={styles.filterText}>
            {selectedYear ? `Year: ${selectedYear}` : 'Filter by year'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#667eea" />
        </TouchableOpacity>
        {showYearFilter ? (
          <View style={styles.yearOptions}>
            {YEARS.map((year) => (
              <TouchableOpacity
                key={year}
                style={styles.yearOption}
                onPress={() => handleSelectYear(year)}
                testID={`year-option-${year}`}
              >
                <Text style={styles.yearOptionText}>{year}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      <FlatList
        testID="invoice-list"
        data={visibleInvoices}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoice}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#bbb" />
            <Text style={styles.emptyTitle}>No invoices yet</Text>
            <Text style={styles.emptyBody}>
              Your invoices will appear here after your first payment.
            </Text>
          </View>
        }
      />

      {downloadStatus ? (
        <Text style={styles.downloadStatus} testID="download-status">
          {downloadStatus}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 6 },
  filterBar: { paddingHorizontal: 16, paddingBottom: 8 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eef0ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { color: '#667eea', fontSize: 14, fontWeight: '600', marginHorizontal: 6 },
  yearOptions: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  yearOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  yearOptionText: { fontSize: 15, color: '#333' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    overflow: 'hidden',
  },
  invoiceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  invoiceInfo: { flex: 1, paddingRight: 12 },
  invoiceDate: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  invoiceDescription: { fontSize: 13, color: '#888', marginTop: 2 },
  invoiceMeta: { alignItems: 'flex-end' },
  invoiceAmount: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusText: { fontSize: 12, color: '#22c55e', marginLeft: 4, fontWeight: '600' },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  downloadText: { color: '#667eea', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 12 },
  emptyBody: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 6 },
  downloadStatus: {
    color: '#667eea',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default BillingHistoryScreen;
