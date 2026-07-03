import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TemplateSection {
  id: string;
  name: string;
  placeholder: string;
  isRequired: boolean;
  isExpanded: boolean;
  defaultContent: string;
  voicePrompt: string;
}

interface TemplateSettings {
  name: string;
  specialty: string;
  category: string;
  isPublic: boolean;
  autoSave: boolean;
  voiceEnabled: boolean;
}

const TemplateEditorScreen: React.FC = () => {
  const [settings, setSettings] = useState<TemplateSettings>({
    name: 'Custom SOAP Note',
    specialty: 'General Practice',
    category: 'soap',
    isPublic: false,
    autoSave: true,
    voiceEnabled: true,
  });

  const [sections, setSections] = useState<TemplateSection[]>([
    {
      id: '1',
      name: 'Subjective',
      placeholder: 'Patient complaints, symptoms, history...',
      isRequired: true,
      isExpanded: true,
      defaultContent:
        '**Chief Complaint:**\n\n**History of Present Illness:**\n\n**Review of Systems:**',
      voicePrompt: 'Describe the patient subjective findings',
    },
    {
      id: '2',
      name: 'Objective',
      placeholder: 'Physical examination, vital signs, lab results...',
      isRequired: true,
      isExpanded: false,
      defaultContent:
        '**Vital Signs:**\n- BP: \n- HR: \n- Temp: \n- RR: \n- SpO2: \n\n**Physical Examination:**',
      voicePrompt: 'Document the objective findings',
    },
    {
      id: '3',
      name: 'Assessment',
      placeholder: 'Diagnosis, differential diagnoses...',
      isRequired: true,
      isExpanded: false,
      defaultContent: '**Primary Diagnosis:**\n\n**Differential Diagnoses:**\n1. \n2. \n3. ',
      voicePrompt: 'State your assessment and diagnosis',
    },
    {
      id: '4',
      name: 'Plan',
      placeholder: 'Treatment plan, medications, follow-up...',
      isRequired: true,
      isExpanded: false,
      defaultContent: '**Treatment Plan:**\n\n**Medications:**\n\n**Follow-up:**',
      voicePrompt: 'Outline the treatment plan',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'structure' | 'settings' | 'preview'>('structure');
  const [hasChanges, setHasChanges] = useState(false);

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

  const categories = [
    { id: 'soap', name: 'SOAP Note' },
    { id: 'progress', name: 'Progress Note' },
    { id: 'discharge', name: 'Discharge Summary' },
    { id: 'referral', name: 'Referral Letter' },
    { id: 'custom', name: 'Custom' },
  ];

  const toggleSectionExpanded = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId ? { ...section, isExpanded: !section.isExpanded } : section
      )
    );
  };

  const updateSectionContent = (
    sectionId: string,
    field: keyof TemplateSection,
    value: string | boolean
  ) => {
    setSections(prev =>
      prev.map(section => (section.id === sectionId ? { ...section, [field]: value } : section))
    );
    setHasChanges(true);
  };

  const addSection = () => {
    const newSection: TemplateSection = {
      id: Date.now().toString(),
      name: 'New Section',
      placeholder: 'Enter content...',
      isRequired: false,
      isExpanded: true,
      defaultContent: '',
      voicePrompt: 'Describe this section',
    };
    setSections(prev => [...prev, newSection]);
    setHasChanges(true);
  };

  const removeSection = (sectionId: string) => {
    Alert.alert('Remove Section', 'Are you sure you want to remove this section?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSections(prev => prev.filter(s => s.id !== sectionId));
          setHasChanges(true);
        },
      },
    ]);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
    setHasChanges(true);
  };

  const saveTemplate = useCallback(() => {
    Alert.alert('Template Saved', 'Your template has been saved successfully.');
    setHasChanges(false);
  }, []);

  const renderStructureTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.templateNameSection}>
        <Text style={styles.inputLabel}>Template Name</Text>
        <TextInput
          style={styles.nameInput}
          value={settings.name}
          onChangeText={text => {
            setSettings(prev => ({ ...prev, name: text }));
            setHasChanges(true);
          }}
          placeholder="Enter template name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.sectionsHeader}>
        <Text style={styles.sectionTitle}>Template Sections</Text>
        <TouchableOpacity style={styles.addSectionButton} onPress={addSection}>
          <Ionicons name="add" size={18} color="#007AFF" />
          <Text style={styles.addSectionText}>Add Section</Text>
        </TouchableOpacity>
      </View>

      {sections.map((section, index) => (
        <View key={section.id} style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSectionExpanded(section.id)}
          >
            <View style={styles.sectionDragHandle}>
              <Ionicons name="reorder-three" size={24} color="#CCC" />
            </View>
            <View style={styles.sectionTitleContainer}>
              <TextInput
                style={styles.sectionNameInput}
                value={section.name}
                onChangeText={text => updateSectionContent(section.id, 'name', text)}
                placeholder="Section Name"
                placeholderTextColor="#999"
              />
              {section.isRequired && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => moveSection(section.id, 'up')}
                disabled={index === 0}
              >
                <Ionicons name="chevron-up" size={20} color={index === 0 ? '#DDD' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sectionActionButton}
                onPress={() => moveSection(section.id, 'down')}
                disabled={index === sections.length - 1}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={index === sections.length - 1 ? '#DDD' : '#666'}
                />
              </TouchableOpacity>
              <Ionicons
                name={section.isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#007AFF"
              />
            </View>
          </TouchableOpacity>

          {section.isExpanded && (
            <View style={styles.sectionBody}>
              <View style={styles.sectionField}>
                <Text style={styles.fieldLabel}>Default Content</Text>
                <TextInput
                  style={styles.contentInput}
                  value={section.defaultContent}
                  onChangeText={text => updateSectionContent(section.id, 'defaultContent', text)}
                  placeholder="Enter default content or template..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.sectionField}>
                <Text style={styles.fieldLabel}>Voice Prompt</Text>
                <View style={styles.voicePromptContainer}>
                  <Ionicons name="mic" size={18} color="#34C759" style={styles.voiceIcon} />
                  <TextInput
                    style={styles.voicePromptInput}
                    value={section.voicePrompt}
                    onChangeText={text => updateSectionContent(section.id, 'voicePrompt', text)}
                    placeholder="What should the AI say to prompt this section?"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.sectionField}>
                <Text style={styles.fieldLabel}>Placeholder Text</Text>
                <TextInput
                  style={styles.placeholderInput}
                  value={section.placeholder}
                  onChangeText={text => updateSectionContent(section.id, 'placeholder', text)}
                  placeholder="Placeholder text when empty"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.sectionOptions}>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Required Field</Text>
                  <Switch
                    value={section.isRequired}
                    onValueChange={value => updateSectionContent(section.id, 'isRequired', value)}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFF"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeSection(section.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={styles.removeButtonText}>Remove Section</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>General</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Specialty</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.specialtyScroll}
          >
            {specialties.map(specialty => (
              <TouchableOpacity
                key={specialty}
                style={[
                  styles.specialtyOption,
                  settings.specialty === specialty && styles.specialtyOptionActive,
                ]}
                onPress={() => {
                  setSettings(prev => ({ ...prev, specialty }));
                  setHasChanges(true);
                }}
              >
                <Text
                  style={[
                    styles.specialtyOptionText,
                    settings.specialty === specialty && styles.specialtyOptionTextActive,
                  ]}
                >
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Category</Text>
          <View style={styles.categoryOptions}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  settings.category === category.id && styles.categoryOptionActive,
                ]}
                onPress={() => {
                  setSettings(prev => ({ ...prev, category: category.id }));
                  setHasChanges(true);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    settings.category === category.id && styles.categoryOptionTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Preferences</Text>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Ionicons name="cloud-upload-outline" size={22} color="#007AFF" />
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Auto-Save</Text>
              <Text style={styles.toggleDescription}>Automatically save changes</Text>
            </View>
          </View>
          <Switch
            value={settings.autoSave}
            onValueChange={value => setSettings(prev => ({ ...prev, autoSave: value }))}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Ionicons name="mic-outline" size={22} color="#34C759" />
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Voice Dictation</Text>
              <Text style={styles.toggleDescription}>Enable voice input for sections</Text>
            </View>
          </View>
          <Switch
            value={settings.voiceEnabled}
            onValueChange={value => setSettings(prev => ({ ...prev, voiceEnabled: value }))}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.toggleItem}>
          <View style={styles.toggleInfo}>
            <Ionicons name="globe-outline" size={22} color="#AF52DE" />
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Share Publicly</Text>
              <Text style={styles.toggleDescription}>Allow others to use this template</Text>
            </View>
          </View>
          <Switch
            value={settings.isPublic}
            onValueChange={value => setSettings(prev => ({ ...prev, isPublic: value }))}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderPreviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>{settings.name}</Text>
          <View style={styles.previewMeta}>
            <Text style={styles.previewSpecialty}>{settings.specialty}</Text>
            <Text style={styles.previewDot}>•</Text>
            <Text style={styles.previewCategory}>
              {categories.find(c => c.id === settings.category)?.name}
            </Text>
          </View>
        </View>

        {sections.map(section => (
          <View key={section.id} style={styles.previewSection}>
            <View style={styles.previewSectionHeader}>
              <Text style={styles.previewSectionTitle}>{section.name}</Text>
              {section.isRequired && <Text style={styles.previewRequired}>*</Text>}
            </View>
            <View style={styles.previewContent}>
              {section.defaultContent ? (
                <Text style={styles.previewText}>{section.defaultContent}</Text>
              ) : (
                <Text style={styles.previewPlaceholder}>{section.placeholder}</Text>
              )}
            </View>
            {settings.voiceEnabled && (
              <View style={styles.voiceHint}>
                <Ionicons name="mic" size={14} color="#34C759" />
                <Text style={styles.voiceHintText}>&quot;{section.voicePrompt}&quot;</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Template Editor</Text>
          <TouchableOpacity
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
            onPress={saveTemplate}
            disabled={!hasChanges}
          >
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          {(['structure', 'settings', 'preview'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={
                  tab === 'structure'
                    ? 'list'
                    : tab === 'settings'
                      ? 'settings-outline'
                      : 'eye-outline'
                }
                size={18}
                color={activeTab === tab ? '#007AFF' : '#8E8E93'}
              />
              <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'structure' && renderStructureTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  keyboardView: { flex: 1 },
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
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonDisabled: { backgroundColor: '#E5E5EA' },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  saveButtonTextDisabled: { color: '#999' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: { backgroundColor: '#F2F2F7' },
  tabButtonText: { fontSize: 14, fontWeight: '500', color: '#8E8E93', marginLeft: 6 },
  tabButtonTextActive: { color: '#007AFF' },
  tabContent: { flex: 1 },
  templateNameSection: { backgroundColor: '#FFF', padding: 16, marginBottom: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    backgroundColor: '#F2F2F7',
    padding: 14,
    borderRadius: 10,
  },
  sectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  addSectionButton: { flexDirection: 'row', alignItems: 'center' },
  addSectionText: { fontSize: 14, fontWeight: '500', color: '#007AFF', marginLeft: 4 },
  sectionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  sectionDragHandle: { marginRight: 8 },
  sectionTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sectionNameInput: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  requiredBadge: {
    backgroundColor: '#FF3B3020',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  requiredText: { fontSize: 11, fontWeight: '600', color: '#FF3B30' },
  sectionActions: { flexDirection: 'row', alignItems: 'center' },
  sectionActionButton: { padding: 4 },
  sectionBody: { padding: 14, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  sectionField: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  contentInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1C1C1E',
    minHeight: 100,
  },
  voicePromptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  voiceIcon: { marginRight: 8 },
  voicePromptInput: { flex: 1, fontSize: 14, color: '#1C1C1E', paddingVertical: 12 },
  placeholderInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1C1C1E',
  },
  sectionOptions: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
    marginBottom: 12,
  },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionLabel: { fontSize: 14, color: '#1C1C1E' },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  removeButtonText: { fontSize: 14, color: '#FF3B30', marginLeft: 6 },
  settingsSection: { backgroundColor: '#FFF', marginBottom: 8, paddingVertical: 12 },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingItem: { paddingHorizontal: 16, marginBottom: 16 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#1C1C1E', marginBottom: 10 },
  specialtyScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  specialtyOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  specialtyOptionActive: { backgroundColor: '#007AFF' },
  specialtyOptionText: { fontSize: 13, color: '#666' },
  specialtyOptionTextActive: { color: '#FFF', fontWeight: '500' },
  categoryOptions: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionActive: { backgroundColor: '#34C759' },
  categoryOptionText: { fontSize: 13, color: '#666' },
  categoryOptionTextActive: { color: '#FFF', fontWeight: '500' },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleText: { marginLeft: 12, flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  toggleDescription: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  previewContainer: { margin: 16, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' },
  previewHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  previewTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  previewMeta: { flexDirection: 'row', alignItems: 'center' },
  previewSpecialty: { fontSize: 13, color: '#007AFF' },
  previewDot: { fontSize: 13, color: '#8E8E93', marginHorizontal: 8 },
  previewCategory: { fontSize: 13, color: '#8E8E93' },
  previewSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  previewSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  previewSectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  previewRequired: { fontSize: 16, color: '#FF3B30', marginLeft: 4 },
  previewContent: { backgroundColor: '#F9F9FB', borderRadius: 8, padding: 12, minHeight: 60 },
  previewText: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  previewPlaceholder: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  voiceHint: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  voiceHintText: { fontSize: 12, color: '#34C759', marginLeft: 4, fontStyle: 'italic' },
  bottomPadding: { height: 40 },
});

export default TemplateEditorScreen;
