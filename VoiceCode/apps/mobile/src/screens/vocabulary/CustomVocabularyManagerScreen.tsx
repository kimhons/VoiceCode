import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Dimensions,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SettingsStackParamList } from '../../navigation/types';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = StackNavigationProp<SettingsStackParamList, 'CustomVocabularyManager'>;

// ============================================================================
// Interfaces
// ============================================================================

export interface VocabularyWord {
  id: string;
  word: string;
  pronunciation?: string;
  phonetic?: string;
  category: VocabularyCategory;
  industrySet?: IndustrySet;
  replacementRule?: ReplacementRule;
  usageCount: number;
  lastUsed?: string;
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  audioUrl?: string;
  notes?: string;
}

export interface ReplacementRule {
  id: string;
  originalText: string;
  replacementText: string;
  caseSensitive: boolean;
  wholeWordOnly: boolean;
  enabled: boolean;
}

export interface IndustryVocabularySet {
  id: string;
  name: string;
  description: string;
  industry: IndustrySet;
  icon: keyof typeof Ionicons.glyphMap;
  wordCount: number;
  enabled: boolean;
  words: VocabularyWord[];
  createdAt: string;
}

export interface VocabularyStatistics {
  totalWords: number;
  customWords: number;
  industryWords: number;
  totalUsage: number;
  mostUsedWord?: VocabularyWord;
  recentlyAdded: VocabularyWord[];
  categoryCounts: Record<VocabularyCategory, number>;
}

export interface BulkOperation {
  id: string;
  type: BulkOperationType;
  wordIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
}

export type VocabularyCategory = 'general' | 'medical' | 'legal' | 'technical' | 'business' | 'academic' | 'custom';
export type IndustrySet = 'medical' | 'legal' | 'technical' | 'business' | 'academic' | 'finance' | 'education';
export type BulkOperationType = 'delete' | 'export' | 'categorize' | 'enable' | 'disable';
export type SortOption = 'alphabetical' | 'usage' | 'recent' | 'category';
export type FilterOption = 'all' | 'custom' | 'industry' | 'favorites';

// ============================================================================
// Constants
// ============================================================================

const BASE_UNIT = 4;

const VOCABULARY_CATEGORIES: Array<{ id: VocabularyCategory; name: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { id: 'general', name: 'General', icon: 'book-outline', color: '#6B7280' },
  { id: 'medical', name: 'Medical', icon: 'medical-outline', color: '#EF4444' },
  { id: 'legal', name: 'Legal', icon: 'hammer-outline', color: '#8B5CF6' },
  { id: 'technical', name: 'Technical', icon: 'code-slash-outline', color: '#3B82F6' },
  { id: 'business', name: 'Business', icon: 'briefcase-outline', color: '#10B981' },
  { id: 'academic', name: 'Academic', icon: 'school-outline', color: '#F59E0B' },
  { id: 'custom', name: 'Custom', icon: 'create-outline', color: '#EC4899' },
];

const INDUSTRY_SETS: IndustryVocabularySet[] = [
  {
    id: 'medical-basic',
    name: 'Medical Terminology',
    description: 'Common medical terms and procedures',
    industry: 'medical',
    icon: 'medical',
    wordCount: 250,
    enabled: true,
    words: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'legal-basic',
    name: 'Legal Terms',
    description: 'Legal jargon and court terminology',
    industry: 'legal',
    icon: 'hammer',
    wordCount: 180,
    enabled: false,
    words: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'technical-basic',
    name: 'Technical Vocabulary',
    description: 'Programming and IT terminology',
    industry: 'technical',
    icon: 'code-slash',
    wordCount: 320,
    enabled: true,
    words: [],
    createdAt: new Date().toISOString(),
  },
];

const SORT_OPTIONS: Array<{ id: SortOption; name: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'alphabetical', name: 'A-Z', icon: 'text-outline' },
  { id: 'usage', name: 'Most Used', icon: 'trending-up-outline' },
  { id: 'recent', name: 'Recent', icon: 'time-outline' },
  { id: 'category', name: 'Category', icon: 'folder-outline' },
];

const FILTER_OPTIONS: Array<{ id: FilterOption; name: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'all', name: 'All Words', icon: 'list-outline' },
  { id: 'custom', name: 'Custom', icon: 'create-outline' },
  { id: 'industry', name: 'Industry', icon: 'briefcase-outline' },
  { id: 'favorites', name: 'Favorites', icon: 'star' },
];

// ============================================================================
// Component
// ============================================================================

