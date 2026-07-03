import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: number;
  uses: number;
  isPremium: boolean;
  icon: string;
  color: string;
}

const AutomationTemplatesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'sharing', label: 'Sharing' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const templates: AutomationTemplate[] = [
    {
      id: '1',
      name: 'Post-Meeting Summary',
      description: 'Auto-generate and share meeting summaries',
      category: 'meetings',
      steps: 4,
      uses: 2340,
      isPremium: false,
      icon: 'document-text',
      color: '#007AFF',
    },
    {
      id: '2',
      name: 'Action Item Tracker',
      description: 'Extract and assign action items to team',
      category: 'productivity',
      steps: 5,
      uses: 1856,
      isPremium: false,
      icon: 'checkbox',
      color: '#FF9500',
    },
    {
      id: '3',
      name: 'Client Call Follow-up',
      description: 'Send follow-up emails after client calls',
      category: 'meetings',
      steps: 6,
      uses: 987,
      isPremium: true,
      icon: 'mail',
      color: '#34C759',
    },
    {
      id: '4',
      name: 'Slack Notifications',
      description: 'Post updates to Slack channels',
      category: 'notifications',
      steps: 3,
      uses: 3421,
      isPremium: false,
      icon: 'logo-slack',
      color: '#4A154B',
    },
    {
      id: '5',
      name: 'Weekly Digest',
      description: 'Compile weekly meeting summaries',
      category: 'productivity',
      steps: 7,
      uses: 654,
      isPremium: true,
      icon: 'calendar',
      color: '#AF52DE',
    },
    {
      id: '6',
      name: 'Cloud Backup',
      description: 'Auto-backup recordings to cloud storage',
      category: 'sharing',
      steps: 3,
      uses: 2100,
      isPremium: false,
      icon: 'cloud-upload',
      color: '#5856D6',
    },
    {
      id: '7',
      name: 'Team Highlights',
      description: 'Share key moments with team members',
      category: 'sharing',
      steps: 5,
      uses: 432,
      isPremium: true,
      icon: 'star',
      color: '#FF3B30',
    },
    {
      id: '8',
      name: 'Smart Reminders',
      description: 'Send reminders for discussed deadlines',
      category: 'notifications',
      steps: 4,
      uses: 876,
      isPremium: false,
      icon: 'alarm',
      color: '#00C7BE',
    },
  ];

  const filteredTemplates = templates.filter(
    t =>
      (selectedCategory === 'all' || t.category === selectedCategory) &&
      (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featuredTemplates = templates.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Automation Templates</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedCategory === 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredTemplates.map(template => (
                <TouchableOpacity key={template.id} style={styles.featuredCard}>
                  <View style={[styles.featuredIcon, { backgroundColor: template.color + '20' }]}>
                    <Ionicons name={template.icon as any} size={28} color={template.color} />
                  </View>
                  <Text style={styles.featuredName}>{template.name}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={2}>
                    {template.description}
                  </Text>
                  <View style={styles.featuredMeta}>
                    <Text style={styles.featuredSteps}>{template.steps} steps</Text>
                    <Text style={styles.featuredUses}>{template.uses.toLocaleString()} uses</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all'
              ? 'All Templates'
              : categories.find(c => c.id === selectedCategory)?.label}
          </Text>
          {filteredTemplates.map(template => (
            <TouchableOpacity key={template.id} style={styles.templateCard}>
              <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
                <Ionicons name={template.icon as any} size={22} color={template.color} />
              </View>
              <View style={styles.templateInfo}>
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  {template.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={10} color="#FF9500" />
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.templateDesc} numberOfLines={1}>
                  {template.description}
                </Text>
                <View style={styles.templateMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="layers-outline" size={12} color="#8E8E93" />
                    <Text style={styles.metaText}>{template.steps} steps</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={12} color="#8E8E93" />
                    <Text style={styles.metaText}>{template.uses.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.useButton}>
                <Text style={styles.useButtonText}>Use</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.createSection}>
          <View style={styles.createCard}>
            <View style={styles.createIcon}>
              <Ionicons name="add-circle" size={32} color="#007AFF" />
            </View>
            <Text style={styles.createTitle}>Create Custom Workflow</Text>
            <Text style={styles.createDesc}>Build your own automation from scratch</Text>
            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  searchContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 8 },
  categoryBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryScroll: { paddingHorizontal: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#007AFF' },
  categoryText: { fontSize: 14, color: '#8E8E93' },
  categoryTextActive: { color: '#FFF', fontWeight: '500' },
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
  featuredScroll: { paddingRight: 16 },
  featuredCard: {
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  featuredDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 12, lineHeight: 18 },
  featuredMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  featuredSteps: { fontSize: 12, color: '#8E8E93' },
  featuredUses: { fontSize: 12, color: '#8E8E93' },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: { flex: 1 },
  templateHeader: { flexDirection: 'row', alignItems: 'center' },
  templateName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF950020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  premiumText: { fontSize: 9, fontWeight: '700', color: '#FF9500', marginLeft: 2 },
  templateDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  templateMeta: { flexDirection: 'row', marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  metaText: { fontSize: 11, color: '#8E8E93', marginLeft: 4 },
  useButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  useButtonText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  createSection: { paddingHorizontal: 16, marginBottom: 20 },
  createCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  createIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  createTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  createDesc: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  createButtonText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  bottomPadding: { height: 40 },
});

export default AutomationTemplatesScreen;
