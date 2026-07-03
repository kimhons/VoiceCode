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

interface ICD10Code {
  code: string;
  description: string;
  category: string;
  isSelected: boolean;
  confidence?: number;
  isFavorite: boolean;
  frequency: number;
}

interface CodeCategory {
  id: string;
  name: string;
  prefix: string;
  color: string;
}

const ICD10CodeSuggestionsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCodeDetail, setShowCodeDetail] = useState(false);
  const [selectedCode, setSelectedCode] = useState<ICD10Code | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const categories: CodeCategory[] = [
    { id: 'A-B', name: 'Infectious', prefix: 'A00-B99', color: '#FF3B30' },
    { id: 'C-D', name: 'Neoplasms', prefix: 'C00-D49', color: '#FF9500' },
    { id: 'E', name: 'Endocrine', prefix: 'E00-E89', color: '#FFCC00' },
    { id: 'F', name: 'Mental', prefix: 'F01-F99', color: '#34C759' },
    { id: 'G', name: 'Nervous', prefix: 'G00-G99', color: '#007AFF' },
    { id: 'I', name: 'Circulatory', prefix: 'I00-I99', color: '#5856D6' },
    { id: 'J', name: 'Respiratory', prefix: 'J00-J99', color: '#AF52DE' },
    { id: 'K', name: 'Digestive', prefix: 'K00-K95', color: '#FF2D55' },
    { id: 'M', name: 'Musculoskeletal', prefix: 'M00-M99', color: '#00C7BE' },
    { id: 'R', name: 'Symptoms', prefix: 'R00-R99', color: '#8E8E93' },
  ];

  const suggestedCodes: ICD10Code[] = [
    {
      code: 'J06.9',
      description: 'Acute upper respiratory infection, unspecified',
      category: 'Respiratory',
      isSelected: false,
      confidence: 95,
      isFavorite: true,
      frequency: 342,
    },
    {
      code: 'I10',
      description: 'Essential (primary) hypertension',
      category: 'Circulatory',
      isSelected: false,
      confidence: 92,
      isFavorite: true,
      frequency: 1250,
    },
    {
      code: 'E11.9',
      description: 'Type 2 diabetes mellitus without complications',
      category: 'Endocrine',
      isSelected: false,
      confidence: 88,
      isFavorite: false,
      frequency: 890,
    },
    {
      code: 'M54.5',
      description: 'Low back pain',
      category: 'Musculoskeletal',
      isSelected: false,
      confidence: 85,
      isFavorite: true,
      frequency: 567,
    },
    {
      code: 'R05.9',
      description: 'Cough, unspecified',
      category: 'Symptoms',
      isSelected: false,
      confidence: 82,
      isFavorite: false,
      frequency: 423,
    },
  ];

  const allCodes: ICD10Code[] = [
    ...suggestedCodes,
    {
      code: 'J02.9',
      description: 'Acute pharyngitis, unspecified',
      category: 'Respiratory',
      isSelected: false,
      isFavorite: false,
      frequency: 234,
    },
    {
      code: 'J18.9',
      description: 'Pneumonia, unspecified organism',
      category: 'Respiratory',
      isSelected: false,
      isFavorite: true,
      frequency: 189,
    },
    {
      code: 'K21.0',
      description: 'Gastro-esophageal reflux disease with esophagitis',
      category: 'Digestive',
      isSelected: false,
      isFavorite: false,
      frequency: 312,
    },
    {
      code: 'F41.1',
      description: 'Generalized anxiety disorder',
      category: 'Mental',
      isSelected: false,
      isFavorite: false,
      frequency: 278,
    },
    {
      code: 'G43.909',
      description: 'Migraine, unspecified, not intractable',
      category: 'Nervous',
      isSelected: false,
      isFavorite: true,
      frequency: 156,
    },
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

  const openCodeDetail = (code: ICD10Code) => {
    setSelectedCode(code);
    setShowCodeDetail(true);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return '#34C759';
    if (confidence >= 75) return '#FFCC00';
    return '#FF9500';
  };

  const filteredCodes = allCodes.filter(code => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || code.category === categories.find(c => c.id === selectedCategory)?.name;
    return matchesSearch && matchesCategory;
  });

  const renderCodeCard = ({ item }: { item: ICD10Code }) => (
    <TouchableOpacity
      style={[styles.codeCard, selectedCodes.includes(item.code) && styles.codeCardSelected]}
      onPress={() => toggleCodeSelection(item.code)}
      onLongPress={() => openCodeDetail(item)}
    >
      <View style={styles.codeHeader}>
        <View style={styles.codeInfo}>
          <View
            style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.category) }]}
          />
          <Text style={styles.codeText}>{item.code}</Text>
          {item.confidence && (
            <View
              style={[
                styles.confidenceBadge,
                { backgroundColor: getConfidenceColor(item.confidence) + '20' },
              ]}
            >
              <Text style={[styles.confidenceText, { color: getConfidenceColor(item.confidence) }]}>
                {item.confidence}%
              </Text>
            </View>
          )}
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

      <View style={styles.codeFooter}>
        <View style={styles.categoryTag}>
          <Text style={[styles.categoryTagText, { color: getCategoryColor(item.category) }]}>
            {item.category}
          </Text>
        </View>
        <Text style={styles.frequencyText}>Used {item.frequency}x</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestedCode = ({ item }: { item: ICD10Code }) => (
    <TouchableOpacity
      style={[
        styles.suggestedCard,
        selectedCodes.includes(item.code) && styles.suggestedCardSelected,
      ]}
      onPress={() => toggleCodeSelection(item.code)}
    >
      <View style={styles.suggestedHeader}>
        <Text style={styles.suggestedCode}>{item.code}</Text>
        {item.confidence && (
          <View
            style={[
              styles.confidencePill,
              { backgroundColor: getConfidenceColor(item.confidence) },
            ]}
          >
            <Ionicons name="flash" size={10} color="#FFF" />
            <Text style={styles.confidencePillText}>{item.confidence}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.suggestedDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {selectedCodes.includes(item.code) && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>ICD-10 Codes</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search codes or descriptions..."
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
        <TouchableOpacity style={styles.voiceSearchButton}>
          <Ionicons name="mic" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {selectedCodes.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedCodes.length} code(s) selected</Text>
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color="#AF52DE" />
            <Text style={styles.aiTitle}>AI Suggested Codes</Text>
            <View style={styles.aiLiveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <Text style={styles.aiSubtitle}>Based on current encounter documentation</Text>

          <FlatList
            data={suggestedCodes}
            renderItem={renderSuggestedCode}
            keyExtractor={item => item.code}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedList}
          />
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
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
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
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
                <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
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

        <View style={styles.allCodesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Codes</Text>
            <Text style={styles.resultCount}>{filteredCodes.length} results</Text>
          </View>

          {filteredCodes.map(code => (
            <View key={code.code}>{renderCodeCard({ item: code })}</View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

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

              <View style={styles.detailStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedCode.frequency}</Text>
                  <Text style={styles.statLabel}>Times Used</Text>
                </View>
                {selectedCode.confidence && (
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: getConfidenceColor(selectedCode.confidence) },
                      ]}
                    >
                      {selectedCode.confidence}%
                    </Text>
                    <Text style={styles.statLabel}>AI Confidence</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Includes</Text>
                <View style={styles.includesList}>
                  <Text style={styles.includeItem}>• Common cold (acute)</Text>
                  <Text style={styles.includeItem}>• Nasopharyngitis NOS</Text>
                  <Text style={styles.includeItem}>• Acute rhinitis</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Excludes</Text>
                <View style={styles.excludesList}>
                  <Text style={styles.excludeItem}>• Influenza (J09-J11)</Text>
                  <Text style={styles.excludeItem}>• Streptococcal pharyngitis (J02.0)</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Related Codes</Text>
                <View style={styles.relatedCodes}>
                  <TouchableOpacity style={styles.relatedCodeChip}>
                    <Text style={styles.relatedCodeText}>J06.0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.relatedCodeChip}>
                    <Text style={styles.relatedCodeText}>J02.9</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.relatedCodeChip}>
                    <Text style={styles.relatedCodeText}>J00</Text>
                  </TouchableOpacity>
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
  historyButton: { padding: 4 },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  voiceSearchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectionText: { fontSize: 14, fontWeight: '500', color: '#FFF' },
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
  content: { flex: 1 },
  aiSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  aiTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginLeft: 8, flex: 1 },
  aiLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C75920',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34C759', marginRight: 4 },
  liveText: { fontSize: 11, fontWeight: '600', color: '#34C759' },
  aiSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  suggestedList: { paddingRight: 16 },
  suggestedCard: {
    width: 160,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestedCardSelected: { borderColor: '#34C759', backgroundColor: '#34C75910' },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestedCode: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidencePillText: { fontSize: 10, fontWeight: '600', color: '#FFF', marginLeft: 2 },
  suggestedDescription: { fontSize: 12, color: '#666', lineHeight: 16 },
  selectedIndicator: { position: 'absolute', top: 8, right: 8 },
  categoriesSection: { paddingVertical: 12 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoriesScroll: { paddingHorizontal: 16 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryColorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  categoryChipText: { fontSize: 13, color: '#666' },
  categoryChipTextActive: { color: '#FFF', fontWeight: '500' },
  allCodesSection: { backgroundColor: '#FFF', paddingTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultCount: { fontSize: 13, color: '#8E8E93' },
  codeCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  codeCardSelected: { borderColor: '#34C759', backgroundColor: '#34C75908' },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeInfo: { flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  codeText: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 10 },
  confidenceText: { fontSize: 12, fontWeight: '600' },
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
  codeDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 10 },
  codeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  categoryTagText: { fontSize: 12, fontWeight: '500' },
  frequencyText: { fontSize: 12, color: '#8E8E93' },
  bottomPadding: { height: 40 },
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
  detailCode: { fontSize: 32, fontWeight: '700', color: '#1C1C1E', marginRight: 12 },
  detailCategory: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  detailCategoryText: { fontSize: 13, fontWeight: '600' },
  detailDescription: { fontSize: 18, color: '#666', lineHeight: 26, marginBottom: 24 },
  detailStats: { flexDirection: 'row', marginBottom: 24 },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  detailSection: { marginBottom: 20 },
  detailSectionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 10 },
  includesList: { backgroundColor: '#34C75910', borderRadius: 12, padding: 12 },
  includeItem: { fontSize: 14, color: '#34C759', lineHeight: 24 },
  excludesList: { backgroundColor: '#FF3B3010', borderRadius: 12, padding: 12 },
  excludeItem: { fontSize: 14, color: '#FF3B30', lineHeight: 24 },
  relatedCodes: { flexDirection: 'row', flexWrap: 'wrap' },
  relatedCodeChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  relatedCodeText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  selectCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  selectCodeButtonActive: { backgroundColor: '#34C759' },
  selectCodeButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default ICD10CodeSuggestionsScreen;
