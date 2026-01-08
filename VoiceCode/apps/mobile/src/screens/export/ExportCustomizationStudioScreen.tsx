import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { SettingsStackNavigationProp } from '../../navigation/types';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  format: ExportFormat;
  content: string;
  variables: TemplateVariable[];
  formatting: TemplateFormatting;
  isCustom: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface TemplateVariable {
  id: string;
  name: string;
  key: string;
  type: VariableType;
  defaultValue?: string;
  required: boolean;
  description: string;
}

export interface TemplateFormatting {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  backgroundColor: string;
  padding: number;
  margin: number;
  headerStyle?: TextStyle;
  bodyStyle?: TextStyle;
  footerStyle?: TextStyle;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '600' | '700';
  color: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
}

export interface TemplatePreview {
  id: string;
  templateId: string;
  content: string;
  generatedAt: string;
}

export type TemplateCategory = 'business' | 'academic' | 'legal' | 'medical' | 'meeting' | 'interview' | 'custom';
export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'html' | 'md';
export type VariableType = 'text' | 'date' | 'time' | 'number' | 'speaker' | 'duration' | 'custom';
export type EditorMode = 'edit' | 'preview' | 'split';
export type ViewMode = 'grid' | 'list';

// ============================================================================
// Constants
// ============================================================================

const BASE_UNIT = 4;

const TEMPLATE_CATEGORIES: Array<{ id: TemplateCategory; name: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { id: 'business', name: 'Business', icon: 'briefcase', color: '#3B82F6' },
  { id: 'academic', name: 'Academic', icon: 'school', color: '#8B5CF6' },
  { id: 'legal', name: 'Legal', icon: 'hammer', color: '#EF4444' },
  { id: 'medical', name: 'Medical', icon: 'medical', color: '#10B981' },
  { id: 'meeting', name: 'Meeting', icon: 'people', color: '#F59E0B' },
  { id: 'interview', name: 'Interview', icon: 'mic', color: '#EC4899' },
  { id: 'custom', name: 'Custom', icon: 'create', color: '#6B7280' },
];

const EXPORT_FORMATS: Array<{ id: ExportFormat; name: string; icon: keyof typeof Ionicons.glyphMap; extension: string }> = [
  { id: 'pdf', name: 'PDF', icon: 'document-text', extension: '.pdf' },
  { id: 'docx', name: 'Word', icon: 'document', extension: '.docx' },
  { id: 'txt', name: 'Text', icon: 'document-outline', extension: '.txt' },
  { id: 'html', name: 'HTML', icon: 'code', extension: '.html' },
  { id: 'md', name: 'Markdown', icon: 'logo-markdown', extension: '.md' },
];

const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { id: '1', name: 'Title', key: '{{title}}', type: 'text', required: true, description: 'Transcript title' },
  { id: '2', name: 'Date', key: '{{date}}', type: 'date', required: false, description: 'Recording date' },
  { id: '3', name: 'Time', key: '{{time}}', type: 'time', required: false, description: 'Recording time' },
  { id: '4', name: 'Duration', key: '{{duration}}', type: 'duration', required: false, description: 'Recording duration' },
  { id: '5', name: 'Speaker', key: '{{speaker}}', type: 'speaker', required: false, description: 'Speaker name' },
  { id: '6', name: 'Content', key: '{{content}}', type: 'text', required: true, description: 'Transcript content' },
  { id: '7', name: 'Summary', key: '{{summary}}', type: 'text', required: false, description: 'AI-generated summary' },
  { id: '8', name: 'Keywords', key: '{{keywords}}', type: 'text', required: false, description: 'Key topics' },
  { id: '9', name: 'Action Items', key: '{{action_items}}', type: 'text', required: false, description: 'Action items' },
  { id: '10', name: 'Page Number', key: '{{page}}', type: 'number', required: false, description: 'Current page number' },
];

