import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const TermsOfServiceScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: January 4, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing and using VoiceCode, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. Use License</Text>
        <Text style={styles.text}>
          Permission is granted to use VoiceCode for personal or commercial transcription purposes.
        </Text>

        <Text style={styles.sectionTitle}>3. Disclaimer</Text>
        <Text style={styles.text}>
          The materials on VoiceCode are provided on an &apos;as is&apos; basis. VoiceCode makes no warranties, expressed or implied.
        </Text>

        <Text style={styles.sectionTitle}>4. Limitations</Text>
        <Text style={styles.text}>
          In no event shall VoiceCode or its suppliers be liable for any damages arising out of the use or inability to use the service.
        </Text>

        <Text style={styles.sectionTitle}>5. Contact</Text>
        <Text style={styles.text}>
          Questions about the Terms of Service should be sent to us at support@voicecode.com
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  updated: { fontSize: 14, color: '#999', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  text: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 16 },
});

export default TermsOfServiceScreen;

