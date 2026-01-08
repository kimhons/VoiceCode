// VoiceFlow Pro Mobile - Advanced Export Formats Screen
// Week 8 Day 50-51: Advanced export formats with template customization, batch operations, and export history
// Phase 2: Advanced Features

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Switch,
  TextInput,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types & Interfaces
// ============================================================================

type AdvancedExportFormatsScreenRouteProp = RouteProp<SettingsStackParamList, 'AdvancedExportFormats'>;
type AdvancedExportFormatsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'AdvancedExportFormats'
>;

interface Props {
  route: AdvancedExportFormatsScreenRouteProp;
  navigation: AdvancedExportFormatsScreenNavigationProp;
}

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'srt' | 'vtt' | 'json' | 'html' | 'md';
export type ExportQuality = 'draft' | 'standard' | 'high' | 'premium';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type TemplateCategory = 'business' | 'academic' | 'legal' | 'medical' | 'custom';

export interface ExportFormatConfig {
  id: string;
  format: ExportFormat;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  fileExtension: string;
  supportedFeatures: ExportFeature[];
  quality: ExportQuality;
  enabled: boolean;
  customSettings?: Record<string, any>;
}

export interface ExportFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  format: ExportFormat;
  thumbnail?: string;
  settings: TemplateSettings;
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
}

export interface TemplateSettings {
  includeTimestamps: boolean;
  includeSpeakerNames: boolean;
  includeConfidenceScores: boolean;
  includeMetadata: boolean;
  pageSize?: 'letter' | 'a4' | 'legal';
  fontSize?: number;
  fontFamily?: string;
  margins?: { top: number; right: number; bottom: number; left: number };
  headerText?: string;
  footerText?: string;
  watermark?: string;
  colorScheme?: 'default' | 'dark' | 'light' | 'custom';
}

export interface ExportHistoryItem {
  id: string;
  transcriptId: string;
  transcriptTitle: string;
  format: ExportFormat;
  template?: string;
  status: ExportStatus;
  progress: number;
  fileSize?: number;
  filePath?: string;
  exportedAt: string;
  completedAt?: string;
  error?: string;
  quality: ExportQuality;
}

export interface BatchExportJob {
  id: string;
  name: string;
  transcriptIds: string[];
  format: ExportFormat;
  template?: string;
  status: ExportStatus;
  progress: number;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  createdAt: string;
  completedAt?: string;
}

export interface ExportStatistics {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  totalSize: number;
  averageExportTime: number;
  mostUsedFormat: ExportFormat;
  mostUsedTemplate: string;
  exportsByFormat: Record<ExportFormat, number>;
  exportsByQuality: Record<ExportQuality, number>;
}

// ============================================================================
// Constants
// ============================================================================

const BASE_UNIT = 4;

