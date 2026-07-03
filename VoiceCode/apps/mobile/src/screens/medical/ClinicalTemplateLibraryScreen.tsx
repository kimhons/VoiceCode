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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ClinicalTemplate {
  id: string;
  name: string;
  specialty: string;
  category: 'soap' | 'progress' | 'discharge' | 'referral' | 'custom';
  description: string;
  isFavorite: boolean;
  isOfficial: boolean;
  usageCount: number;
  lastUsed?: Date;
  author?: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

const ClinicalTemplateLibraryScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const categories: TemplateCategory[] = [
    { id: 'soap', name: 'SOAP Notes', icon: 'document-text', count: 45 },
    { id: 'progress', name: 'Progress Notes', icon: 'trending-up', count: 32 },
    { id: 'discharge', name: 'Discharge', icon: 'exit', count: 18 },
    { id: 'referral', name: 'Referrals', icon: 'share', count: 24 },
    { id: 'custom', name: 'My Templates', icon: 'person', count: 8 },
  ];

  const specialties = [
    'General Practice',
    'Cardiology',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'Psychiatry',
    'Dermatology',
    'Emergency Medicine',
    'Internal Medicine',
    'Surgery',
    'OB/GYN',
    'Oncology',
  ];

  const templates: ClinicalTemplate[] = [
    {
      id: '1',
      name: 'Standard SOAP Note',
      specialty: 'General Practice',
      category: 'soap',
      description: 'Complete SOAP format with all sections pre-configured',
      isFavorite: true,
      isOfficial: true,
      usageCount: 1250,
      lastUsed: new Date(),
    },
    {
      id: '2',
      name: 'Cardiology Consult',
      specialty: 'Cardiology',
      category: 'soap',
      description: 'Specialized template for cardiac assessments with ECG findings',
      isFavorite: false,
      isOfficial: true,
      usageCount: 890,
    },
    {
      id: '3',
      name: 'Pediatric Well Visit',
      specialty: 'Pediatrics',
      category: 'progress',
      description: 'Age-appropriate developmental milestones and vaccination tracking',
      isFavorite: true,
      isOfficial: true,
      usageCount: 756,
    },
    {
      id: '4',
      name: 'Emergency Department H&P',
      specialty: 'Emergency Medicine',
      category: 'soap',
      description: 'Rapid assessment template for ED encounters',
      isFavorite: false,
      isOfficial: true,
      usageCount: 2100,
    },
    {
      id: '5',
      name: 'Discharge Summary - Standard',
      specialty: 'Internal Medicine',
      category: 'discharge',
      description: 'Comprehensive discharge with medication reconciliation',
      isFavorite: true,
      isOfficial: true,
      usageCount: 1540,
    },
    {
      id: '6',
      name: 'Specialist Referral Letter',
      specialty: 'General Practice',
      category: 'referral',
      description: 'Professional referral with clinical summary',
      isFavorite: false,
      isOfficial: true,
      usageCount: 980,
    },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSpecialty = !selectedSpecialty || template.specialty === selectedSpecialty;
    return matchesSearch && matchesCategory && matchesSpecialty;
  });

  const getCategoryIcon = (category: string): string => {
    const found = categories.find(c => c.id === category);
    return found?.icon || 'document';
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      soap: '#007AFF',
      progress: '#34C759',
      discharge: '#FF9500',
      referral: '#AF52DE',
      custom: '#5856D6',
    };
    return colors[category] || '#666';
  };

  const renderTemplateCard = ({ item }: { item: ClinicalTemplate }) => (
    <TouchableOpacity style={styles.templateCard} activeOpacity={0.7}>
      <View style={styles.templateHeader}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(item.category) + '20' },
          ]}
        >
          <Ionicons
            name={getCategoryIcon(item.category) as any}
            size={16}
            color={getCategoryColor(item.category)}
          />
          <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
            {categories.find(c => c.id === item.category)?.name}
          </Text>
        </View>
        <View style={styles.templateActions}>
          {item.isOfficial && (
            <View style={styles.officialBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
            </View>
          )}
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons
              name={item.isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={item.isFavorite ? '#FFD60A' : '#999'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.templateName}>{item.name}</Text>
      <Text style={styles.templateDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.templateMeta}>
        <View style={styles.specialtyTag}>
          <Ionicons name="medical" size={12} color="#666" />
          <Text style={styles.specialtyText}>{item.specialty}</Text>
        </View>
        <Text style={styles.usageText}>{item.usageCount.toLocaleString()} uses</Text>
      </View>

      <View style={styles.templateFooter}>
        <TouchableOpacity style={styles.useButton}>
          <Ionicons name="play" size={16} color="#FFF" />
          <Text style={styles.useButtonText}>Use Template</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.previewButton}>
          <Ionicons name="eye-outline" size={16} color="#007AFF" />
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Template Library</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={22} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
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
            <Ionicons name="apps" size={16} color={!selectedCategory ? '#FFF' : '#666'} />
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
              ]}
              onPress={() =>
                setSelectedCategory(selectedCategory === category.id ? null : category.id)
              }
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? '#FFF' : '#666'}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextActive,
                ]}
              >
                {category.name}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  selectedCategory === category.id && styles.countBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    selectedCategory === category.id && styles.countTextActive,
                  ]}
                >
                  {category.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.specialtiesSection}>
        <Text style={styles.sectionLabel}>Specialty</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesScroll}
        >
          <TouchableOpacity
            style={[styles.specialtyChip, !selectedSpecialty && styles.specialtyChipActive]}
            onPress={() => setSelectedSpecialty(null)}
          >
            <Text
              style={[
                styles.specialtyChipText,
                !selectedSpecialty && styles.specialtyChipTextActive,
              ]}
            >
              All Specialties
            </Text>
          </TouchableOpacity>
          {specialties.map(specialty => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.specialtyChip,
                selectedSpecialty === specialty && styles.specialtyChipActive,
              ]}
              onPress={() =>
                setSelectedSpecialty(selectedSpecialty === specialty ? null : specialty)
              }
            >
              <Text
                style={[
                  styles.specialtyChipText,
                  selectedSpecialty === specialty && styles.specialtyChipTextActive,
                ]}
              >
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{filteredTemplates.length} templates found</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical" size={16} color="#007AFF" />
          <Text style={styles.sortText}>Sort</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplateCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.templatesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Templates Found</Text>
            <Text style={styles.emptyDescription}>Try adjusting your filters or search query</Text>
          </View>
        }
      />

      <View style={styles.floatingActions}>
        <TouchableOpacity style={styles.communityButton}>
          <Ionicons name="globe-outline" size={20} color="#007AFF" />
          <Text style={styles.communityButtonText}>Community Templates</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  viewModeButton: { padding: 8, marginRight: 8 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  categoryChipText: { fontSize: 14, fontWeight: '500', color: '#666', marginLeft: 6 },
  categoryChipTextActive: { color: '#FFF' },
  countBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  countText: { fontSize: 11, fontWeight: '600', color: '#666' },
  countTextActive: { color: '#FFF' },
  specialtiesSection: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  specialtiesScroll: { paddingHorizontal: 16 },
  specialtyChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  specialtyChipActive: { backgroundColor: '#34C759', borderColor: '#34C759' },
  specialtyChipText: { fontSize: 13, color: '#666' },
  specialtyChipTextActive: { color: '#FFF', fontWeight: '500' },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: { fontSize: 14, color: '#8E8E93' },
  sortButton: { flexDirection: 'row', alignItems: 'center' },
  sortText: { fontSize: 14, color: '#007AFF', marginLeft: 4 },
  templatesList: { paddingHorizontal: 16, paddingBottom: 100 },
  templateCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  templateActions: { flexDirection: 'row', alignItems: 'center' },
  officialBadge: { marginRight: 8 },
  favoriteButton: { padding: 4 },
  templateName: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 6 },
  templateDescription: { fontSize: 14, color: '#8E8E93', lineHeight: 20, marginBottom: 12 },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: { fontSize: 12, color: '#666', marginLeft: 4 },
  usageText: { fontSize: 12, color: '#8E8E93' },
  templateFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  useButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  useButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF', marginLeft: 6 },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  previewButtonText: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptyDescription: { fontSize: 14, color: '#8E8E93', marginTop: 8 },
  floatingActions: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  communityButtonText: { fontSize: 15, fontWeight: '600', color: '#007AFF', marginLeft: 8 },
});

export default ClinicalTemplateLibraryScreen;
