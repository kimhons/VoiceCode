import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface MedicalTerm {
  id: string;
  term: string;
  pronunciation: string;
  definition: string;
  category: string;
  isFavorite: boolean;
}

const MedicalTerminologyScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [terms] = useState<MedicalTerm[]>([
    {
      id: '1',
      term: 'Hypertension',
      pronunciation: 'hahy-per-TEN-shuhn',
      definition: 'Abnormally high blood pressure',
      category: 'Cardiology',
      isFavorite: true,
    },
    {
      id: '2',
      term: 'Dyspnea',
      pronunciation: 'DISP-nee-uh',
      definition: 'Difficult or labored breathing',
      category: 'Pulmonology',
      isFavorite: false,
    },
    {
      id: '3',
      term: 'Bradycardia',
      pronunciation: 'brad-i-KAHR-dee-uh',
      definition: 'Abnormally slow heart rate',
      category: 'Cardiology',
      isFavorite: true,
    },
    {
      id: '4',
      term: 'Hepatomegaly',
      pronunciation: 'hep-uh-toh-MEG-uh-lee',
      definition: 'Abnormal enlargement of the liver',
      category: 'Gastroenterology',
      isFavorite: false,
    },
    {
      id: '5',
      term: 'Tachycardia',
      pronunciation: 'tak-i-KAHR-dee-uh',
      definition: 'Abnormally rapid heart rate',
      category: 'Cardiology',
      isFavorite: false,
    },
  ]);

  const categories = [
    'all',
    'Cardiology',
    'Pulmonology',
    'Gastroenterology',
    'Neurology',
    'Orthopedics',
  ];

  const filteredTerms = terms.filter(term => {
    const matchesSearch =
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Terminology</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search terms..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.voiceSearchButton}>
            <Ionicons name="mic" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category === 'all' ? 'All' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{terms.length}</Text>
            <Text style={styles.statLabel}>Total Terms</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{terms.filter(t => t.isFavorite).length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{categories.length - 1}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        <View style={styles.termsList}>
          {filteredTerms.map(term => (
            <TouchableOpacity key={term.id} style={styles.termCard}>
              <View style={styles.termHeader}>
                <View style={styles.termTitleRow}>
                  <Text style={styles.termName}>{term.term}</Text>
                  <TouchableOpacity>
                    <Ionicons
                      name={term.isFavorite ? 'star' : 'star-outline'}
                      size={20}
                      color={term.isFavorite ? '#FFD700' : '#999'}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.termPronunciation}>{term.pronunciation}</Text>
              </View>
              <Text style={styles.termDefinition}>{term.definition}</Text>
              <View style={styles.termFooter}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{term.category}</Text>
                </View>
                <View style={styles.termActions}>
                  <TouchableOpacity style={styles.termAction}>
                    <Ionicons name="volume-high" size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.termAction}>
                    <Ionicons name="copy-outline" size={18} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity style={styles.quickAccessCard}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.quickAccessText}>Favorites</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessCard}>
              <Ionicons name="time" size={24} color="#007AFF" />
              <Text style={styles.quickAccessText}>Recent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessCard}>
              <Ionicons name="flask" size={24} color="#34C759" />
              <Text style={styles.quickAccessText}>Lab Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAccessCard}>
              <Ionicons name="medical" size={24} color="#FF3B30" />
              <Text style={styles.quickAccessText}>Drug Names</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addButton: {
    padding: 8,
  },
  searchSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#1A1A1A',
  },
  voiceSearchButton: {
    padding: 8,
  },
  categorySection: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  termsList: {
    padding: 16,
  },
  termCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  termHeader: {
    marginBottom: 8,
  },
  termTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  termName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  termPronunciation: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  termDefinition: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  termFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  termActions: {
    flexDirection: 'row',
  },
  termAction: {
    padding: 6,
    marginLeft: 8,
  },
  quickAccessSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: '1%',
  },
  quickAccessText: {
    fontSize: 13,
    color: '#1A1A1A',
    marginTop: 8,
  },
});

export default MedicalTerminologyScreen;