const EXPORT_FORMATS: ExportFormatConfig[] = [
  {
    id: 'pdf',
    format: 'pdf',
    name: 'PDF Document',
    description: 'Professional document format with formatting',
    icon: 'document-text',
    fileExtension: '.pdf',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Include time markers', enabled: true, icon: 'time' },
      { id: 'speakers', name: 'Speaker Names', description: 'Include speaker labels', enabled: true, icon: 'people' },
      { id: 'formatting', name: 'Rich Formatting', description: 'Bold, italic, headings', enabled: true, icon: 'text' },
    ],
    quality: 'high',
    enabled: true,
  },
  {
    id: 'docx',
    format: 'docx',
    name: 'Word Document',
    description: 'Editable Microsoft Word format',
    icon: 'document',
    fileExtension: '.docx',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Include time markers', enabled: true, icon: 'time' },
      { id: 'speakers', name: 'Speaker Names', description: 'Include speaker labels', enabled: true, icon: 'people' },
      { id: 'formatting', name: 'Rich Formatting', description: 'Bold, italic, headings', enabled: true, icon: 'text' },
      { id: 'comments', name: 'Comments', description: 'Add review comments', enabled: false, icon: 'chatbox' },
    ],
    quality: 'high',
    enabled: true,
  },
  {
    id: 'txt',
    format: 'txt',
    name: 'Plain Text',
    description: 'Simple text file, universal compatibility',
    icon: 'document-outline',
    fileExtension: '.txt',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Include time markers', enabled: true, icon: 'time' },
      { id: 'speakers', name: 'Speaker Names', description: 'Include speaker labels', enabled: true, icon: 'people' },
    ],
    quality: 'standard',
    enabled: true,
  },
  {
    id: 'srt',
    format: 'srt',
    name: 'SRT Subtitles',
    description: 'SubRip subtitle format for video',
    icon: 'videocam',
    fileExtension: '.srt',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Required for subtitles', enabled: true, icon: 'time' },
      { id: 'maxLength', name: 'Max Line Length', description: 'Limit characters per line', enabled: true, icon: 'resize' },
    ],
    quality: 'standard',
    enabled: true,
  },
  {
    id: 'vtt',
    format: 'vtt',
    name: 'WebVTT Subtitles',
    description: 'Web Video Text Tracks format',
    icon: 'play-circle',
    fileExtension: '.vtt',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Required for subtitles', enabled: true, icon: 'time' },
      { id: 'styling', name: 'Styling', description: 'CSS styling support', enabled: false, icon: 'color-palette' },
    ],
    quality: 'standard',
    enabled: true,
  },
  {
    id: 'json',
    format: 'json',
    name: 'JSON Data',
    description: 'Structured data for developers',
    icon: 'code-slash',
    fileExtension: '.json',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Include time markers', enabled: true, icon: 'time' },
      { id: 'speakers', name: 'Speaker Names', description: 'Include speaker labels', enabled: true, icon: 'people' },
      { id: 'confidence', name: 'Confidence Scores', description: 'Include AI confidence', enabled: true, icon: 'analytics' },
      { id: 'metadata', name: 'Full Metadata', description: 'All available data', enabled: true, icon: 'information-circle' },
    ],
    quality: 'premium',
    enabled: true,
  },
  {
    id: 'html',
    format: 'html',
    name: 'HTML Document',
    description: 'Web page format with styling',
    icon: 'globe',
    fileExtension: '.html',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Include time markers', enabled: true, icon: 'time' },
      { id: 'speakers', name: 'Speaker Names', description: 'Include speaker labels', enabled: true, icon: 'people' },
      { id: 'formatting', name: 'Rich Formatting', description: 'HTML styling', enabled: true, icon: 'text' },
      { id: 'interactive', name: 'Interactive', description: 'Clickable timestamps', enabled: false, icon: 'hand-left' },
    ],
    quality: 'high',
    enabled: true,
  },
  {
    id: 'md',
    format: 'md',
    name: 'Markdown',
    description: 'Lightweight markup format',
    icon: 'logo-markdown',
    fileExtension: '.md',
    supportedFeatures: [
      { id: 'timestamps', name: 'Timestamps', description: 'Include time markers', enabled: true, icon: 'time' },
      { id: 'speakers', name: 'Speaker Names', description: 'Include speaker labels', enabled: true, icon: 'people' },
      { id: 'formatting', name: 'Markdown Formatting', description: 'Headers, lists, etc.', enabled: true, icon: 'text' },
    ],
    quality: 'standard',
    enabled: true,
  },
];

const TEMPLATE_CATEGORIES: { id: TemplateCategory; name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'academic', name: 'Academic', icon: 'school' },
  { id: 'legal', name: 'Legal', icon: 'hammer' },
  { id: 'medical', name: 'Medical', icon: 'medical' },
  { id: 'custom', name: 'Custom', icon: 'create' },
];

const QUALITY_LEVELS: { id: ExportQuality; name: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'draft', name: 'Draft', description: 'Quick export, basic formatting', icon: 'flash' },
  { id: 'standard', name: 'Standard', description: 'Balanced quality and speed', icon: 'checkmark-circle' },
  { id: 'high', name: 'High', description: 'Enhanced formatting and features', icon: 'star' },
  { id: 'premium', name: 'Premium', description: 'Maximum quality, all features', icon: 'diamond' },
];

// ============================================================================
// Component
// ============================================================================

