import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Specialty {
  id: string;
  name: string;
  icon: string;
  color: string;
  templateCount: number;
  isSubscribed: boolean;
}

interface Template {
  id: string;
  name: string;
  specialty: string;
  downloads: number;
  rating: number;
  author: string;
  isOfficial: boolean;
}

const SpecialtyTemplatesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const specialties: Specialty[] = [
    {
      id: 'gp',
      name: 'General Practice',
      icon: 'person',
      color: '#007AFF',
      templateCount: 45,
      isSubscribed: true,
    },
    {
      id: 'cardio',
      name: 'Cardiology',
      icon: 'heart',
      color: '#FF3B30',
      templateCount: 32,
      isSubscribed: true,
    },
    {
      id: 'peds',
      name: 'Pediatrics',
      icon: 'happy',
      color: '#FF9500',
      templateCount: 28,
      isSubscribed: false,
    },
    {
      id: 'ortho',
      name: 'Orthopedics',
      icon: 'body',
      color: '#34C759',
      templateCount: 24,
      isSubscribed: false,
    },
    {
      id: 'neuro',
      name: 'Neurology',
      icon: 'flash',
      color: '#5856D6',
      templateCount: 22,
      isSubscribed: false,
    },
    {
      id: 'psych',
      name: 'Psychiatry',
      icon: 'chatbubbles',
      color: '#AF52DE',
      templateCount: 31,
      isSubscribed: true,
    },
    {
      id: 'derm',
      name: 'Dermatology',
      icon: 'hand-left',
      color: '#FF2D55',
      templateCount: 18,
      isSubscribed: false,
    },
    {
      id: 'er',
      name: 'Emergency',
      icon: 'medkit',
      color: '#FF3B30',
      templateCount: 35,
      isSubscribed: true,
    },
    {
      id: 'internal',
      name: 'Internal Medicine',
      icon: 'medical',
      color: '#00C7BE',
      templateCount: 42,
      isSubscribed: true,
    },
    {
      id: 'surgery',
      name: 'Surgery',
      icon: 'cut',
      color: '#8E8E93',
      templateCount: 26,
      isSubscribed: false,
    },
    {
      id: 'obgyn',
      name: 'OB/GYN',
      icon: 'female',
      color: '#FF6B9D',
      templateCount: 29,
      isSubscribed: false,
    },
    {
      id: 'oncology',
      name: 'Oncology',
      icon: 'cellular',
      color: '#5856D6',
      templateCount: 20,
      isSubscribed: false,
    },
  ];

  const featuredTemplates: Template[] = [
    {
      id: '1',
      name: 'Comprehensive H&P',
      specialty: 'Internal Medicine',
      downloads: 12500,
      rating: 4.9,
      author: 'Dr. Sarah Chen',
      isOfficial: true,
    },
    {
      id: '2',
      name: 'Cardiac Workup',
      specialty: 'Cardiology',
      downloads: 8900,
      rating: 4.8,
      author: 'Dr. Michael Ross',
      isOfficial: true,
    },
    {
      id: '3',
      name: 'Mental Status Exam',
      specialty: 'Psychiatry',
      downloads: 7200,
      rating: 4.7,
      author: 'Dr. Emily Wong',
      isOfficial: true,
    },
    {
      id: '4',
      name: 'Trauma Assessment',
      specialty: 'Emergency',
      downloads: 11000,
      rating: 4.9,
      author: 'Dr. James Miller',
      isOfficial: true,
    },
  ];

  const filteredSpecialties = specialties.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSpecialtyCard = ({ item }: { item: Specialty }) => (
    <TouchableOpacity
      style={[styles.specialtyCard, selectedSpecialty === item.id && styles.specialtyCardSelected]}
      onPress={() => setSelectedSpecialty(selectedSpecialty === item.id ? null : item.id)}
    >
      <View style={[styles.specialtyIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={styles.specialtyName}>{item.name}</Text>
      <Text style={styles.templateCount}>{item.templateCount} templates</Text>
      {item.isSubscribed && (
        <View style={styles.subscribedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#34C759" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFeaturedTemplate = ({ item }: { item: Template }) => (
    <TouchableOpacity style={styles.featuredCard}>
      <View style={styles.featuredHeader}>
        <Text style={styles.featuredName}>{item.name}</Text>
        {item.isOfficial && (
          <View style={styles.officialBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#007AFF" />
            <Text style={styles.officialText}>Official</Text>
          </View>
        )}
      </View>
      <Text style={styles.featuredSpecialty}>{item.specialty}</Text>
      <View style={styles.featuredMeta}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD60A" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <Text style={styles.downloadsText}>{(item.downloads / 1000).toFixed(1)}k downloads</Text>
      </View>
      <Text style={styles.authorText}>by {item.author}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Specialty Templates</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search specialties..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>200+</Text>
            <Text style={styles.statLabel}>Specialties</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1,500+</Text>
            <Text style={styles.statLabel}>Templates</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>50k+</Text>
            <Text style={styles.statLabel}>Clinicians</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Templates</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredTemplates}
            renderItem={renderFeaturedTemplate}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Specialties</Text>
          <View style={styles.specialtiesGrid}>
            {filteredSpecialties.map(specialty => (
              <View key={specialty.id} style={styles.specialtyGridItem}>
                {renderSpecialtyCard({ item: specialty })}
              </View>
            ))}
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
  filterButton: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  content: { flex: 1 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  seeAllText: { fontSize: 14, color: '#007AFF' },
  featuredList: { paddingHorizontal: 16 },
  featuredCard: {
    width: 200,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  featuredName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  officialText: { fontSize: 10, color: '#007AFF', marginLeft: 2 },
  featuredSpecialty: { fontSize: 13, color: '#8E8E93', marginBottom: 10 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  ratingText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', marginLeft: 4 },
  downloadsText: { fontSize: 12, color: '#8E8E93' },
  authorText: { fontSize: 12, color: '#007AFF' },
  specialtiesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  specialtyGridItem: { width: '50%', padding: 4 },
  specialtyCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  specialtyCardSelected: { borderColor: '#007AFF' },
  specialtyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialtyName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  templateCount: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  subscribedBadge: { position: 'absolute', top: 10, right: 10 },
  bottomPadding: { height: 40 },
});

export default SpecialtyTemplatesScreen;
