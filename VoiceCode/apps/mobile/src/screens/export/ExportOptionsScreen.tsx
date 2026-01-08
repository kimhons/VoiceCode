// VoiceFlow Pro Mobile - Enhanced Export Options Screen
// Multiple export formats, templates, batch export, export history, and Apple-caliber design

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { mobileExportService, ExportFormat, ExportHistory, ExportTemplate } from '../../services/MobileExportService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { elevation, blurIntensity } from '../../theme';
import { useAppSelector } from '../../store';

type ExportOptionsScreenRouteProp = RouteProp<HomeStackParamList, 'ExportOptions'>;
type ExportOptionsScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'ExportOptions'
>;

interface Props {
  route: ExportOptionsScreenRouteProp;
  navigation: ExportOptionsScreenNavigationProp;
}

interface ExportFormatOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    format: 'pdf',
    label: 'PDF Document',
    description: 'Professional document format, ideal for sharing and printing',
    icon: 'document-text',
  },
  {
    format: 'docx',
    label: 'Word Document',
    description: 'Editable document format for Microsoft Word',
    icon: 'document',
  },
  {
    format: 'txt',
    label: 'Plain Text',
    description: 'Simple text file, compatible with all devices',
    icon: 'document-outline',
  },
  {
    format: 'srt',
    label: 'SRT Subtitles',
    description: 'Subtitle format for video players',
    icon: 'videocam',
  },
  {
    format: 'vtt',
    label: 'WebVTT Subtitles',
    description: 'Web-based subtitle format',
    icon: 'play-circle',
  },
  {
    format: 'json',
    label: 'JSON Data',
    description: 'Structured data format for developers',
    icon: 'code-slash',
  },
];

