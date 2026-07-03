import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MIT_TEXT =
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.';

const APACHE_TEXT =
  'Licensed under the Apache License, Version 2.0. You may not use this file except in compliance with the License. Unless required by applicable law, the software is distributed on an "AS IS" BASIS.';

const BSD_TEXT =
  'Redistribution and use in source and binary forms, with or without modification, are permitted provided that the above copyright notice and this list of conditions are retained.';

const ISC_TEXT =
  'Permission to use, copy, modify, and distribute this software for any purpose with or without fee is hereby granted, provided that the copyright notice appears in all copies.';

interface License {
  id: number;
  name: string;
  version: string;
  type: string;
  text: string;
}

const LICENSES: License[] = [
  { id: 1, name: 'react-native', version: '0.76.0', type: 'MIT', text: MIT_TEXT },
  { id: 2, name: 'expo', version: '52.0.0', type: 'Apache-2.0', text: APACHE_TEXT },
  { id: 3, name: 'react-navigation', version: '7.0.0', type: 'BSD-3-Clause', text: BSD_TEXT },
  { id: 4, name: 'lodash', version: '4.17.21', type: 'ISC', text: ISC_TEXT },
];

interface LicensesScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const LicensesScreen: React.FC<LicensesScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [grouped, setGrouped] = useState(false);

  const filtered = useMemo(
    () =>
      query
        ? LICENSES.filter(
            (l) => l.name.toLowerCase().includes(query.toLowerCase()) || l.type.toLowerCase().includes(query.toLowerCase())
          )
        : LICENSES,
    [query]
  );

  const renderLicense = (license: License) => (
    <View key={license.id} style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpandedId((prev) => (prev === license.id ? null : license.id))}
        testID={`license-${license.id}`}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{license.name}</Text>
          <Text style={styles.version}>v{license.version}</Text>
        </View>
        <Text style={styles.type}>{license.type}</Text>
        <Ionicons name={expandedId === license.id ? 'chevron-up' : 'chevron-down'} size={18} color="#bbb" />
      </TouchableOpacity>
      {expandedId === license.id ? (
        <View style={styles.detail} testID={`license-detail-${license.id}`}>
          <Text style={styles.detailText}>{license.text}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <ScrollView style={styles.container} testID="licenses-screen">
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search packages"
        testID="search-input"
      />

      <TouchableOpacity style={styles.groupToggle} onPress={() => setGrouped((v) => !v)} testID="group-by-license">
        <Ionicons name="albums-outline" size={18} color="#667eea" />
        <Text style={styles.groupLabel}>{grouped ? 'Grouped by License' : 'Group by License'}</Text>
      </TouchableOpacity>

      {query ? (
        <View style={styles.list} testID="search-results">
          {filtered.map(renderLicense)}
        </View>
      ) : (
        <View style={styles.list} testID="license-list">
          {filtered.map(renderLicense)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  search: { backgroundColor: '#fff', margin: 16, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  groupToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 8 },
  groupLabel: { fontSize: 14, color: '#667eea' },
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  version: { fontSize: 12, color: '#888', marginTop: 2 },
  type: { fontSize: 13, color: '#667eea', marginRight: 10 },
  detail: { paddingHorizontal: 16, paddingBottom: 16 },
  detailText: { fontSize: 13, color: '#555', lineHeight: 19 },
});

export default LicensesScreen;
