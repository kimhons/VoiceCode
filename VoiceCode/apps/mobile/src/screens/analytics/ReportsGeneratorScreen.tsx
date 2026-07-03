import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const ReportsGeneratorScreen: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('summary');
  const [dateRange, setDateRange] = useState('month');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [exportFormat, setExportFormat] = useState('pdf');

  const templates: ReportTemplate[] = [
    {
      id: 'summary',
      name: 'Executive Summary',
      description: 'High-level overview of activity',
      icon: 'document-text',
      color: '#007AFF',
    },
    {
      id: 'detailed',
      name: 'Detailed Report',
      description: 'Complete activity breakdown',
      icon: 'list',
      color: '#34C759',
    },
    {
      id: 'usage',
      name: 'Usage Report',
      description: 'Recording and transcription stats',
      icon: 'analytics',
      color: '#FF9500',
    },
    {
      id: 'team',
      name: 'Team Report',
      description: 'Team collaboration insights',
      icon: 'people',
      color: '#AF52DE',
    },
  ];

  const dateRanges = [
    { id: 'week', label: 'Last Week' },
    { id: 'month', label: 'Last Month' },
    { id: 'quarter', label: 'Last Quarter' },
    { id: 'year', label: 'Last Year' },
    { id: 'custom', label: 'Custom' },
  ];

  const exportFormats = [
    { id: 'pdf', name: 'PDF', icon: 'document', description: 'Best for sharing' },
    { id: 'xlsx', name: 'Excel', icon: 'grid', description: 'Data analysis' },
    { id: 'csv', name: 'CSV', icon: 'code', description: 'Raw data' },
  ];

  const recentReports = [
    { name: 'Monthly Summary - Dec 2025', date: 'Jan 2, 2026', format: 'PDF' },
    { name: 'Team Activity Report', date: 'Dec 28, 2025', format: 'Excel' },
    { name: 'Q4 Usage Report', date: 'Dec 15, 2025', format: 'PDF' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Generate Report</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Type</Text>
          <View style={styles.templatesGrid}>
            {templates.map(template => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate === template.id && styles.templateCardActive,
                ]}
                onPress={() => setSelectedTemplate(template.id)}
              >
                <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                  <Ionicons name={template.icon as any} size={24} color={template.color} />
                </View>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDesc}>{template.description}</Text>
                {selectedTemplate === template.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateRangeCard}>
            {dateRanges.map((range, idx) => (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.dateRangeOption,
                  dateRange === range.id && styles.dateRangeOptionActive,
                ]}
                onPress={() => setDateRange(range.id)}
              >
                <Text
                  style={[
                    styles.dateRangeText,
                    dateRange === range.id && styles.dateRangeTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <View style={styles.optionsCard}>
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="bar-chart" size={20} color="#007AFF" />
                <Text style={styles.optionLabel}>Include Charts</Text>
              </View>
              <Switch
                value={includeCharts}
                onValueChange={setIncludeCharts}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Ionicons name="list" size={20} color="#FF9500" />
                <Text style={styles.optionLabel}>Include Details</Text>
              </View>
              <Switch
                value={includeDetails}
                onValueChange={setIncludeDetails}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatsRow}>
            {exportFormats.map(format => (
              <TouchableOpacity
                key={format.id}
                style={[styles.formatCard, exportFormat === format.id && styles.formatCardActive]}
                onPress={() => setExportFormat(format.id)}
              >
                <Ionicons
                  name={format.icon as any}
                  size={24}
                  color={exportFormat === format.id ? '#007AFF' : '#8E8E93'}
                />
                <Text
                  style={[styles.formatName, exportFormat === format.id && styles.formatNameActive]}
                >
                  {format.name}
                </Text>
                <Text style={styles.formatDesc}>{format.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {recentReports.map((report, idx) => (
            <TouchableOpacity key={idx} style={styles.recentCard}>
              <View style={styles.recentIcon}>
                <Ionicons name="document" size={20} color="#007AFF" />
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>{report.name}</Text>
                <Text style={styles.recentDate}>
                  {report.date} • {report.format}
                </Text>
              </View>
              <TouchableOpacity style={styles.downloadButton}>
                <Ionicons name="download-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.previewButton}>
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.previewText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.generateButton}>
          <Ionicons name="document-text" size={20} color="#FFF" />
          <Text style={styles.generateText}>Generate Report</Text>
        </TouchableOpacity>
      </View>
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
  placeholder: { width: 32 },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  templateCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    margin: '1%',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardActive: { borderColor: '#007AFF' },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  templateDesc: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  selectedBadge: { position: 'absolute', top: 12, right: 12 },
  dateRangeCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 8,
  },
  dateRangeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
  },
  dateRangeOptionActive: { backgroundColor: '#007AFF' },
  dateRangeText: { fontSize: 14, color: '#8E8E93' },
  dateRangeTextActive: { color: '#FFF', fontWeight: '500' },
  optionsCard: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  optionInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  optionLabel: { fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 14 },
  formatsRow: { flexDirection: 'row' },
  formatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardActive: { borderColor: '#007AFF', backgroundColor: '#007AFF08' },
  formatName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginTop: 8 },
  formatNameActive: { color: '#007AFF' },
  formatDesc: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  recentDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  downloadButton: { padding: 8 },
  bottomPadding: { height: 100 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 10,
  },
  previewText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 6 },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});

export default ReportsGeneratorScreen;