export function AdvancedExportFormatsScreen({ route, navigation }: Props) {
  // State
  const [formats, setFormats] = useState<ExportFormatConfig[]>(EXPORT_FORMATS);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [batchJobs, setBatchJobs] = useState<BatchExportJob[]>([]);
  const [statistics, setStatistics] = useState<ExportStatistics | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<ExportQuality>('standard');
  const [showFormatDetail, setShowFormatDetail] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('formats');

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formatDetailSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const templatePanelSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const historyPanelSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const batchPanelSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;


  // ============================================================================
  // Effects
  // ============================================================================

  // Entrance animation
  useEffect(() => {
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

    loadData();
  }, []);

  // Format detail panel animation
  useEffect(() => {
    Animated.spring(formatDetailSlideAnim, {
      toValue: showFormatDetail ? 0 : Dimensions.get('window').width,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  }, [showFormatDetail]);

  // Template panel animation
  useEffect(() => {
    Animated.spring(templatePanelSlideAnim, {
      toValue: showTemplatePanel ? 0 : Dimensions.get('window').width,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  }, [showTemplatePanel]);

  // History panel animation
  useEffect(() => {
    Animated.spring(historyPanelSlideAnim, {
      toValue: showHistoryPanel ? 0 : Dimensions.get('window').width,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  }, [showHistoryPanel]);

  // Batch panel animation
  useEffect(() => {
    Animated.spring(batchPanelSlideAnim, {
      toValue: showBatchPanel ? 0 : Dimensions.get('window').width,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  }, [showBatchPanel]);

  // ============================================================================
  // Data Management
  // ============================================================================

  const loadData = async () => {
    try {
      await Promise.all([
        loadFormats(),
        loadTemplates(),
        loadExportHistory(),
        loadBatchJobs(),
        loadStatistics(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadFormats = async () => {
    try {
      const stored = await AsyncStorage.getItem('export_formats');
      if (stored) {
        setFormats(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading formats:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const stored = await AsyncStorage.getItem('export_templates');
      if (stored) {
        setTemplates(JSON.parse(stored));
      } else {
        // Mock templates
        const mockTemplates: ExportTemplate[] = [
          {
            id: 'template-1',
            name: 'Business Meeting',
            description: 'Professional format for business meetings',
            category: 'business',
            format: 'pdf',
            settings: {
              includeTimestamps: true,
              includeSpeakerNames: true,
              includeConfidenceScores: false,
              includeMetadata: true,
              pageSize: 'letter',
              fontSize: 12,
              fontFamily: 'Arial',
              margins: { top: 1, right: 1, bottom: 1, left: 1 },
              headerText: 'Meeting Transcript',
              footerText: 'Page {page}',
              colorScheme: 'default',
            },
            isDefault: true,
            isFavorite: true,
            usageCount: 45,
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'template-2',
            name: 'Academic Lecture',
            description: 'Format for academic lectures and seminars',
            category: 'academic',
            format: 'docx',
            settings: {
              includeTimestamps: true,
              includeSpeakerNames: true,
              includeConfidenceScores: false,
              includeMetadata: true,
              pageSize: 'a4',
              fontSize: 11,
              fontFamily: 'Times New Roman',
              margins: { top: 1, right: 1, bottom: 1, left: 1 },
              headerText: 'Lecture Notes',
              footerText: '{date} - Page {page}',
              colorScheme: 'default',
            },
            isDefault: false,
            isFavorite: true,
            usageCount: 28,
            lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'template-3',
            name: 'Legal Deposition',
            description: 'Formal format for legal proceedings',
            category: 'legal',
            format: 'pdf',
            settings: {
              includeTimestamps: true,
              includeSpeakerNames: true,
              includeConfidenceScores: true,
              includeMetadata: true,
              pageSize: 'legal',
              fontSize: 12,
              fontFamily: 'Courier New',
              margins: { top: 1.5, right: 1, bottom: 1, left: 1.5 },
              headerText: 'Official Transcript',
              footerText: 'Page {page} of {total}',
              watermark: 'CONFIDENTIAL',
              colorScheme: 'default',
            },
            isDefault: false,
            isFavorite: false,
            usageCount: 12,
            lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        setTemplates(mockTemplates);
        await AsyncStorage.setItem('export_templates', JSON.stringify(mockTemplates));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadExportHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('export_history');
      if (stored) {
        setExportHistory(JSON.parse(stored));
      } else {
        // Mock history
        const mockHistory: ExportHistoryItem[] = [
          {
            id: 'export-1',
            transcriptId: 'transcript-1',
            transcriptTitle: 'Team Meeting - Q1 Planning',
            format: 'pdf',
            template: 'Business Meeting',
            status: 'completed',
            progress: 100,
            fileSize: 245000,
            filePath: '/exports/meeting_q1.pdf',
            exportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
            quality: 'high',
          },
          {
            id: 'export-2',
            transcriptId: 'transcript-2',
            transcriptTitle: 'Customer Interview',
            format: 'docx',
            template: 'Business Meeting',
            status: 'processing',
            progress: 65,
            exportedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            quality: 'standard',
          },
          {
            id: 'export-3',
            transcriptId: 'transcript-3',
            transcriptTitle: 'University Lecture',
            format: 'srt',
            status: 'failed',
            progress: 0,
            exportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            error: 'Network connection lost',
            quality: 'standard',
          },
        ];
        setExportHistory(mockHistory);
        await AsyncStorage.setItem('export_history', JSON.stringify(mockHistory));
      }
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  };

  const loadBatchJobs = async () => {
    try {
      const stored = await AsyncStorage.getItem('batch_export_jobs');
      if (stored) {
        setBatchJobs(JSON.parse(stored));
      } else {
        // Mock batch jobs
        const mockJobs: BatchExportJob[] = [
          {
            id: 'batch-1',
            name: 'Weekly Meetings Export',
            transcriptIds: ['transcript-1', 'transcript-2', 'transcript-3', 'transcript-4', 'transcript-5'],
            format: 'pdf',
            template: 'Business Meeting',
            status: 'processing',
            progress: 60,
            totalItems: 5,
            completedItems: 3,
            failedItems: 0,
            createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          },
          {
            id: 'batch-2',
            name: 'Lecture Series Export',
            transcriptIds: ['transcript-6', 'transcript-7', 'transcript-8'],
            format: 'docx',
            template: 'Academic Lecture',
            status: 'completed',
            progress: 100,
            totalItems: 3,
            completedItems: 3,
            failedItems: 0,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
          },
        ];
        setBatchJobs(mockJobs);
        await AsyncStorage.setItem('batch_export_jobs', JSON.stringify(mockJobs));
      }
    } catch (error) {
      console.error('Error loading batch jobs:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const stored = await AsyncStorage.getItem('export_statistics');
      if (stored) {
        setStatistics(JSON.parse(stored));
      } else {
        // Mock statistics
        const mockStats: ExportStatistics = {
          totalExports: 127,
          successfulExports: 119,
          failedExports: 8,
          totalSize: 45600000,
          averageExportTime: 4.2,
          mostUsedFormat: 'pdf',
          mostUsedTemplate: 'Business Meeting',
          exportsByFormat: {
            pdf: 58,
            docx: 32,
            txt: 15,
            srt: 8,
            vtt: 5,
            json: 6,
            html: 2,
            md: 1,
          },
          exportsByQuality: {
            draft: 12,
            standard: 45,
            high: 58,
            premium: 12,
          },
        };
        setStatistics(mockStats);
        await AsyncStorage.setItem('export_statistics', JSON.stringify(mockStats));
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const saveFormats = async (updatedFormats: ExportFormatConfig[]) => {
    try {
      await AsyncStorage.setItem('export_formats', JSON.stringify(updatedFormats));
      setFormats(updatedFormats);
    } catch (error) {
      console.error('Error saving formats:', error);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadData();
    setRefreshing(false);
  };

  const handleFormatSelect = (format: ExportFormat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFormat(format);
    setShowFormatDetail(true);
  };

  const handleFormatToggle = async (formatId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedFormats = formats.map(f =>
      f.id === formatId ? { ...f, enabled: !f.enabled } : f
    );
    await saveFormats(updatedFormats);
  };

  const handleTemplateSelect = (template: ExportTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTemplate(template);
  };

  const handleTemplateFavorite = async (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedTemplates = templates.map(t =>
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    );
    await saveTemplates(updatedTemplates);
  };

  const handleQualitySelect = (quality: ExportQuality) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuality(quality);
  };

  const handleExport = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Export Started',
      `Exporting with ${selectedFormat || 'default'} format in ${selectedQuality} quality`,
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const handleBatchExport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBatchPanel(true);
  };

  const handleShowHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowHistoryPanel(true);
  };

  const handleShowTemplates = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTemplatePanel(true);
  };

  const handleCloseFormatDetail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFormatDetail(false);
  };

  const handleCloseTemplatePanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTemplatePanel(false);
  };

  const handleCloseHistoryPanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowHistoryPanel(false);
  };

  const handleCloseBatchPanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowBatchPanel(false);
  };

  const handleToggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === section ? null : section);
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  const getStatusColor = (status: ExportStatus): string => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'processing': return '#3B82F6';
      case 'failed': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#F59E0B';
    }
  };

  const getStatusIcon = (status: ExportStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'processing': return 'sync';
      case 'failed': return 'close-circle';
      case 'cancelled': return 'ban';
      default: return 'time';
    }
  };

  const getQualityColor = (quality: ExportQuality): string => {
    switch (quality) {
      case 'draft': return '#6B7280';
      case 'standard': return '#3B82F6';
      case 'high': return '#8B5CF6';
      case 'premium': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  // ============================================================================
  // Render Functions
  // ============================================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Advanced Export</Text>
        <Text style={styles.headerSubtitle}>{formats.filter(f => f.enabled).length} formats available</Text>
      </View>
      <TouchableOpacity
        style={styles.historyButton}
        onPress={handleShowHistory}
        activeOpacity={0.7}
      >
        <Ionicons name="time" size={24} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );

  const renderStatistics = () => {
    if (!statistics) return null;

    const successRate = statistics.totalExports > 0
      ? ((statistics.successfulExports / statistics.totalExports) * 100).toFixed(1)
      : '0.0';

    return (
      <View style={styles.statisticsContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => handleToggleSection('statistics')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="stats-chart" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Export Statistics</Text>
          </View>
          <Ionicons
            name={expandedSection === 'statistics' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        {expandedSection === 'statistics' && (
          <View style={styles.statisticsContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="document-text" size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{statistics.totalExports}</Text>
                <Text style={styles.statLabel}>Total Exports</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.statValue}>{successRate}%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cloud-download" size={24} color="#8B5CF6" />
                <Text style={styles.statValue}>{formatFileSize(statistics.totalSize)}</Text>
                <Text style={styles.statLabel}>Total Size</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Most Used Format:</Text>
              <Text style={styles.statRowValue}>{statistics.mostUsedFormat.toUpperCase()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Most Used Template:</Text>
              <Text style={styles.statRowValue}>{statistics.mostUsedTemplate}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Avg Export Time:</Text>
              <Text style={styles.statRowValue}>{statistics.averageExportTime.toFixed(1)}s</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderFormats = () => (
    <View style={styles.formatsContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => handleToggleSection('formats')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name="document" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Export Formats</Text>
        </View>
        <Ionicons
          name={expandedSection === 'formats' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expandedSection === 'formats' && (
        <View style={styles.formatsContent}>
          {formats.map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatCard,
                selectedFormat === format.format && styles.formatCardSelected,
              ]}
              onPress={() => handleFormatSelect(format.format)}
              activeOpacity={0.7}
            >
              <View style={styles.formatCardLeft}>
                <View style={[styles.formatIcon, { backgroundColor: format.enabled ? '#EFF6FF' : '#F3F4F6' }]}>
                  <Ionicons
                    name={format.icon}
                    size={24}
                    color={format.enabled ? '#3B82F6' : '#9CA3AF'}
                  />
                </View>
                <View style={styles.formatInfo}>
                  <Text style={styles.formatName}>{format.name}</Text>
                  <Text style={styles.formatDescription}>{format.description}</Text>
                  <View style={styles.formatMeta}>
                    <Text style={styles.formatExtension}>{format.fileExtension}</Text>
                    <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(format.quality) + '20' }]}>
                      <Text style={[styles.qualityBadgeText, { color: getQualityColor(format.quality) }]}>
                        {format.quality}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Switch
                value={format.enabled}
                onValueChange={() => handleFormatToggle(format.id)}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={format.enabled ? '#3B82F6' : '#F3F4F6'}
                ios_backgroundColor="#E5E7EB"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderTemplates = () => {
    const favoriteTemplates = templates.filter(t => t.isFavorite);
    const recentTemplates = [...templates].sort((a, b) => {
      if (!a.lastUsed) return 1;
      if (!b.lastUsed) return -1;
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    }).slice(0, 3);

    return (
      <View style={styles.templatesContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => handleToggleSection('templates')}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="albums" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Templates</Text>
          </View>
          <View style={styles.sectionHeaderRight}>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleShowTemplates}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
            <Ionicons
              name={expandedSection === 'templates' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6B7280"
            />
          </View>
        </TouchableOpacity>

        {expandedSection === 'templates' && (
          <View style={styles.templatesContent}>
            {favoriteTemplates.length > 0 && (
              <>
                <Text style={styles.templatesSectionTitle}>Favorites</Text>
                {favoriteTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      selectedTemplate?.id === template.id && styles.templateCardSelected,
                    ]}
                    onPress={() => handleTemplateSelect(template)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.templateCardLeft}>
                      <View style={styles.templateIcon}>
                        <Ionicons
                          name={TEMPLATE_CATEGORIES.find(c => c.id === template.category)?.icon || 'document'}
                          size={20}
                          color="#3B82F6"
                        />
                      </View>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateDescription}>{template.description}</Text>
                        <View style={styles.templateMeta}>
                          <Text style={styles.templateFormat}>{template.format.toUpperCase()}</Text>
                          <Text style={styles.templateUsage}>Used {template.usageCount} times</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => handleTemplateFavorite(template.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={template.isFavorite ? 'star' : 'star-outline'}
                        size={20}
                        color={template.isFavorite ? '#F59E0B' : '#9CA3AF'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {recentTemplates.length > 0 && (
              <>
                <Text style={styles.templatesSectionTitle}>Recently Used</Text>
                {recentTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      selectedTemplate?.id === template.id && styles.templateCardSelected,
                    ]}
                    onPress={() => handleTemplateSelect(template)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.templateCardLeft}>
                      <View style={styles.templateIcon}>
                        <Ionicons
                          name={TEMPLATE_CATEGORIES.find(c => c.id === template.category)?.icon || 'document'}
                          size={20}
                          color="#3B82F6"
                        />
                      </View>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateDescription}>{template.description}</Text>
                        <View style={styles.templateMeta}>
                          <Text style={styles.templateFormat}>{template.format.toUpperCase()}</Text>
                          {template.lastUsed && (
                            <Text style={styles.templateLastUsed}>{formatDate(template.lastUsed)}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderQualitySelection = () => (
    <View style={styles.qualityContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => handleToggleSection('quality')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name="diamond" size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Export Quality</Text>
        </View>
        <Ionicons
          name={expandedSection === 'quality' ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>

      {expandedSection === 'quality' && (
        <View style={styles.qualityContent}>
          {QUALITY_LEVELS.map((quality) => (
            <TouchableOpacity
              key={quality.id}
              style={[
                styles.qualityCard,
                selectedQuality === quality.id && styles.qualityCardSelected,
              ]}
              onPress={() => handleQualitySelect(quality.id)}
              activeOpacity={0.7}
            >
              <View style={styles.qualityCardLeft}>
                <View style={[
                  styles.qualityIcon,
                  { backgroundColor: getQualityColor(quality.id) + '20' }
                ]}>
                  <Ionicons
                    name={quality.icon}
                    size={20}
                    color={getQualityColor(quality.id)}
                  />
                </View>
                <View style={styles.qualityInfo}>
                  <Text style={styles.qualityName}>{quality.name}</Text>
                  <Text style={styles.qualityDescription}>{quality.description}</Text>
                </View>
              </View>
              {selectedQuality === quality.id && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={styles.batchExportButton}
        onPress={handleBatchExport}
        activeOpacity={0.7}
      >
        <Ionicons name="copy" size={20} color="#3B82F6" />
        <Text style={styles.batchExportButtonText}>Batch Export</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.exportButton,
          !selectedFormat && styles.exportButtonDisabled,
        ]}
        onPress={handleExport}
        activeOpacity={0.7}
        disabled={!selectedFormat}
      >
        <Ionicons name="download" size={20} color="#FFFFFF" />
        <Text style={styles.exportButtonText}>Export Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryPanel = () => {
    const processingExports = exportHistory.filter(e => e.status === 'processing');
    const completedExports = exportHistory.filter(e => e.status === 'completed');
    const failedExports = exportHistory.filter(e => e.status === 'failed');

    return (
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX: historyPanelSlideAnim }],
          },
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Export History</Text>
          <TouchableOpacity
            style={styles.panelClose}
            onPress={handleCloseHistoryPanel}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
          {processingExports.length > 0 && (
            <>
              <Text style={styles.panelSectionTitle}>In Progress</Text>
              {processingExports.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Ionicons
                      name={getStatusIcon(item.status)}
                      size={20}
                      color={getStatusColor(item.status)}
                    />
                    <Text style={styles.historyTitle}>{item.transcriptTitle}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyFormat}>{item.format.toUpperCase()}</Text>
                    <Text style={styles.historyDate}>{formatDate(item.exportedAt)}</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{item.progress}%</Text>
                </View>
              ))}
            </>
          )}

          {completedExports.length > 0 && (
            <>
              <Text style={styles.panelSectionTitle}>Completed</Text>
              {completedExports.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Ionicons
                      name={getStatusIcon(item.status)}
                      size={20}
                      color={getStatusColor(item.status)}
                    />
                    <Text style={styles.historyTitle}>{item.transcriptTitle}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyFormat}>{item.format.toUpperCase()}</Text>
                    {item.fileSize && (
                      <Text style={styles.historySize}>{formatFileSize(item.fileSize)}</Text>
                    )}
                    <Text style={styles.historyDate}>{formatDate(item.exportedAt)}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {failedExports.length > 0 && (
            <>
              <Text style={styles.panelSectionTitle}>Failed</Text>
              {failedExports.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Ionicons
                      name={getStatusIcon(item.status)}
                      size={20}
                      color={getStatusColor(item.status)}
                    />
                    <Text style={styles.historyTitle}>{item.transcriptTitle}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyFormat}>{item.format.toUpperCase()}</Text>
                    <Text style={styles.historyDate}>{formatDate(item.exportedAt)}</Text>
                  </View>
                  {item.error && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color="#EF4444" />
                      <Text style={styles.errorText}>{item.error}</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderBatchPanel = () => (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: batchPanelSlideAnim }],
        },
      ]}
    >
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Batch Export Jobs</Text>
        <TouchableOpacity
          style={styles.panelClose}
          onPress={handleCloseBatchPanel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
        {batchJobs.map((job) => (
          <View key={job.id} style={styles.batchCard}>
            <View style={styles.batchCardHeader}>
              <Ionicons
                name={getStatusIcon(job.status)}
                size={20}
                color={getStatusColor(job.status)}
              />
              <Text style={styles.batchName}>{job.name}</Text>
            </View>
            <View style={styles.batchMeta}>
              <Text style={styles.batchFormat}>{job.format.toUpperCase()}</Text>
              <Text style={styles.batchItems}>{job.totalItems} items</Text>
              <Text style={styles.batchDate}>{formatDate(job.createdAt)}</Text>
            </View>
            <View style={styles.batchProgress}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${job.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{job.progress}%</Text>
            </View>
            <View style={styles.batchStats}>
              <View style={styles.batchStat}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.batchStatText}>{job.completedItems} completed</Text>
              </View>
              {job.failedItems > 0 && (
                <View style={styles.batchStat}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.batchStatText}>{job.failedItems} failed</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );

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
          {renderStatistics()}
          {renderFormats()}
          {renderTemplates()}
          {renderQualitySelection()}
          {renderActionButtons()}
        </ScrollView>
      </Animated.View>

      {/* Panels */}
      {showHistoryPanel && renderHistoryPanel()}
      {showBatchPanel && renderBatchPanel()}

      {/* Overlay */}
      {(showHistoryPanel || showBatchPanel) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            if (showHistoryPanel) handleCloseHistoryPanel();
            if (showBatchPanel) handleCloseBatchPanel();
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
  historyButton: {
    width: BASE_UNIT * 11,
    height: BASE_UNIT * 11,
    borderRadius: BASE_UNIT * 5.5,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 3,
    backgroundColor: '#F9FAFB',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  viewAllButton: {
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Statistics
  statisticsContainer: {
    marginTop: BASE_UNIT * 2,
    backgroundColor: '#FFFFFF',
  },
  statisticsContent: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 3,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    alignItems: 'center',
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
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.5,
    marginTop: BASE_UNIT * 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: BASE_UNIT,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: BASE_UNIT * 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statRowLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Formats
  formatsContainer: {
    marginTop: BASE_UNIT * 2,
    backgroundColor: '#FFFFFF',
  },
  formatsContent: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
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
  formatCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  formatCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: BASE_UNIT * 3,
  },
  formatIcon: {
    width: BASE_UNIT * 12,
    height: BASE_UNIT * 12,
    borderRadius: BASE_UNIT * 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  formatDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: BASE_UNIT * 0.5,
  },
  formatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT,
  },
  formatExtension: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },
  qualityBadge: {
    paddingHorizontal: BASE_UNIT * 2,
    paddingVertical: BASE_UNIT * 0.5,
    borderRadius: BASE_UNIT * 1.5,
  },
  qualityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Templates
  templatesContainer: {
    marginTop: BASE_UNIT * 2,
    backgroundColor: '#FFFFFF',
  },
  templatesContent: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
  },
  templatesSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
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
  templateCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  templateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: BASE_UNIT * 3,
  },
  templateIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 2.5,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  templateDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: BASE_UNIT * 0.5,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT,
  },
  templateFormat: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templateUsage: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  templateLastUsed: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  favoriteButton: {
    padding: BASE_UNIT * 2,
  },

  // Quality
  qualityContainer: {
    marginTop: BASE_UNIT * 2,
    backgroundColor: '#FFFFFF',
  },
  qualityContent: {
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
  },
  qualityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
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
  qualityCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  qualityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: BASE_UNIT * 3,
  },
  qualityIcon: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityInfo: {
    flex: 1,
  },
  qualityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  qualityDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    marginTop: BASE_UNIT * 0.5,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 4,
  },
  batchExportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT * 2,
    backgroundColor: '#EFF6FF',
    borderRadius: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 3.5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  batchExportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    letterSpacing: 0.2,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BASE_UNIT * 2,
    backgroundColor: '#3B82F6',
    borderRadius: BASE_UNIT * 3,
    paddingVertical: BASE_UNIT * 3.5,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  exportButtonDisabled: {
    backgroundColor: '#9CA3AF',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  exportButtonText: {
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
        shadowOpacity: 0.1,
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
    paddingBottom: BASE_UNIT * 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    letterSpacing: -0.3,
  },
  panelClose: {
    width: BASE_UNIT * 10,
    height: BASE_UNIT * 10,
    borderRadius: BASE_UNIT * 5,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: BASE_UNIT * 4,
    paddingTop: BASE_UNIT * 3,
  },
  panelSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
  },

  // History
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
  },
  historyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT,
  },
  historyFormat: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historySize: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Batch
  batchCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BASE_UNIT * 3,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  batchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
  },
  batchName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  batchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    marginBottom: BASE_UNIT * 2,
  },
  batchFormat: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  batchItems: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  batchDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },
  batchProgress: {
    marginBottom: BASE_UNIT * 2,
  },
  batchStats: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
  },
  batchStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT,
  },
  batchStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
  },

  // Progress
  progressBarContainer: {
    height: BASE_UNIT * 2,
    backgroundColor: '#E5E7EB',
    borderRadius: BASE_UNIT,
    overflow: 'hidden',
    marginBottom: BASE_UNIT,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: BASE_UNIT,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
    textAlign: 'right',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BASE_UNIT * 2,
    backgroundColor: '#FEF2F2',
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 2,
    marginTop: BASE_UNIT,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'System',
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

