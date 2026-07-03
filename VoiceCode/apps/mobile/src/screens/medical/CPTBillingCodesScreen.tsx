import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface CPTCode {
  code: string;
  description: string;
  category: string;
  subcategory: string;
  rvuWork: number;
  rvuPractice: number;
  rvuMalpractice: number;
  totalRVU: number;
  estimatedReimbursement: number;
  isSelected: boolean;
  isFavorite: boolean;
  frequency: number;
  modifiers?: string[];
}

interface CPTCategory {
  id: string;
  name: string;
  range: string;
  color: string;
  icon: string;
}

const CPTBillingCodesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCodeDetail, setShowCodeDetail] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CPTCode | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'suggested' | 'all' | 'favorites'>('suggested');

  const categories: CPTCategory[] = [
    { id: 'eval', name: 'E/M', range: '99201-99499', color: '#007AFF', icon: 'clipboard' },
    { id: 'surgery', name: 'Surgery', range: '10004-69990', color: '#FF3B30', icon: 'cut' },
    { id: 'radiology', name: 'Radiology', range: '70010-79999', color: '#FF9500', icon: 'scan' },
    { id: 'pathology', name: 'Pathology', range: '80047-89398', color: '#34C759', icon: 'flask' },
    { id: 'medicine', name: 'Medicine', range: '90281-99607', color: '#5856D6', icon: 'medkit' },
  ];

  const suggestedCodes: CPTCode[] = [
    {
      code: '99213',
      description: 'Office/outpatient visit, established patient, low complexity',
      category: 'E/M',
      subcategory: 'Office Visit',
      rvuWork: 1.3,
      rvuPractice: 1.08,
      rvuMalpractice: 0.07,
      totalRVU: 2.45,
      estimatedReimbursement: 89.5,
      isSelected: false,
      isFavorite: true,
      frequency: 1580,
    },
    {
      code: '99214',
      description: 'Office/outpatient visit, established patient, moderate complexity',
      category: 'E/M',
      subcategory: 'Office Visit',
      rvuWork: 1.92,
      rvuPractice: 1.52,
      rvuMalpractice: 0.1,
      totalRVU: 3.54,
      estimatedReimbursement: 129.25,
      isSelected: false,
      isFavorite: true,
      frequency: 2340,
    },
    {
      code: '99215',
      description: 'Office/outpatient visit, established patient, high complexity',
      category: 'E/M',
      subcategory: 'Office Visit',
      rvuWork: 2.8,
      rvuPractice: 1.99,
      rvuMalpractice: 0.14,
      totalRVU: 4.93,
      estimatedReimbursement: 180.0,
      isSelected: false,
      isFavorite: false,
      frequency: 890,
    },
  ];

  const allCodes: CPTCode[] = [
    ...suggestedCodes,
    {
      code: '99202',
      description: 'Office/outpatient visit, new patient, straightforward',
      category: 'E/M',
      subcategory: 'Office Visit',
      rvuWork: 0.93,
      rvuPractice: 0.94,
      rvuMalpractice: 0.06,
      totalRVU: 1.93,
      estimatedReimbursement: 70.5,
      isSelected: false,
      isFavorite: false,
      frequency: 450,
    },
    {
      code: '99203',
      description: 'Office/outpatient visit, new patient, low complexity',
      category: 'E/M',
      subcategory: 'Office Visit',
      rvuWork: 1.6,
      rvuPractice: 1.38,
      rvuMalpractice: 0.09,
      totalRVU: 3.07,
      estimatedReimbursement: 112.0,
      isSelected: false,
      isFavorite: true,
      frequency: 678,
    },
    {
      code: '99204',
      description: 'Office/outpatient visit, new patient, moderate complexity',
      category: 'E/M',
      subcategory: 'Office Visit',
      rvuWork: 2.6,
      rvuPractice: 1.86,
      rvuMalpractice: 0.13,
      totalRVU: 4.59,
      estimatedReimbursement: 167.5,
      isSelected: false,
      isFavorite: false,
      frequency: 534,
    },
    {
      code: '99441',
      description: 'Telephone E/M service, 5-10 minutes',
      category: 'E/M',
      subcategory: 'Telehealth',
      rvuWork: 0.25,
      rvuPractice: 0.25,
      rvuMalpractice: 0.02,
      totalRVU: 0.52,
      estimatedReimbursement: 19.0,
      isSelected: false,
      isFavorite: false,
      frequency: 123,
    },
    {
      code: '99442',
      description: 'Telephone E/M service, 11-20 minutes',
      category: 'E/M',
      subcategory: 'Telehealth',
      rvuWork: 0.5,
      rvuPractice: 0.48,
      rvuMalpractice: 0.03,
      totalRVU: 1.01,
      estimatedReimbursement: 36.85,
      isSelected: false,
      isFavorite: false,
      frequency: 89,
    },
    {
      code: '36415',
      description: 'Routine venipuncture for blood collection',
      category: 'Surgery',
      subcategory: 'Blood Collection',
      rvuWork: 0.0,
      rvuPractice: 0.12,
      rvuMalpractice: 0.01,
      totalRVU: 0.13,
      estimatedReimbursement: 4.75,
      isSelected: false,
      isFavorite: false,
      frequency: 2100,
    },
    {
      code: '81002',
      description: 'Urinalysis, non-automated, without microscopy',
      category: 'Pathology',
      subcategory: 'Lab Tests',
      rvuWork: 0.0,
      rvuPractice: 0.08,
      rvuMalpractice: 0.01,
      totalRVU: 0.09,
      estimatedReimbursement: 3.28,
      isSelected: false,
      isFavorite: false,
      frequency: 890,
    },
  ];

  const modifiers = [
    { code: '25', description: 'Significant, separately identifiable E/M service' },
    { code: '59', description: 'Distinct procedural service' },
    { code: '76', description: 'Repeat procedure by same physician' },
    { code: '77', description: 'Repeat procedure by another physician' },
    { code: 'GT', description: 'Via interactive audio/video telecommunication' },
    { code: '95', description: 'Synchronous telemedicine service' },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const getCategoryColor = (category: string): string => {
    const found = categories.find(c => c.name === category);
    return found?.color || '#666';
  };

  const toggleCodeSelection = (code: string) => {
    setSelectedCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const openCodeDetail = (code: CPTCode) => {
    setSelectedCode(code);
    setShowCodeDetail(true);
  };

  const getTotalReimbursement = (): number => {
    return allCodes
      .filter(code => selectedCodes.includes(code.code))
      .reduce((sum, code) => sum + code.estimatedReimbursement, 0);
  };

  const filteredCodes = allCodes.filter(code => {
    const matchesSearch =
      code.code.includes(searchQuery) ||
      code.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || code.category === categories.find(c => c.id === selectedCategory)?.name;
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'suggested' && suggestedCodes.some(s => s.code === code.code)) ||
      (activeTab === 'favorites' && code.isFavorite);
    return matchesSearch && matchesCategory && matchesTab;
  });

  const renderCodeCard = ({ item }: { item: CPTCode }) => (
    <TouchableOpacity
      style={[styles.codeCard, selectedCodes.includes(item.code) && styles.codeCardSelected]}
      onPress={() => toggleCodeSelection(item.code)}
      onLongPress={() => openCodeDetail(item)}
    >
      <View style={styles.codeHeader}>
        <View style={styles.codeInfo}>
          <Text style={styles.codeText}>{item.code}</Text>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) + '20' },
            ]}
          >
            <Text style={[styles.categoryBadgeText, { color: getCategoryColor(item.category) }]}>
              {item.category}
            </Text>
          </View>
        </View>
        <View style={styles.codeActions}>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons
              name={item.isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={item.isFavorite ? '#FFD60A' : '#CCC'}
            />
          </TouchableOpacity>
          <View
            style={[styles.checkbox, selectedCodes.includes(item.code) && styles.checkboxSelected]}
          >
            {selectedCodes.includes(item.code) && (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            )}
          </View>
        </View>
      </View>

      <Text style={styles.codeDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.codeMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>RVU</Text>
          <Text style={styles.metricValue}>{item.totalRVU.toFixed(2)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Est. Reimb.</Text>
          <Text style={[styles.metricValue, styles.reimbursementValue]}>
            ${item.estimatedReimbursement.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Frequency</Text>
          <Text style={styles.metricValue}>{item.frequency}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.detailButton} onPress={() => openCodeDetail(item)}>
        <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
        <Text style={styles.detailButtonText}>View Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>CPT Billing Codes</Text>
        <TouchableOpacity style={styles.calculatorButton}>
          <Ionicons name="calculator-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search CPT codes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['suggested', 'all', 'favorites'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {tab === 'suggested' ? 'AI Suggested' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCodes.length > 0 && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>{selectedCodes.length} code(s)</Text>
            <Text style={styles.selectionTotal}>Est. ${getTotalReimbursement().toFixed(2)}</Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedCodes([])}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
                selectedCategory === category.id && { backgroundColor: category.color },
              ]}
              onPress={() =>
                setSelectedCategory(selectedCategory === category.id ? null : category.id)
              }
            >
              <Ionicons
                name={category.icon as any}
                size={14}
                color={selectedCategory === category.id ? '#FFF' : '#666'}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCodes}
        renderItem={renderCodeCard}
        keyExtractor={item => item.code}
        contentContainerStyle={styles.codesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        ListHeaderComponent={
          activeTab === 'suggested' ? (
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={18} color="#AF52DE" />
              <Text style={styles.aiHeaderText}>AI-suggested codes based on documentation</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Codes Found</Text>
            <Text style={styles.emptyDescription}>Try adjusting your search or filters</Text>
          </View>
        }
      />

      <Modal visible={showCodeDetail} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCodeDetail(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Code Details</Text>
            <TouchableOpacity>
              <Ionicons name="share-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {selectedCode && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailCode}>{selectedCode.code}</Text>
                <View
                  style={[
                    styles.detailCategory,
                    { backgroundColor: getCategoryColor(selectedCode.category) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.detailCategoryText,
                      { color: getCategoryColor(selectedCode.category) },
                    ]}
                  >
                    {selectedCode.category}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailDescription}>{selectedCode.description}</Text>
              <Text style={styles.detailSubcategory}>{selectedCode.subcategory}</Text>

              <View style={styles.rvuSection}>
                <Text style={styles.sectionTitle}>RVU Breakdown</Text>
                <View style={styles.rvuGrid}>
                  <View style={styles.rvuItem}>
                    <Text style={styles.rvuValue}>{selectedCode.rvuWork.toFixed(2)}</Text>
                    <Text style={styles.rvuLabel}>Work</Text>
                  </View>
                  <View style={styles.rvuItem}>
                    <Text style={styles.rvuValue}>{selectedCode.rvuPractice.toFixed(2)}</Text>
                    <Text style={styles.rvuLabel}>Practice</Text>
                  </View>
                  <View style={styles.rvuItem}>
                    <Text style={styles.rvuValue}>{selectedCode.rvuMalpractice.toFixed(2)}</Text>
                    <Text style={styles.rvuLabel}>Malpractice</Text>
                  </View>
                  <View style={[styles.rvuItem, styles.rvuTotal]}>
                    <Text style={[styles.rvuValue, styles.rvuTotalValue]}>
                      {selectedCode.totalRVU.toFixed(2)}
                    </Text>
                    <Text style={styles.rvuLabel}>Total RVU</Text>
                  </View>
                </View>
              </View>

              <View style={styles.reimbursementSection}>
                <Text style={styles.sectionTitle}>Estimated Reimbursement</Text>
                <View style={styles.reimbursementCard}>
                  <Text style={styles.reimbursementAmount}>
                    ${selectedCode.estimatedReimbursement.toFixed(2)}
                  </Text>
                  <Text style={styles.reimbursementNote}>Based on 2025 Medicare rates</Text>
                </View>
              </View>

              <View style={styles.modifiersSection}>
                <Text style={styles.sectionTitle}>Common Modifiers</Text>
                <View style={styles.modifiersList}>
                  {modifiers.slice(0, 4).map(mod => (
                    <TouchableOpacity key={mod.code} style={styles.modifierItem}>
                      <View style={styles.modifierCode}>
                        <Text style={styles.modifierCodeText}>{mod.code}</Text>
                      </View>
                      <Text style={styles.modifierDescription} numberOfLines={1}>
                        {mod.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.usageSection}>
                <Text style={styles.sectionTitle}>Usage Statistics</Text>
                <View style={styles.usageStats}>
                  <View style={styles.usageStat}>
                    <Ionicons name="bar-chart" size={20} color="#007AFF" />
                    <Text style={styles.usageValue}>{selectedCode.frequency}</Text>
                    <Text style={styles.usageLabel}>Times Used</Text>
                  </View>
                  <View style={styles.usageStat}>
                    <Ionicons name="trending-up" size={20} color="#34C759" />
                    <Text style={styles.usageValue}>Top 10</Text>
                    <Text style={styles.usageLabel}>In Specialty</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.selectCodeButton,
                  selectedCodes.includes(selectedCode.code) && styles.selectCodeButtonActive,
                ]}
                onPress={() => {
                  toggleCodeSelection(selectedCode.code);
                  setShowCodeDetail(false);
                }}
              >
                <Ionicons
                  name={
                    selectedCodes.includes(selectedCode.code)
                      ? 'checkmark-circle'
                      : 'add-circle-outline'
                  }
                  size={22}
                  color="#FFF"
                />
                <Text style={styles.selectCodeButtonText}>
                  {selectedCodes.includes(selectedCode.code) ? 'Selected' : 'Select This Code'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  calculatorButton: { padding: 4 },
  searchSection: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#007AFF15' },
  tabButtonText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  tabButtonTextActive: { color: '#007AFF' },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectionInfo: { flexDirection: 'row', alignItems: 'center' },
  selectionCount: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  selectionTotal: { fontSize: 14, fontWeight: '700', color: '#FFF', marginLeft: 12 },
  selectionActions: { flexDirection: 'row', alignItems: 'center' },
  clearButton: { paddingHorizontal: 12, paddingVertical: 6 },
  clearButtonText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF', marginLeft: 4 },
  categoriesSection: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoriesScroll: { paddingHorizontal: 16 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#007AFF' },
  categoryIcon: { marginRight: 6 },
  categoryChipText: { fontSize: 13, color: '#666' },
  categoryChipTextActive: { color: '#FFF', fontWeight: '500' },
  codesList: { padding: 16 },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#AF52DE10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  aiHeaderText: { fontSize: 13, color: '#AF52DE', marginLeft: 8 },
  codeCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  codeCardSelected: { borderColor: '#34C759', backgroundColor: '#34C75908' },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeInfo: { flexDirection: 'row', alignItems: 'center' },
  codeText: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginRight: 10 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
  codeActions: { flexDirection: 'row', alignItems: 'center' },
  favoriteButton: { padding: 4, marginRight: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#34C759', borderColor: '#34C759' },
  codeDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 14 },
  codeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 4 },
  metricValue: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  reimbursementValue: { color: '#34C759' },
  metricDivider: { width: 1, height: 30, backgroundColor: '#E5E5EA' },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  detailButtonText: { fontSize: 13, color: '#007AFF', marginLeft: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptyDescription: { fontSize: 14, color: '#8E8E93', marginTop: 8 },
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  modalContent: { flex: 1, padding: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailCode: { fontSize: 36, fontWeight: '700', color: '#1C1C1E', marginRight: 12 },
  detailCategory: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  detailCategoryText: { fontSize: 14, fontWeight: '600' },
  detailDescription: { fontSize: 18, color: '#1C1C1E', lineHeight: 26, marginBottom: 4 },
  detailSubcategory: { fontSize: 14, color: '#8E8E93', marginBottom: 24 },
  rvuSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  rvuGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  rvuItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    marginRight: '2%',
    marginBottom: 8,
  },
  rvuTotal: { backgroundColor: '#007AFF10' },
  rvuValue: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  rvuTotalValue: { color: '#007AFF' },
  rvuLabel: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  reimbursementSection: { marginBottom: 24 },
  reimbursementCard: {
    backgroundColor: '#34C75910',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  reimbursementAmount: { fontSize: 36, fontWeight: '700', color: '#34C759' },
  reimbursementNote: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  modifiersSection: { marginBottom: 24 },
  modifiersList: {},
  modifierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modifierCode: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  modifierCodeText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  modifierDescription: { flex: 1, fontSize: 13, color: '#666' },
  usageSection: { marginBottom: 24 },
  usageStats: { flexDirection: 'row' },
  usageStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    marginRight: 8,
  },
  usageValue: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginTop: 8 },
  usageLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  selectCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  selectCodeButtonActive: { backgroundColor: '#34C759' },
  selectCodeButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default CPTBillingCodesScreen;
