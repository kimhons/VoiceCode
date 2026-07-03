import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface SearchResult {
  id: string;
  recordingTitle: string;
  timestamp: number;
  text: string;
  matchedText: string;
  speaker?: string;
}

const TranscriptSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const recentSearches = ['action items', 'budget review', 'patient diagnosis', 'project timeline'];

  const searchFilters = [
    { id: 'meetings', label: 'Meetings', icon: 'people' },
    { id: 'interviews', label: 'Interviews', icon: 'person' },
    { id: 'medical', label: 'Medical', icon: 'medical' },
    { id: 'notes', label: 'Notes', icon: 'document-text' },
  ];

  const results: SearchResult[] = [
    {
      id: '1',
      recordingTitle: 'Q4 Budget Review Meeting',
      timestamp: 245,
      text: 'We need to allocate more resources to the marketing budget for Q1.',
      matchedText: 'budget',
      speaker: 'John',
    },
    {
      id: '2',
      recordingTitle: 'Team Standup - Jan 15',
      timestamp: 180,
      text: 'The budget constraints are affecting our timeline for the new feature.',
      matchedText: 'budget',
      speaker: 'Sarah',
    },
    {
      id: '3',
      recordingTitle: 'Client Call - Acme Corp',
      timestamp: 890,
      text: 'Their budget for this quarter is around fifty thousand dollars.',
      matchedText: 'budget',
      speaker: 'Mike',
    },
    {
      id: '4',
      recordingTitle: 'Finance Department Sync',
      timestamp: 420,
      text: "We're reviewing the annual budget projections for next fiscal year.",
      matchedText: 'budget',
      speaker: 'Lisa',
    },
  ];

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  };

  const highlightMatch = (text: string, match: string): React.ReactNode => {
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === match.toLowerCase() ? (
        <Text key={i} style={styles.highlightedText}>
          {part}
        </Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    );
  };

  const performSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Search Transcripts</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search across all transcripts..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={performSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {searchFilters.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  selectedFilters.includes(filter.id) && styles.filterChipActive,
                ]}
                onPress={() => toggleFilter(filter.id)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={14}
                  color={selectedFilters.includes(filter.id) ? '#FFF' : '#007AFF'}
                />
                <Text
                  style={[
                    styles.filterText,
                    selectedFilters.includes(filter.id) && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dateRangeRow}>
          {(['all', 'week', 'month', 'year'] as const).map(range => (
            <TouchableOpacity
              key={range}
              style={[styles.dateButton, dateRange === range && styles.dateButtonActive]}
              onPress={() => setDateRange(range)}
            >
              <Text style={[styles.dateText, dateRange === range && styles.dateTextActive]}>
                {range === 'all'
                  ? 'All Time'
                  : range === 'week'
                    ? 'Week'
                    : range === 'month'
                      ? 'Month'
                      : 'Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.length === 0 ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.map((search, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.recentItem}
                  onPress={() => setSearchQuery(search)}
                >
                  <Ionicons name="time-outline" size={18} color="#8E8E93" />
                  <Text style={styles.recentText}>{search}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#8E8E93" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Tips</Text>
              <View style={styles.tipsCard}>
                <View style={styles.tipRow}>
                  <Text style={styles.tipCode}>&quot;exact phrase&quot;</Text>
                  <Text style={styles.tipDesc}>Search for exact phrases</Text>
                </View>
                <View style={styles.tipRow}>
                  <Text style={styles.tipCode}>speaker:John</Text>
                  <Text style={styles.tipDesc}>Filter by speaker name</Text>
                </View>
                <View style={styles.tipRow}>
                  <Text style={styles.tipCode}>date:2026-01-15</Text>
                  <Text style={styles.tipDesc}>Filter by specific date</Text>
                </View>
                <View style={styles.tipRow}>
                  <Text style={styles.tipCode}>-exclude</Text>
                  <Text style={styles.tipDesc}>Exclude words from search</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} results for &quot;{searchQuery}&quot;
              </Text>
              <TouchableOpacity style={styles.sortButton}>
                <Text style={styles.sortText}>Relevance</Text>
                <Ionicons name="chevron-down" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {results.map(result => (
              <TouchableOpacity key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultIcon}>
                    <Ionicons name="document-text" size={16} color="#007AFF" />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{result.recordingTitle}</Text>
                    <View style={styles.resultMeta}>
                      {result.speaker && (
                        <>
                          <Ionicons name="person" size={12} color="#8E8E93" />
                          <Text style={styles.metaText}>{result.speaker}</Text>
                          <Text style={styles.metaDot}>•</Text>
                        </>
                      )}
                      <Ionicons name="time" size={12} color="#8E8E93" />
                      <Text style={styles.metaText}>{formatTimestamp(result.timestamp)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.playButton}>
                    <Ionicons name="play" size={18} color="#007AFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.resultText}>
                  {highlightMatch(result.text, result.matchedText)}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

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
  },
  backButton: { padding: 4 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 32 },
  searchSection: {
    backgroundColor: '#FFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E', marginLeft: 10 },
  filtersRow: { marginTop: 12 },
  filtersScroll: { paddingHorizontal: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 13, color: '#007AFF', marginLeft: 4 },
  filterTextActive: { color: '#FFF' },
  dateRangeRow: { flexDirection: 'row', marginTop: 12, paddingHorizontal: 16 },
  dateButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  dateButtonActive: { backgroundColor: '#007AFF15' },
  dateText: { fontSize: 13, color: '#8E8E93' },
  dateTextActive: { color: '#007AFF', fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentText: { flex: 1, fontSize: 15, color: '#1C1C1E', marginLeft: 12 },
  tipsCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tipCode: {
    fontSize: 13,
    fontFamily: 'Courier',
    color: '#AF52DE',
    backgroundColor: '#AF52DE10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  tipDesc: { fontSize: 14, color: '#8E8E93', flex: 1 },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: { fontSize: 14, color: '#8E8E93' },
  sortButton: { flexDirection: 'row', alignItems: 'center' },
  sortText: { fontSize: 14, color: '#007AFF', marginRight: 4 },
  resultCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  resultMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  metaDot: { marginHorizontal: 6, color: '#8E8E93' },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: { fontSize: 14, color: '#3C3C43', lineHeight: 20 },
  highlightedText: { backgroundColor: '#FFEB3B80', fontWeight: '600' },
  bottomPadding: { height: 40 },
});

export default TranscriptSearchScreen;
