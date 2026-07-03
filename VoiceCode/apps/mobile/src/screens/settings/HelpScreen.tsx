import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FaqEntry {
  id: number;
  question: string;
  answer: string;
}

const FAQS: FaqEntry[] = [
  {
    id: 1,
    question: 'How do I start a recording?',
    answer: 'Open the Home tab and tap the microphone button to begin a new recording.',
  },
  {
    id: 2,
    question: 'How is my transcription stored?',
    answer: 'Transcripts sync securely to your account and are available across your devices.',
  },
  {
    id: 3,
    question: 'Can I export my transcripts?',
    answer: 'Yes. Open any transcript and choose Export to save it as text, PDF, or subtitles.',
  },
];

interface HelpScreenProps {
  navigation: { navigate: (screen: string, params?: object) => void; goBack: () => void };
}

const HelpScreen: React.FC<HelpScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredFaqs = query
    ? FAQS.filter((f) => f.question.toLowerCase().includes(query.toLowerCase()))
    : FAQS;

  return (
    <ScrollView style={styles.container} testID="help-screen">
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search help topics"
        testID="search-input"
      />

      <TouchableOpacity
        style={styles.guideRow}
        onPress={() => navigation.navigate('Guide', { guideId: 'getting-started' })}
      >
        <Ionicons name="rocket-outline" size={20} color="#667eea" style={styles.rowIcon} />
        <Text style={styles.guideLabel}>Getting Started</Text>
        <Ionicons name="chevron-forward" size={18} color="#bbb" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      <View style={styles.section}>
        {filteredFaqs.map((faq) => (
          <View key={faq.id}>
            <TouchableOpacity style={styles.faqRow} onPress={() => toggle(faq.id)} testID={`faq-item-${faq.id}`}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Ionicons name={expanded[faq.id] ? 'chevron-up' : 'chevron-down'} size={18} color="#bbb" />
            </TouchableOpacity>
            {expanded[faq.id] ? (
              <Text style={styles.faqAnswer} testID={`faq-answer-${faq.id}`}>
                {faq.answer}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Contact Support</Text>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.faqRow}
          onPress={() => Linking.openURL('mailto:support@voicecode.app').catch(() => undefined)}
          testID="email-support"
        >
          <Ionicons name="mail-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.contactLabel}>Email Support</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.faqRow}
          onPress={() => Linking.openURL('https://voicecode.app/chat').catch(() => undefined)}
          testID="chat-support"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.contactLabel}>Live Chat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  search: { backgroundColor: '#fff', margin: 16, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  guideRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14 },
  guideLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  rowIcon: { marginRight: 12 },
  sectionTitle: { fontSize: 13, color: '#888', textTransform: 'uppercase', marginHorizontal: 16, marginTop: 24, marginBottom: 8 },
  section: { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5ea' },
  faqRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee' },
  faqQuestion: { flex: 1, fontSize: 15, color: '#1a1a2e' },
  faqAnswer: { fontSize: 14, color: '#555', paddingHorizontal: 16, paddingBottom: 14, lineHeight: 20 },
  contactLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
});

export default HelpScreen;