export default function CustomVocabularyManagerScreen() {
  const navigation = useNavigation<NavigationProp>();

  // State
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [industrySets, setIndustrySets] = useState<IndustryVocabularySet[]>(INDUSTRY_SETS);
  const [statistics, setStatistics] = useState<VocabularyStatistics | null>(null);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showAddWordPanel, setShowAddWordPanel] = useState(false);
  const [showIndustrySetsPanel, setShowIndustrySetsPanel] = useState(false);
  const [showBulkOperationsPanel, setShowBulkOperationsPanel] = useState(false);
  const [showStatisticsPanel, setShowStatisticsPanel] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('words');
  const [selectionMode, setSelectionMode] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const addWordPanelSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const industrySetsSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const bulkOpsSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const statsSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadData();

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    animatePanel(addWordPanelSlideAnim, showAddWordPanel);
  }, [showAddWordPanel]);

  useEffect(() => {
    animatePanel(industrySetsSlideAnim, showIndustrySetsPanel);
  }, [showIndustrySetsPanel]);

  useEffect(() => {
    animatePanel(bulkOpsSlideAnim, showBulkOperationsPanel);
  }, [showBulkOperationsPanel]);

  useEffect(() => {
    animatePanel(statsSlideAnim, showStatisticsPanel);
  }, [showStatisticsPanel]);

  // ============================================================================
  // Data Management
  // ============================================================================

  const loadData = async () => {
    try {
      await Promise.all([
        loadWords(),
        loadIndustrySets(),
        loadStatistics(),
        loadBulkOperations(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadWords = async () => {
    try {
      const stored = await AsyncStorage.getItem('vocabulary_words');
      if (stored) {
        setWords(JSON.parse(stored));
      } else {
        // Mock data
        const mockWords: VocabularyWord[] = [
          {
            id: '1',
            word: 'Electrocardiogram',
            pronunciation: 'ih-lek-troh-KAHR-dee-uh-gram',
            phonetic: '/ɪˌlɛktroʊˈkɑrdiəˌɡræm/',
            category: 'medical',
            industrySet: 'medical',
            usageCount: 45,
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isFavorite: true,
            isCustom: false,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            notes: 'ECG or EKG - test that measures heart electrical activity',
          },
          {
            id: '2',
            word: 'Plaintiff',
            pronunciation: 'PLAYN-tif',
            phonetic: '/ˈpleɪntɪf/',
            category: 'legal',
            industrySet: 'legal',
            replacementRule: {
              id: 'r1',
              originalText: 'plantiff',
              replacementText: 'plaintiff',
              caseSensitive: false,
              wholeWordOnly: true,
              enabled: true,
            },
            usageCount: 28,
            lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isFavorite: true,
            isCustom: false,
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Person who brings a case against another in a court of law',
          },
          {
            id: '3',
            word: 'Kubernetes',
            pronunciation: 'koo-ber-NET-eez',
            phonetic: '/ˌkubərˈnɛtiz/',
            category: 'technical',
            industrySet: 'technical',
            usageCount: 67,
            lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            isFavorite: false,
            isCustom: true,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            notes: 'Container orchestration platform',
          },
          {
            id: '4',
            word: 'Synergy',
            pronunciation: 'SIN-er-jee',
            phonetic: '/ˈsɪnərdʒi/',
            category: 'business',
            usageCount: 12,
            isFavorite: false,
            isCustom: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Interaction producing a combined effect greater than the sum of separate effects',
          },
        ];
        setWords(mockWords);
      }
    } catch (error) {
      console.error('Error loading words:', error);
    }
  };

  const loadIndustrySets = async () => {
    try {
      const stored = await AsyncStorage.getItem('industry_sets');
      if (stored) {
        setIndustrySets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading industry sets:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const mockStats: VocabularyStatistics = {
        totalWords: 4,
        customWords: 2,
        industryWords: 2,
        totalUsage: 152,
        mostUsedWord: words[2],
        recentlyAdded: words.slice(0, 3),
        categoryCounts: {
          general: 0,
          medical: 1,
          legal: 1,
          technical: 1,
          business: 1,
          academic: 0,
          custom: 0,
        },
      };
      setStatistics(mockStats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadBulkOperations = async () => {
    try {
      const mockOps: BulkOperation[] = [
        {
          id: 'op1',
          type: 'export',
          wordIds: ['1', '2', '3'],
          status: 'completed',
          progress: 100,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setBulkOperations(mockOps);
    } catch (error) {
      console.error('Error loading bulk operations:', error);
    }
  };

  const saveWords = async (updatedWords: VocabularyWord[]) => {
    try {
      await AsyncStorage.setItem('vocabulary_words', JSON.stringify(updatedWords));
      setWords(updatedWords);
    } catch (error) {
      console.error('Error saving words:', error);
    }
  };

  const saveIndustrySets = async (updatedSets: IndustryVocabularySet[]) => {
    try {
      await AsyncStorage.setItem('industry_sets', JSON.stringify(updatedSets));
      setIndustrySets(updatedSets);
    } catch (error) {
      console.error('Error saving industry sets:', error);
    }
  };


  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddWord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingWord(null);
    setShowAddWordPanel(true);
  };

  const handleEditWord = (word: VocabularyWord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingWord(word);
    setShowAddWordPanel(true);
  };

  const handleDeleteWord = (wordId: string) => {
    Alert.alert(
      'Delete Word',
      'Are you sure you want to delete this word?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const updatedWords = words.filter(w => w.id !== wordId);
            await saveWords(updatedWords);
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (wordId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedWords = words.map(w =>
      w.id === wordId ? { ...w, isFavorite: !w.isFavorite } : w
    );
    await saveWords(updatedWords);
  };

  const handleToggleSelection = (wordId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSelection = new Set(selectedWords);
    if (newSelection.has(wordId)) {
      newSelection.delete(wordId);
    } else {
      newSelection.add(wordId);
    }
    setSelectedWords(newSelection);
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const filteredWords = getFilteredAndSortedWords();
    setSelectedWords(new Set(filteredWords.map(w => w.id)));
  };

  const handleDeselectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWords(new Set());
  };

  const handleToggleSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedWords(new Set());
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Selected Words',
      `Are you sure you want to delete ${selectedWords.size} word(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const updatedWords = words.filter(w => !selectedWords.has(w.id));
            await saveWords(updatedWords);
            setSelectedWords(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleBulkExport = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Export', `Exporting ${selectedWords.size} word(s)...`);
    // TODO: Implement actual export logic
  };

  const handleBulkCategorize = (category: VocabularyCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedWords = words.map(w =>
      selectedWords.has(w.id) ? { ...w, category } : w
    );
    saveWords(updatedWords);
    setSelectedWords(new Set());
    setSelectionMode(false);
  };

  const handleToggleIndustrySet = async (setId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedSets = industrySets.map(s =>
      s.id === setId ? { ...s, enabled: !s.enabled } : s
    );
    await saveIndustrySets(updatedSets);
  };

  const handleImportVocabulary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Import Vocabulary', 'Import from file feature coming soon!');
    // TODO: Implement file picker and import logic
  };

  const handleExportVocabulary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Export Vocabulary', 'Export to file feature coming soon!');
    // TODO: Implement export logic
  };

  const handleShowStatistics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowStatisticsPanel(true);
  };

  const handleShowIndustrySets = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowIndustrySetsPanel(true);
  };

  const handleShowBulkOperations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBulkOperationsPanel(true);
  };

  const handleCloseAddWordPanel = () => {
    setShowAddWordPanel(false);
    setEditingWord(null);
  };

  const handleCloseIndustrySetsPanel = () => {
    setShowIndustrySetsPanel(false);
  };

  const handleCloseBulkOperationsPanel = () => {
    setShowBulkOperationsPanel(false);
  };

  const handleCloseStatisticsPanel = () => {
    setShowStatisticsPanel(false);
  };

  const handleSortChange = (option: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(option);
  };

  const handleFilterChange = (option: FilterOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterBy(option);
  };

  const handleToggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === section ? null : section);
  };


  // ============================================================================
  // Utility Functions
  // ============================================================================

  const animatePanel = (animValue: Animated.Value, show: boolean) => {
    Animated.spring(animValue, {
      toValue: show ? 0 : Dimensions.get('window').width,
      damping: 20,
      stiffness: 90,
      useNativeDriver: true,
    }).start();
  };

  const getFilteredAndSortedWords = (): VocabularyWord[] => {
    let filtered = words;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w =>
        w.word.toLowerCase().includes(query) ||
        w.pronunciation?.toLowerCase().includes(query) ||
        w.notes?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterBy === 'custom') {
      filtered = filtered.filter(w => w.isCustom);
    } else if (filterBy === 'industry') {
      filtered = filtered.filter(w => !w.isCustom && w.industrySet);
    } else if (filterBy === 'favorites') {
      filtered = filtered.filter(w => w.isFavorite);
    }

    // Apply sorting
    const sorted = [...filtered];
    if (sortBy === 'alphabetical') {
      sorted.sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortBy === 'usage') {
      sorted.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => a.category.localeCompare(b.category));
    }

    return sorted;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category: VocabularyCategory): string => {
    const cat = VOCABULARY_CATEGORIES.find(c => c.id === category);
    return cat?.color || '#6B7280';
  };

  const getCategoryIcon = (category: VocabularyCategory): keyof typeof Ionicons.glyphMap => {
    const cat = VOCABULARY_CATEGORIES.find(c => c.id === category);
    return cat?.icon || 'book-outline';
  };

  const getCategoryName = (category: VocabularyCategory): string => {
    const cat = VOCABULARY_CATEGORIES.find(c => c.id === category);
    return cat?.name || 'General';
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Custom Vocabulary</Text>
        <Text style={styles.headerSubtitle}>{words.length} words • {industrySets.filter(s => s.enabled).length} sets active</Text>
      </View>
      <TouchableOpacity style={styles.statsButton} onPress={handleShowStatistics} activeOpacity={0.7}>
        <Ionicons name="stats-chart" size={22} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search words, pronunciation, notes..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSortAndFilter = () => (
    <View style={styles.sortFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortFilterScroll}>
        <Text style={styles.sortFilterLabel}>Sort:</Text>
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.sortFilterChip, sortBy === option.id && styles.sortFilterChipActive]}
            onPress={() => handleSortChange(option.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={sortBy === option.id ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.sortFilterChipText, sortBy === option.id && styles.sortFilterChipTextActive]}>
              {option.name}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.sortFilterDivider} />
        <Text style={styles.sortFilterLabel}>Filter:</Text>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.sortFilterChip, filterBy === option.id && styles.sortFilterChipActive]}
            onPress={() => handleFilterChange(option.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={filterBy === option.id ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.sortFilterChipText, filterBy === option.id && styles.sortFilterChipTextActive]}>
              {option.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickActionButton} onPress={handleAddWord} activeOpacity={0.7}>
        <Ionicons name="add-circle" size={20} color="#3B82F6" />
        <Text style={styles.quickActionText}>Add Word</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton} onPress={handleShowIndustrySets} activeOpacity={0.7}>
        <Ionicons name="briefcase" size={20} color="#10B981" />
        <Text style={styles.quickActionText}>Industry Sets</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton} onPress={handleImportVocabulary} activeOpacity={0.7}>
        <Ionicons name="cloud-download" size={20} color="#8B5CF6" />
        <Text style={styles.quickActionText}>Import</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton} onPress={handleToggleSelectionMode} activeOpacity={0.7}>
        <Ionicons name={selectionMode ? "close-circle" : "checkmark-circle"} size={20} color={selectionMode ? "#EF4444" : "#F59E0B"} />
        <Text style={styles.quickActionText}>{selectionMode ? "Cancel" : "Select"}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelectionToolbar = () => {
    if (!selectionMode || selectedWords.size === 0) return null;

    return (
      <View style={styles.selectionToolbar}>
        <Text style={styles.selectionCount}>{selectedWords.size} selected</Text>
        <View style={styles.selectionActions}>
          <TouchableOpacity style={styles.selectionAction} onPress={handleBulkExport} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionAction} onPress={handleBulkDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionAction} onPress={handleDeselectAll} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderWordCard = (word: VocabularyWord) => {
    const isSelected = selectedWords.has(word.id);

    return (
      <TouchableOpacity
        key={word.id}
        style={[styles.wordCard, isSelected && styles.wordCardSelected]}
        onPress={() => selectionMode ? handleToggleSelection(word.id) : handleEditWord(word)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            handleToggleSelection(word.id);
          }
        }}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={styles.wordCardCheckbox}>
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={isSelected ? "#3B82F6" : "#9CA3AF"}
            />
          </View>
        )}
        <View style={styles.wordCardContent}>
          <View style={styles.wordCardHeader}>
            <View style={styles.wordCardTitleRow}>
              <Text style={styles.wordCardWord}>{word.word}</Text>
              {word.isFavorite && (
                <Ionicons name="star" size={16} color="#F59E0B" />
              )}
            </View>
            <View style={styles.wordCardBadges}>
              <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(word.category)}20` }]}>
                <Ionicons name={getCategoryIcon(word.category)} size={12} color={getCategoryColor(word.category)} />
                <Text style={[styles.categoryBadgeText, { color: getCategoryColor(word.category) }]}>
                  {getCategoryName(word.category)}
                </Text>
              </View>
              {word.isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>CUSTOM</Text>
                </View>
              )}
            </View>
          </View>
          {word.pronunciation && (
            <View style={styles.wordCardPronunciation}>
              <Ionicons name="volume-medium-outline" size={14} color="#6B7280" />
              <Text style={styles.pronunciationText}>{word.pronunciation}</Text>
            </View>
          )}
          {word.phonetic && (
            <Text style={styles.phoneticText}>{word.phonetic}</Text>
          )}
          {word.notes && (
            <Text style={styles.wordCardNotes} numberOfLines={2}>{word.notes}</Text>
          )}
          <View style={styles.wordCardFooter}>
            <View style={styles.wordCardStats}>
              <Ionicons name="trending-up-outline" size={14} color="#9CA3AF" />
              <Text style={styles.wordCardStatText}>{word.usageCount} uses</Text>
            </View>
            {word.lastUsed && (
              <Text style={styles.wordCardDate}>{formatDate(word.lastUsed)}</Text>
            )}
          </View>
        </View>
        {!selectionMode && (
          <View style={styles.wordCardActions}>
            <TouchableOpacity
              style={styles.wordCardAction}
              onPress={() => handleToggleFavorite(word.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={word.isFavorite ? "star" : "star-outline"}
                size={20}
                color={word.isFavorite ? "#F59E0B" : "#9CA3AF"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.wordCardAction}
              onPress={() => handleDeleteWord(word.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWordsList = () => {
    const filteredWords = getFilteredAndSortedWords();

    if (filteredWords.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#E5E7EB" />
          <Text style={styles.emptyStateTitle}>No Words Found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'Try a different search term' : 'Add your first custom word to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddWord} activeOpacity={0.7}>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>Add Word</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.wordsListContainer}>
        {filteredWords.map(renderWordCard)}
      </View>
    );
  };

  const renderIndustrySetsPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: industrySetsSlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Industry Sets</Text>
        <TouchableOpacity
          style={styles.panelClose}
          onPress={handleCloseIndustrySetsPanel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {industrySets.map((set) => (
          <View key={set.id} style={styles.industrySetCard}>
            <View style={styles.industrySetHeader}>
              <View style={[styles.industrySetIcon, { backgroundColor: set.enabled ? '#EFF6FF' : '#F3F4F6' }]}>
                <Ionicons name={set.icon} size={24} color={set.enabled ? '#3B82F6' : '#9CA3AF'} />
              </View>
              <View style={styles.industrySetInfo}>
                <Text style={styles.industrySetName}>{set.name}</Text>
                <Text style={styles.industrySetDescription}>{set.description}</Text>
                <Text style={styles.industrySetWordCount}>{set.wordCount} words</Text>
              </View>
              <Switch
                value={set.enabled}
                onValueChange={() => handleToggleIndustrySet(set.id)}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={set.enabled ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderStatisticsPanel = () => {
    if (!statistics) return null;

    return (
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: statsSlideAnim }],
          },
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Statistics</Text>
          <TouchableOpacity
            style={styles.panelClose}
            onPress={handleCloseStatisticsPanel}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="book" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{statistics.totalWords}</Text>
              <Text style={styles.statLabel}>Total Words</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="create" size={24} color="#10B981" />
              <Text style={styles.statValue}>{statistics.customWords}</Text>
              <Text style={styles.statLabel}>Custom</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="briefcase" size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{statistics.industryWords}</Text>
              <Text style={styles.statLabel}>Industry</Text>
            </View>
          </View>

          <View style={styles.statSection}>
            <Text style={styles.statSectionTitle}>Usage</Text>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Total Uses</Text>
              <Text style={styles.statRowValue}>{statistics.totalUsage}</Text>
            </View>
            {statistics.mostUsedWord && (
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Most Used</Text>
                <Text style={styles.statRowValue}>{statistics.mostUsedWord.word}</Text>
              </View>
            )}
          </View>

          <View style={styles.statSection}>
            <Text style={styles.statSectionTitle}>Categories</Text>
            {Object.entries(statistics.categoryCounts).map(([category, count]) => {
              if (count === 0) return null;
              return (
                <View key={category} style={styles.statRow}>
                  <View style={styles.statRowLabelWithIcon}>
                    <Ionicons
                      name={getCategoryIcon(category as VocabularyCategory)}
                      size={16}
                      color={getCategoryColor(category as VocabularyCategory)}
                    />
                    <Text style={styles.statRowLabel}>{getCategoryName(category as VocabularyCategory)}</Text>
                  </View>
                  <Text style={styles.statRowValue}>{count}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderHeader()}

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        >
          {renderSearchBar()}
          {renderSortAndFilter()}
          {renderQuickActions()}
          {renderSelectionToolbar()}
          {renderWordsList()}
        </ScrollView>
      </Animated.View>

      {/* Panels */}
      {showIndustrySetsPanel && renderIndustrySetsPanel()}
      {showStatisticsPanel && renderStatisticsPanel()}

      {/* Overlay */}
      {(showIndustrySetsPanel || showStatisticsPanel) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            if (showIndustrySetsPanel) handleCloseIndustrySetsPanel();
            if (showStatisticsPanel) handleCloseStatisticsPanel();
          }}
        />
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: BASE_UNIT * 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: Platform.OS === 'ios' ? BASE_UNIT * 14 : BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 3,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: BASE_UNIT * 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: BASE_UNIT * 0.5,
  },
  statsButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 2.5,
    gap: BASE_UNIT * 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Sort & Filter
  sortFilterContainer: {
    paddingVertical: BASE_UNIT * 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sortFilterScroll: {
    paddingHorizontal: BASE_UNIT * 4,
    gap: BASE_UNIT * 2,
    alignItems: 'center',
  },
  sortFilterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginRight: BASE_UNIT,
  },
  sortFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 1.5,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortFilterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  sortFilterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  sortFilterChipTextActive: {
    color: '#3B82F6',
  },
  sortFilterDivider: {
    width: 1,
    height: BASE_UNIT * 6,
    backgroundColor: '#E5E7EB',
    marginHorizontal: BASE_UNIT * 2,
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 3,
    gap: BASE_UNIT * 2,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2.5,
    paddingVertical: BASE_UNIT * 2.5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Selection Toolbar
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 3,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
  },
  selectionAction: {
    padding: BASE_UNIT * 2,
  },

  // Words List
  wordsListContainer: {
    paddingHorizontal: BASE_UNIT * 4,
    gap: BASE_UNIT * 3,
  },

  // Word Card
  wordCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  wordCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  wordCardCheckbox: {
    marginRight: BASE_UNIT * 3,
    justifyContent: 'center',
  },
  wordCardContent: {
    flex: 1,
    gap: BASE_UNIT * 1.5,
  },
  wordCardHeader: {
    gap: BASE_UNIT * 2,
  },
  wordCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  wordCardWord: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.2,
  },
  wordCardBadges: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT * 1.5,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customBadge: {
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT * 1.5,
    backgroundColor: '#F3F4F6',
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.5,
  },
  wordCardPronunciation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
  },
  pronunciationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    fontStyle: 'italic',
  },
  phoneticText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },
  wordCardNotes: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    lineHeight: 18,
  },
  wordCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: BASE_UNIT,
  },
  wordCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
  },
  wordCardStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  wordCardDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  wordCardActions: {
    flexDirection: 'column',
    gap: BASE_UNIT * 2,
    marginLeft: BASE_UNIT * 3,
    justifyContent: 'center',
  },
  wordCardAction: {
    padding: BASE_UNIT,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 16,
    paddingHorizontal: BASE_UNIT * 8,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    marginTop: BASE_UNIT * 4,
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'center',
    marginTop: BASE_UNIT * 2,
    lineHeight: 22,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    backgroundColor: '#3B82F6',
    paddingHorizontal: BASE_UNIT * 6,
    paddingVertical: BASE_UNIT * 3,
    borderRadius: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 6,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.2,
  },

  // Panel
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width * 0.85,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: Platform.OS === 'ios' ? BASE_UNIT * 14 : BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.3,
  },
  panelClose: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },

  // Industry Set Card
  industrySetCard: {
    marginBottom: BASE_UNIT * 3,
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  industrySetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
    gap: BASE_UNIT * 3,
  },
  industrySetIcon: {
    width: BASE_UNIT * 12,
    height: BASE_UNIT * 12,
    borderRadius: BASE_UNIT * 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  industrySetInfo: {
    flex: 1,
    gap: BASE_UNIT,
  },
  industrySetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.2,
  },
  industrySetDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    lineHeight: 18,
  },
  industrySetWordCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Statistics
  statsGrid: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'center',
  },
  statSection: {
    marginBottom: BASE_UNIT * 6,
  },
  statSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginBottom: BASE_UNIT * 3,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: BASE_UNIT * 2.5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statRowLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  statRowLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});