export function ExportOptionsScreen({ route, navigation }: Props) {
  const { transcriptId, transcriptTitle, transcriptText } = route.params;
  const { theme } = useTheme();
  const userId = useAppSelector((state) => state.auth.user?.id);

  // State
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<ExportTemplate[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null);

  // Animation values
  const historySlide = useRef(new Animated.Value(300)).current;
  const analyticsSlide = useRef(new Animated.Value(300)).current;
  const formatScale = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize animation values for each format
  EXPORT_FORMATS.forEach((format) => {
    if (!formatScale[format.format]) {
      formatScale[format.format] = new Animated.Value(1);
    }
  });

  /**
   * Load export history and templates
   */
  useEffect(() => {
    if (userId) {
      loadExportHistory();
      loadRecentTemplates();
    }
  }, [userId]);

  const loadExportHistory = async () => {
    if (!userId) return;
    try {
      const history = await mobileExportService.getExportHistory(userId, transcriptId);
      setExportHistory(history.slice(0, 5)); // Last 5 exports
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const loadRecentTemplates = async () => {
    if (!userId) return;
    try {
      const templates = await mobileExportService.getTemplates(userId);
      setRecentTemplates(templates.slice(0, 3)); // Top 3 templates
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  /**
   * Show export history
   */
  const handleShowHistory = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowHistory(true);

    Animated.spring(historySlide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [historySlide]);

  /**
   * Hide export history
   */
  const handleHideHistory = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(historySlide, {
      toValue: 300,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start(() => {
      setShowHistory(false);
    });
  }, [historySlide]);

  /**
   * Show analytics
   */
  const handleShowAnalytics = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAnalytics(true);

    Animated.spring(analyticsSlide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [analyticsSlide]);

  /**
   * Hide analytics
   */
  const handleHideAnalytics = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(analyticsSlide, {
      toValue: 300,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start(() => {
      setShowAnalytics(false);
    });
  }, [analyticsSlide]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setExporting(true);
        setSelectedFormat(format);

        // Animate format card
        Animated.sequence([
          Animated.timing(formatScale[format], {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(formatScale[format], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        let fileUri: string;

        switch (format) {
          case 'txt':
            fileUri = await mobileExportService.exportToText(
              transcriptText,
              transcriptTitle,
              {
                id: '',
                userId: '',
                name: 'Default',
                format: 'txt',
                includeTimestamps: true,
                includeSpeakers: true,
                includeConfidence: false,
                includeMetadata: true,
                fontSize: 12,
                fontFamily: 'Arial',
                isDefault: true,
                createdAt: '',
                updatedAt: '',
              }
            );
            break;

          case 'srt':
            fileUri = await mobileExportService.exportToSRT(
              transcriptText,
              transcriptTitle
            );
            break;

          case 'vtt':
            fileUri = await mobileExportService.exportToVTT(
              transcriptText,
              transcriptTitle
            );
            break;

          case 'json':
            fileUri = await mobileExportService.exportToJSON(
              { id: transcriptId, title: transcriptTitle, text: transcriptText },
              transcriptTitle
            );
            break;

          case 'pdf':
          case 'docx':
            // Navigate to template selection for advanced formats
            navigation.navigate('TemplateSelection', {
              transcriptId,
              transcriptTitle,
              transcriptText,
            });
            setExporting(false);
            return;

          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        // Share the exported file
        await mobileExportService.shareFile(fileUri);

        // Save to export history
        if (userId) {
          await mobileExportService.saveExportHistory({
            userId,
            transcriptId,
            format,
            exportedAt: new Date().toISOString(),
          });
          await loadExportHistory();
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Transcript exported as ${format.toUpperCase()}`);
      } catch (error) {
        console.error('Export error:', error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Export Failed', 'Failed to export transcript. Please try again.');
      } finally {
        setExporting(false);
        setSelectedFormat(null);
      }
    },
    [transcriptId, transcriptTitle, transcriptText, navigation, userId, formatScale]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header with Actions */}
        <View style={styles.header}>
          <View>
            <Text
              variant="h3"
              style={[styles.title, { color: theme.colors.textPrimary }]}
              testID="export-title"
            >
              Export Options
            </Text>
            <Text
              variant="body"
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              testID="export-subtitle"
            >
              {transcriptTitle}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShowHistory} style={styles.headerButton}>
              <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShowAnalytics} style={styles.headerButton}>
              <Ionicons name="stats-chart-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Templates */}
        {recentTemplates.length > 0 && (
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>
              Recent Templates
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
              {recentTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateChip, { borderColor: theme.colors.primary }]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('TemplateSelection', {
                      transcriptId,
                      transcriptTitle,
                      transcriptText,
                    });
                  }}
                >
                  <Ionicons name="bookmark" size={16} color={theme.colors.primary} />
                  <Text variant="caption" style={{ color: theme.colors.primary }}>
                    {template.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('BatchExport');
            }}
          >
            <Ionicons name="layers-outline" size={20} color={theme.colors.primary} />
            <Text variant="body" style={{ color: theme.colors.primary }}>
              Batch Export
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('TemplateSelection', {
                transcriptId,
                transcriptTitle,
                transcriptText,
              });
            }}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
            <Text variant="body" style={{ color: theme.colors.primary }}>
              Custom Template
            </Text>
          </TouchableOpacity>
        </View>

        {/* Export Formats */}
        <Text variant="h6" style={styles.sectionTitle}>
          Export Formats
        </Text>

        <View style={styles.formatsContainer}>
          {EXPORT_FORMATS.map((option) => (
            <Animated.View
              key={option.format}
              style={{
                transform: [{ scale: formatScale[option.format] || 1 }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selectedFormat === option.format ? theme.colors.primary : theme.colors.border,
                    borderWidth: selectedFormat === option.format ? 2 : 1,
                  },
                ]}
                onPress={() => handleExport(option.format)}
                disabled={exporting}
                testID={`export-format-${option.format}`}
              >
              <View style={styles.formatHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.primary + '20' },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.formatInfo}>
                  <Text
                    variant="h4"
                    style={{ color: theme.colors.textPrimary }}
                    testID={`format-label-${option.format}`}
                  >
                    {option.label}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.textSecondary }}
                    testID={`format-description-${option.format}`}
                  >
                    {option.description}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </View>
              {selectedFormat === option.format && exporting && (
                <ActivityIndicator size="small" color={theme.colors.primary} style={styles.formatLoading} />
              )}
            </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {exporting && (
          <View style={styles.loadingContainer} testID="export-loading">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              variant="body"
              style={[styles.loadingText, { color: theme.colors.textSecondary }]}
            >
              Exporting {selectedFormat?.toUpperCase()}...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Export History Panel */}
      {showHistory && (
        <Animated.View
          style={[
            styles.historyPanel,
            { transform: [{ translateY: historySlide }] },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.historyBlur}>
              <View style={styles.historyContent}>
                <View style={styles.historyHeader}>
                  <Text variant="h6">Export History</Text>
                  <TouchableOpacity onPress={handleHideHistory}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.historyList}>
                  {exportHistory.length === 0 ? (
                    <Text variant="body" style={{ textAlign: 'center', marginTop: 20, color: theme.colors.textSecondary }}>
                      No export history yet
                    </Text>
                  ) : (
                    exportHistory.map((item) => (
                      <View key={item.id} style={styles.historyItem}>
                        <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
                        <View style={styles.historyItemInfo}>
                          <Text variant="body">{item.format.toUpperCase()}</Text>
                          <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                            {new Date(item.exportedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.historyContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.historyHeader}>
                <Text variant="h6">Export History</Text>
                <TouchableOpacity onPress={handleHideHistory}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.historyList}>
                {exportHistory.length === 0 ? (
                  <Text variant="body" style={{ textAlign: 'center', marginTop: 20, color: theme.colors.textSecondary }}>
                    No export history yet
                  </Text>
                ) : (
                  exportHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.historyItemInfo}>
                        <Text variant="body">{item.format.toUpperCase()}</Text>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          {new Date(item.exportedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      )}

      {/* Analytics Panel */}
      {showAnalytics && (
        <Animated.View
          style={[
            styles.analyticsPanel,
            { transform: [{ translateY: analyticsSlide }] },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.analyticsBlur}>
              <View style={styles.analyticsContent}>
                <View style={styles.analyticsHeader}>
                  <Text variant="h6">Export Analytics</Text>
                  <TouchableOpacity onPress={handleHideAnalytics}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.analyticsStats}>
                  <View style={styles.statCard}>
                    <Ionicons name="download-outline" size={32} color={theme.colors.primary} />
                    <Text variant="h4" style={styles.statValue}>{exportHistory.length}</Text>
                    <Text variant="caption" style={styles.statLabel}>Total Exports</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="bookmark-outline" size={32} color={theme.colors.primary} />
                    <Text variant="h4" style={styles.statValue}>{recentTemplates.length}</Text>
                    <Text variant="caption" style={styles.statLabel}>Templates</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Ionicons name="document-text-outline" size={32} color={theme.colors.primary} />
                    <Text variant="h4" style={styles.statValue}>{EXPORT_FORMATS.length}</Text>
                    <Text variant="caption" style={styles.statLabel}>Formats</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.analyticsContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.analyticsHeader}>
                <Text variant="h6">Export Analytics</Text>
                <TouchableOpacity onPress={handleHideAnalytics}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.analyticsStats}>
                <View style={styles.statCard}>
                  <Ionicons name="download-outline" size={32} color={theme.colors.primary} />
                  <Text variant="h4" style={styles.statValue}>{exportHistory.length}</Text>
                  <Text variant="caption" style={styles.statLabel}>Total Exports</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="bookmark-outline" size={32} color={theme.colors.primary} />
                  <Text variant="h4" style={styles.statValue}>{recentTemplates.length}</Text>
                  <Text variant="caption" style={styles.statLabel}>Templates</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="document-text-outline" size={32} color={theme.colors.primary} />
                  <Text variant="h4" style={styles.statValue}>{EXPORT_FORMATS.length}</Text>
                  <Text variant="caption" style={styles.statLabel}>Formats</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  templatesScroll: {
    marginTop: 8,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#fff',
    marginRight: 12,
    gap: 6,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  formatsContainer: {
    gap: 12,
  },
  formatCard: {
    borderRadius: 12,
    padding: 16,
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formatInfo: {
    flex: 1,
  },
  formatLoading: {
    marginLeft: 12,
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  historyPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  historyBlur: {
    flex: 1,
  },
  historyContent: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  historyItemInfo: {
    flex: 1,
  },
  analyticsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  analyticsBlur: {
    flex: 1,
  },
  analyticsContent: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontWeight: '700',
    color: '#667eea',
  },
  statLabel: {
    opacity: 0.7,
  },
});