const FONT_FAMILIES = [
  { id: 'system', name: 'System', value: Platform.OS === 'ios' ? 'SF Pro Text' : 'System' },
  { id: 'serif', name: 'Serif', value: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  { id: 'mono', name: 'Monospace', value: Platform.OS === 'ios' ? 'SF Mono' : 'monospace' },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32];

const TEXT_COLORS = [
  { id: 'black', name: 'Black', value: '#000000' },
  { id: 'dark', name: 'Dark Gray', value: '#111827' },
  { id: 'gray', name: 'Gray', value: '#6B7280' },
  { id: 'blue', name: 'Blue', value: '#3B82F6' },
  { id: 'red', name: 'Red', value: '#EF4444' },
];

// ============================================================================
// Component
// ============================================================================

export default function ExportCustomizationStudioScreen() {
  const navigation = useNavigation<SettingsStackNavigationProp>();

  // State
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<TemplateCategory | 'all'>('all');
  const [filterFormat, setFilterFormat] = useState<ExportFormat | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [showFormattingPanel, setShowFormattingPanel] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const variablesPanelSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const formattingPanelSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const previewPanelSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadData();
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
    animatePanel(variablesPanelSlideAnim, showVariablesPanel);
  }, [showVariablesPanel]);

  useEffect(() => {
    animatePanel(formattingPanelSlideAnim, showFormattingPanel);
  }, [showFormattingPanel]);

  useEffect(() => {
    animatePanel(previewPanelSlideAnim, showPreviewPanel);
  }, [showPreviewPanel]);

  // ============================================================================
  // Data Management
  // ============================================================================

  const loadData = async () => {
    await Promise.all([loadTemplates()]);
  };

  const loadTemplates = async () => {
    try {
      const stored = await AsyncStorage.getItem('export_templates');
      if (stored) {
        setTemplates(JSON.parse(stored));
      } else {
        // Load mock templates
        const mockTemplates: ExportTemplate[] = [
          {
            id: '1',
            name: 'Professional Meeting Notes',
            description: 'Clean, professional format for meeting transcripts',
            category: 'meeting',
            format: 'pdf',
            content: '# {{title}}\n\n**Date:** {{date}}\n**Duration:** {{duration}}\n\n## Summary\n{{summary}}\n\n## Transcript\n{{content}}\n\n## Action Items\n{{action_items}}',
            variables: TEMPLATE_VARIABLES.filter(v => ['title', 'date', 'duration', 'summary', 'content', 'action_items'].includes(v.key.replace(/[{}]/g, ''))),
            formatting: {
              fontFamily: 'SF Pro Text',
              fontSize: 14,
              lineHeight: 1.6,
              textAlign: 'left',
              color: '#111827',
              backgroundColor: '#FFFFFF',
              padding: 16,
              margin: 16,
              headerStyle: { fontFamily: 'SF Pro Display', fontSize: 24, fontWeight: '700', color: '#111827' },
              bodyStyle: { fontFamily: 'SF Pro Text', fontSize: 14, fontWeight: 'normal', color: '#374151' },
            },
            isCustom: false,
            isFavorite: true,
            usageCount: 45,
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            name: 'Academic Lecture Notes',
            description: 'Structured format for academic lectures and seminars',
            category: 'academic',
            format: 'docx',
            content: '# {{title}}\n\n**Course:** {{course}}\n**Date:** {{date}}\n**Speaker:** {{speaker}}\n\n## Key Points\n{{keywords}}\n\n## Lecture Content\n{{content}}\n\n## Summary\n{{summary}}',
            variables: TEMPLATE_VARIABLES.filter(v => ['title', 'date', 'speaker', 'keywords', 'content', 'summary'].includes(v.key.replace(/[{}]/g, ''))),
            formatting: {
              fontFamily: 'Georgia',
              fontSize: 12,
              lineHeight: 1.8,
              textAlign: 'justify',
              color: '#000000',
              backgroundColor: '#FFFFFF',
              padding: 24,
              margin: 24,
              headerStyle: { fontFamily: 'Georgia', fontSize: 20, fontWeight: '700', color: '#000000' },
              bodyStyle: { fontFamily: 'Georgia', fontSize: 12, fontWeight: 'normal', color: '#000000' },
            },
            isCustom: false,
            isFavorite: false,
            usageCount: 28,
            lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            name: 'Legal Deposition',
            description: 'Formal legal deposition format with timestamps',
            category: 'legal',
            format: 'pdf',
            content: '# DEPOSITION OF {{speaker}}\n\n**Case:** {{title}}\n**Date:** {{date}}\n**Time:** {{time}}\n**Duration:** {{duration}}\n\n---\n\n{{content}}\n\n---\n\n**End of Deposition**\nPage {{page}}',
            variables: TEMPLATE_VARIABLES.filter(v => ['title', 'date', 'time', 'duration', 'speaker', 'content', 'page'].includes(v.key.replace(/[{}]/g, ''))),
            formatting: {
              fontFamily: 'System',
              fontSize: 12,
              lineHeight: 2.0,
              textAlign: 'left',
              color: '#000000',
              backgroundColor: '#FFFFFF',
              padding: 32,
              margin: 32,
              headerStyle: { fontFamily: 'System', fontSize: 16, fontWeight: '700', color: '#000000', textTransform: 'uppercase' },
              bodyStyle: { fontFamily: 'System', fontSize: 12, fontWeight: 'normal', color: '#000000' },
            },
            isCustom: false,
            isFavorite: true,
            usageCount: 12,
            lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setTemplates(mockTemplates);
        await AsyncStorage.setItem('export_templates', JSON.stringify(mockTemplates));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplates = async (updatedTemplates: ExportTemplate[]) => {
    try {
      await AsyncStorage.setItem('export_templates', JSON.stringify(updatedTemplates));
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateTemplate = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newTemplate: ExportTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      description: 'Custom export template',
      category: 'custom',
      format: 'pdf',
      content: '# {{title}}\n\n{{content}}',
      variables: TEMPLATE_VARIABLES.filter(v => ['title', 'content'].includes(v.key.replace(/[{}]/g, ''))),
      formatting: {
        fontFamily: 'SF Pro Text',
        fontSize: 14,
        lineHeight: 1.6,
        textAlign: 'left',
        color: '#111827',
        backgroundColor: '#FFFFFF',
        padding: 16,
        margin: 16,
      },
      isCustom: true,
      isFavorite: false,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTemplate(newTemplate);
    setEditorMode('edit');
  };

  const handleSelectTemplate = (template: ExportTemplate) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTemplate(template);
    setEditingTemplate(template);
    setEditorMode('edit');
    generatePreview(template);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const updatedTemplate = {
      ...editingTemplate,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = templates.findIndex(t => t.id === updatedTemplate.id);
    let updatedTemplates: ExportTemplate[];

    if (existingIndex >= 0) {
      updatedTemplates = [...templates];
      updatedTemplates[existingIndex] = updatedTemplate;
    } else {
      updatedTemplates = [...templates, updatedTemplate];
    }

    await saveTemplates(updatedTemplates);
    setEditingTemplate(null);
    setSelectedTemplate(null);

    Alert.alert('Success', 'Template saved successfully');
  };

  const handleDeleteTemplate = (template: ExportTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            const updatedTemplates = templates.filter(t => t.id !== template.id);
            await saveTemplates(updatedTemplates);
            if (selectedTemplate?.id === template.id) {
              setSelectedTemplate(null);
              setEditingTemplate(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (template: ExportTemplate) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updatedTemplates = templates.map(t =>
      t.id === template.id ? { ...t, isFavorite: !t.isFavorite, updatedAt: new Date().toISOString() } : t
    );
    await saveTemplates(updatedTemplates);
  };

  const handleDuplicateTemplate = async (template: ExportTemplate) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const duplicatedTemplate: ExportTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      isCustom: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedTemplates = [...templates, duplicatedTemplate];
    await saveTemplates(updatedTemplates);
  };

  const handleExportTemplate = (template: ExportTemplate) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('Export Template', `Export "${template.name}" to file?\n\nThis feature will be available in a future update.`);
  };

  const handleImportTemplate = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('Import Template', 'Import template from file?\n\nThis feature will be available in a future update.');
  };
  const handleInsertVariable = (variable: TemplateVariable) => {
    if (!editingTemplate) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const updatedContent = editingTemplate.content + ' ' + variable.key;
    setEditingTemplate({
      ...editingTemplate,
      content: updatedContent,
      variables: [...editingTemplate.variables, variable],
    });
  };

  const handleUpdateFormatting = (key: keyof TemplateFormatting, value: any) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      formatting: {
        ...editingTemplate.formatting,
        [key]: value,
      },
    });
  };

  const handleShowVariablesPanel = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowVariablesPanel(true);
  };

  const handleCloseVariablesPanel = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowVariablesPanel(false);
  };

  const handleShowFormattingPanel = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowFormattingPanel(true);
  };

  const handleCloseFormattingPanel = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowFormattingPanel(false);
  };

  const handleShowPreviewPanel = () => {
    if (!editingTemplate) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    generatePreview(editingTemplate);
    setShowPreviewPanel(true);
  };

  const handleClosePreviewPanel = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPreviewPanel(false);
  };

  const handleEditorModeChange = (mode: EditorMode) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditorMode(mode);
    if (mode === 'preview' && editingTemplate) {
      generatePreview(editingTemplate);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setViewMode(mode);
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

  const generatePreview = (template: ExportTemplate) => {
    // Replace variables with sample data
    let preview = template.content;
    preview = preview.replace(/{{title}}/g, 'Sample Meeting Notes');
    preview = preview.replace(/{{date}}/g, new Date().toLocaleDateString());
    preview = preview.replace(/{{time}}/g, new Date().toLocaleTimeString());
    preview = preview.replace(/{{duration}}/g, '45 minutes');
    preview = preview.replace(/{{speaker}}/g, 'John Doe');
    preview = preview.replace(/{{content}}/g, 'This is a sample transcript content. It demonstrates how your template will look with actual data.');
    preview = preview.replace(/{{summary}}/g, 'This is a sample summary of the meeting.');
    preview = preview.replace(/{{keywords}}/g, 'Meeting, Discussion, Action Items');
    preview = preview.replace(/{{action_items}}/g, '1. Follow up on project timeline\n2. Schedule next meeting\n3. Review budget');
    preview = preview.replace(/{{page}}/g, '1');
    preview = preview.replace(/{{course}}/g, 'Introduction to Computer Science');

    setPreviewContent(preview);
  };

  const getFilteredTemplates = (): ExportTemplate[] => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Apply format filter
    if (filterFormat !== 'all') {
      filtered = filtered.filter(t => t.format === filterFormat);
    }

    return filtered;
  };

  const getCategoryColor = (category: TemplateCategory): string => {
    return TEMPLATE_CATEGORIES.find(c => c.id === category)?.color || '#6B7280';
  };

  const getCategoryIcon = (category: TemplateCategory): keyof typeof Ionicons.glyphMap => {
    return TEMPLATE_CATEGORIES.find(c => c.id === category)?.icon || 'create';
  };

  const getFormatIcon = (format: ExportFormat): keyof typeof Ionicons.glyphMap => {
    return EXPORT_FORMATS.find(f => f.id === format)?.icon || 'document';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Export Studio</Text>
        <Text style={styles.headerSubtitle}>{templates.length} templates</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')} style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCreateTemplate} style={styles.headerButton} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <TouchableOpacity
          onPress={() => setFilterCategory('all')}
          style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterCategory === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {TEMPLATE_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setFilterCategory(category.id)}
            style={[styles.filterChip, filterCategory === category.id && styles.filterChipActive]}
            activeOpacity={0.7}
          >
            <Ionicons name={category.icon} size={16} color={filterCategory === category.id ? '#FFFFFF' : category.color} />
            <Text style={[styles.filterChipText, filterCategory === category.id && styles.filterChipTextActive]}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <TouchableOpacity
          onPress={() => setFilterFormat('all')}
          style={[styles.filterChip, filterFormat === 'all' && styles.filterChipActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterFormat === 'all' && styles.filterChipTextActive]}>All Formats</Text>
        </TouchableOpacity>
        {EXPORT_FORMATS.map(format => (
          <TouchableOpacity
            key={format.id}
            onPress={() => setFilterFormat(format.id)}
            style={[styles.filterChip, filterFormat === format.id && styles.filterChipActive]}
            activeOpacity={0.7}
          >
            <Ionicons name={format.icon} size={16} color={filterFormat === format.id ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.filterChipText, filterFormat === format.id && styles.filterChipTextActive]}>{format.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTemplateCard = (template: ExportTemplate) => (
    <TouchableOpacity
      key={template.id}
      onPress={() => handleSelectTemplate(template)}
      style={[styles.templateCard, viewMode === 'list' && styles.templateCardList]}
      activeOpacity={0.7}
    >
      <View style={styles.templateCardHeader}>
        <View style={[styles.templateCategoryBadge, { backgroundColor: getCategoryColor(template.category) + '20' }]}>
          <Ionicons name={getCategoryIcon(template.category)} size={16} color={getCategoryColor(template.category)} />
        </View>
        <TouchableOpacity onPress={() => handleToggleFavorite(template)} activeOpacity={0.7}>
          <Ionicons name={template.isFavorite ? 'star' : 'star-outline'} size={20} color={template.isFavorite ? '#F59E0B' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>

      <Text style={styles.templateCardTitle}>{template.name}</Text>
      <Text style={styles.templateCardDescription} numberOfLines={2}>{template.description}</Text>

      <View style={styles.templateCardMeta}>
        <View style={styles.templateMetaItem}>
          <Ionicons name={getFormatIcon(template.format)} size={14} color="#6B7280" />
          <Text style={styles.templateMetaText}>{template.format.toUpperCase()}</Text>
        </View>
        <View style={styles.templateMetaItem}>
          <Ionicons name="eye" size={14} color="#6B7280" />
          <Text style={styles.templateMetaText}>{template.usageCount} uses</Text>
        </View>
        {template.lastUsed && (
          <View style={styles.templateMetaItem}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.templateMetaText}>{formatDate(template.lastUsed)}</Text>
          </View>
        )}
      </View>

      {template.isCustom && (
        <View style={styles.customBadge}>
          <Text style={styles.customBadgeText}>CUSTOM</Text>
        </View>
      )}

      <View style={styles.templateCardActions}>
        <TouchableOpacity onPress={() => handleDuplicateTemplate(template)} style={styles.templateActionButton} activeOpacity={0.7}>
          <Ionicons name="copy" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleExportTemplate(template)} style={styles.templateActionButton} activeOpacity={0.7}>
          <Ionicons name="share" size={18} color="#6B7280" />
        </TouchableOpacity>
        {template.isCustom && (
          <TouchableOpacity onPress={() => handleDeleteTemplate(template)} style={styles.templateActionButton} activeOpacity={0.7}>
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTemplateLibrary = () => {
    const filteredTemplates = getFilteredTemplates();

    if (filteredTemplates.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No Templates Found</Text>
          <Text style={styles.emptyStateText}>Try adjusting your search or filters</Text>
          <TouchableOpacity onPress={handleCreateTemplate} style={styles.emptyStateButton} activeOpacity={0.7}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.emptyStateButtonText}>Create Template</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (viewMode === 'grid') {
      return (
        <View style={styles.templateGrid}>
          {filteredTemplates.map(template => renderTemplateCard(template))}
        </View>
      );
    }

    return (
      <View style={styles.templateList}>
        {filteredTemplates.map(template => renderTemplateCard(template))}
      </View>
    );
  };
  const renderTemplateEditor = () => {
    if (!editingTemplate) return null;

    return (
      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorTitle}>Template Editor</Text>
          <View style={styles.editorModeToggle}>
            <TouchableOpacity
              onPress={() => handleEditorModeChange('edit')}
              style={[styles.editorModeButton, editorMode === 'edit' && styles.editorModeButtonActive]}
              activeOpacity={0.7}
            >
              <Ionicons name="create" size={16} color={editorMode === 'edit' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.editorModeButtonText, editorMode === 'edit' && styles.editorModeButtonTextActive]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleEditorModeChange('preview')}
              style={[styles.editorModeButton, editorMode === 'preview' && styles.editorModeButtonActive]}
              activeOpacity={0.7}
            >
              <Ionicons name="eye" size={16} color={editorMode === 'preview' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.editorModeButtonText, editorMode === 'preview' && styles.editorModeButtonTextActive]}>Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.editorToolbar}>
          <TouchableOpacity onPress={handleShowVariablesPanel} style={styles.toolbarButton} activeOpacity={0.7}>
            <Ionicons name="code" size={18} color="#3B82F6" />
            <Text style={styles.toolbarButtonText}>Variables</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShowFormattingPanel} style={styles.toolbarButton} activeOpacity={0.7}>
            <Ionicons name="color-palette" size={18} color="#8B5CF6" />
            <Text style={styles.toolbarButtonText}>Formatting</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShowPreviewPanel} style={styles.toolbarButton} activeOpacity={0.7}>
            <Ionicons name="eye" size={18} color="#10B981" />
            <Text style={styles.toolbarButtonText}>Preview</Text>
          </TouchableOpacity>
        </View>

        {editorMode === 'edit' ? (
          <View style={styles.editorContent}>
            <View style={styles.editorField}>
              <Text style={styles.editorLabel}>Template Name</Text>
              <TextInput
                style={styles.editorInput}
                value={editingTemplate.name}
                onChangeText={text => setEditingTemplate({ ...editingTemplate, name: text })}
                placeholder="Enter template name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.editorField}>
              <Text style={styles.editorLabel}>Description</Text>
              <TextInput
                style={styles.editorInput}
                value={editingTemplate.description}
                onChangeText={text => setEditingTemplate({ ...editingTemplate, description: text })}
                placeholder="Enter description"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.editorField}>
              <Text style={styles.editorLabel}>Template Content</Text>
              <TextInput
                style={[styles.editorInput, styles.editorTextArea]}
                value={editingTemplate.content}
                onChangeText={text => setEditingTemplate({ ...editingTemplate, content: text })}
                placeholder="Enter template content with variables like {{title}}, {{content}}, etc."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.editorActions}>
              <TouchableOpacity onPress={() => setEditingTemplate(null)} style={styles.editorCancelButton} activeOpacity={0.7}>
                <Text style={styles.editorCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveTemplate} style={styles.editorSaveButton} activeOpacity={0.7}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.editorSaveButtonText}>Save Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.previewContent}>
            <Text style={styles.previewText}>{previewContent}</Text>
          </ScrollView>
        )}
      </View>
    );
  };

  const renderVariablesPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: variablesPanelSlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Template Variables</Text>
        <TouchableOpacity onPress={handleCloseVariablesPanel} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent}>
        <Text style={styles.panelDescription}>Click a variable to insert it into your template</Text>
        {TEMPLATE_VARIABLES.map(variable => (
          <TouchableOpacity
            key={variable.id}
            onPress={() => handleInsertVariable(variable)}
            style={styles.variableItem}
            activeOpacity={0.7}
          >
            <View style={styles.variableHeader}>
              <Text style={styles.variableName}>{variable.name}</Text>
              <View style={[styles.variableTypeBadge, { backgroundColor: variable.required ? '#EF4444' : '#6B7280' }]}>
                <Text style={styles.variableTypeBadgeText}>{variable.required ? 'Required' : 'Optional'}</Text>
              </View>
            </View>
            <Text style={styles.variableKey}>{variable.key}</Text>
            <Text style={styles.variableDescription}>{variable.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderFormattingPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: formattingPanelSlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Formatting Options</Text>
        <TouchableOpacity onPress={handleCloseFormattingPanel} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent}>
        {editingTemplate && (
          <>
            <View style={styles.formattingSection}>
              <Text style={styles.formattingSectionTitle}>Font Family</Text>
              {FONT_FAMILIES.map(font => (
                <TouchableOpacity
                  key={font.id}
                  onPress={() => handleUpdateFormatting('fontFamily', font.value)}
                  style={styles.formattingOption}
                  activeOpacity={0.7}
                >
                  <Text style={styles.formattingOptionText}>{font.name}</Text>
                  {editingTemplate.formatting.fontFamily === font.value && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formattingSection}>
              <Text style={styles.formattingSectionTitle}>Font Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {FONT_SIZES.map(size => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => handleUpdateFormatting('fontSize', size)}
                    style={[
                      styles.fontSizeChip,
                      editingTemplate.formatting.fontSize === size && styles.fontSizeChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.fontSizeChipText,
                      editingTemplate.formatting.fontSize === size && styles.fontSizeChipTextActive,
                    ]}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
  const renderPreviewPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: previewPanelSlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Template Preview</Text>
        <TouchableOpacity onPress={handleClosePreviewPanel} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>{previewContent}</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        {renderHeader()}
        {renderSearchAndFilters()}
        {editingTemplate ? renderTemplateEditor() : renderTemplateLibrary()}
      </ScrollView>

      {showVariablesPanel && renderVariablesPanel()}
      {showFormattingPanel && renderFormattingPanel()}
      {showPreviewPanel && renderPreviewPanel()}

      {(showVariablesPanel || showFormattingPanel || showPreviewPanel) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            setShowVariablesPanel(false);
            setShowFormattingPanel(false);
            setShowPreviewPanel(false);
          }}
        />
      )}
    </Animated.View>
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
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
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
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: BASE_UNIT * 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  headerButton: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search & Filters
  searchContainer: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 3,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    paddingHorizontal: BASE_UNIT * 3,
    height: BASE_UNIT * 11,
    marginBottom: BASE_UNIT * 3,
  },
  searchIcon: {
    marginRight: BASE_UNIT * 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  filtersScroll: {
    marginBottom: BASE_UNIT * 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#F9FAFB',
    marginRight: BASE_UNIT * 2,
    gap: BASE_UNIT,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Template Library
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: BASE_UNIT * 3,
    gap: BASE_UNIT * 3,
  },
  templateList: {
    paddingHorizontal: BASE_UNIT * 4,
    gap: BASE_UNIT * 3,
  },
  templateCard: {
    width: (Dimensions.get('window').width - BASE_UNIT * 18) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  templateCardList: {
    width: '100%',
  },
  templateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 3,
  },
  templateCategoryBadge: {
    width: BASE_UNIT * 8,
    height: BASE_UNIT * 8,
    borderRadius: BASE_UNIT * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: BASE_UNIT * 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  templateCardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: BASE_UNIT * 3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  templateCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 3,
  },
  templateMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
  },
  templateMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  customBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT,
    marginBottom: BASE_UNIT * 3,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  templateCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: BASE_UNIT * 2,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: BASE_UNIT * 3,
  },
  templateActionButton: {
    width: BASE_UNIT * 9,
    height: BASE_UNIT * 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BASE_UNIT * 2,
    backgroundColor: '#F9FAFB',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: BASE_UNIT * 16,
    paddingHorizontal: BASE_UNIT * 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: BASE_UNIT * 4,
    marginBottom: BASE_UNIT * 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: BASE_UNIT * 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: BASE_UNIT * 6,
    paddingVertical: BASE_UNIT * 3,
    borderRadius: BASE_UNIT * 3,
    gap: BASE_UNIT * 2,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Template Editor
  editorContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 4,
    margin: BASE_UNIT * 4,
    overflow: 'hidden',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  editorModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 0.5,
  },
  editorModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 1.5,
    gap: BASE_UNIT,
  },
  editorModeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  editorModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  editorModeButtonTextActive: {
    color: '#FFFFFF',
  },
  editorToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: BASE_UNIT * 3,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 2,
    backgroundColor: '#F9FAFB',
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  editorContent: {
    padding: BASE_UNIT * 4,
  },
  editorField: {
    marginBottom: BASE_UNIT * 4,
  },
  editorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: BASE_UNIT * 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  editorInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 2,
    paddingHorizontal: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 3,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  editorTextArea: {
    minHeight: BASE_UNIT * 40,
    paddingTop: BASE_UNIT * 3,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 4,
  },
  editorCancelButton: {
    paddingHorizontal: BASE_UNIT * 6,
    paddingVertical: BASE_UNIT * 3,
    borderRadius: BASE_UNIT * 3,
    backgroundColor: '#F9FAFB',
  },
  editorCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  editorSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 6,
    paddingVertical: BASE_UNIT * 3,
    borderRadius: BASE_UNIT * 3,
    backgroundColor: '#3B82F6',
    gap: BASE_UNIT * 2,
  },
  editorSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  previewContent: {
    padding: BASE_UNIT * 4,
    backgroundColor: '#FFFFFF',
  },
  previewText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Panels
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: BASE_UNIT * 4,
    paddingTop: Platform.OS === 'ios' ? BASE_UNIT * 14 : BASE_UNIT * 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  panelContent: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },
  panelDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: BASE_UNIT * 4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Variables Panel
  variableItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    marginBottom: BASE_UNIT * 3,
  },
  variableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  variableName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  variableTypeBadge: {
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
    borderRadius: BASE_UNIT,
  },
  variableTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  variableKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: BASE_UNIT,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },
  variableDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Formatting Panel
  formattingSection: {
    marginBottom: BASE_UNIT * 6,
  },
  formattingSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: BASE_UNIT * 3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  formattingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: BASE_UNIT * 3,
    paddingHorizontal: BASE_UNIT * 4,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
  },
  formattingOptionText: {
    fontSize: 15,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  fontSizeChip: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: BASE_UNIT * 2,
    backgroundColor: '#F9FAFB',
    marginRight: BASE_UNIT * 2,
  },
  fontSizeChipActive: {
    backgroundColor: '#3B82F6',
  },
  fontSizeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  fontSizeChipTextActive: {
    color: '#FFFFFF',
  },

  // Preview Panel
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});








