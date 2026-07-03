// VoiceCode Mobile - Template Selection Screen

import React, { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store';
import { getTemplates } from '../../store/slices/exportSlice';
import { Ionicons } from '@expo/vector-icons';
import { mobileExportService } from '../../services/MobileExportService';

type TemplateSelectionScreenRouteProp = RouteProp<
  HomeStackParamList,
  'TemplateSelection'
>;
type TemplateSelectionScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'TemplateSelection'
>;

interface Props {
  route: TemplateSelectionScreenRouteProp;
  navigation: TemplateSelectionScreenNavigationProp;
}

export function TemplateSelectionScreen({ route, navigation }: Props) {
  const { transcriptId, transcriptTitle, transcriptText } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const { templates, templatesLoading } = useAppSelector((state) => state.export);

  useEffect(() => {
    const userId = 'current-user-id'; // TODO: Get from auth context
    dispatch(getTemplates(userId));
  }, [dispatch]);

  const handleSelectTemplate = useCallback(
    async (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      try {
        let fileUri: string;

        if (template.format === 'pdf' || template.format === 'docx') {
          // For now, export as text since PDF/DOCX require additional libraries
          fileUri = await mobileExportService.exportToText(
            transcriptText,
            transcriptTitle,
            template
          );
        } else {
          fileUri = await mobileExportService.exportToText(
            transcriptText,
            transcriptTitle,
            template
          );
        }

        await mobileExportService.shareFile(fileUri);
        Alert.alert('Success', `Transcript exported using ${template.name}`);
        navigation.goBack();
      } catch (error) {
        console.error('Export error:', error);
        Alert.alert('Export Failed', 'Failed to export transcript. Please try again.');
      }
    },
    [templates, transcriptText, transcriptTitle, navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text
          variant="h3"
          style={[styles.title, { color: theme.colors.textPrimary }]}
          testID="template-title"
        >
          Select Export Template
        </Text>

        <Text
          variant="body"
          style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          testID="template-subtitle"
        >
          Choose a template to customize your export
        </Text>

        {templatesLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            testID="templates-loading"
          />
        ) : templates.length === 0 ? (
          <View style={styles.emptyState} testID="no-templates">
            <Ionicons
              name="document-text-outline"
              size={48}
              color={theme.colors.textTertiary}
            />
            <Text
              variant="body"
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No templates available
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}
            >
              Create a template to customize your exports
            </Text>
          </View>
        ) : (
          <View style={styles.templatesContainer}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleSelectTemplate(template.id)}
                testID={`template-${template.id}`}
              >
                <View style={styles.templateHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.colors.primary + '20' },
                    ]}
                  >
                    <Ionicons
                      name="document-text"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text
                      variant="h4"
                      style={{ color: theme.colors.textPrimary }}
                      testID={`template-name-${template.id}`}
                    >
                      {template.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {template.format.toUpperCase()} • {template.fontSize}pt{' '}
                      {template.fontFamily}
                    </Text>
                  </View>
                  {template.isDefault && (
                    <View
                      style={[
                        styles.defaultBadge,
                        { backgroundColor: theme.colors.primary + '20' },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{ color: theme.colors.primary }}
                      >
                        Default
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    marginTop: 16,
  },
  emptySubtext: {
    marginTop: 8,
  },
  templatesContainer: {
    gap: 12,
  },
  templateCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  templateHeader: {
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
  templateInfo: {
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

