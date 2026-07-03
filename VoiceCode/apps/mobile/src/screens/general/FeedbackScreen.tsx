import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const TYPES: { key: FeedbackType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'bug', label: 'Bug report', icon: 'bug-outline' },
  { key: 'feature', label: 'Feature request', icon: 'bulb-outline' },
  { key: 'general', label: 'General feedback', icon: 'chatbubble-outline' },
];

const FeedbackScreen: React.FC<FeedbackScreenProps> = () => {
  const [type, setType] = useState<FeedbackType>('general');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addAttachment = () => {
    setAttachments((prev) => [...prev, prev.length + 1]);
  };

  const removeAttachment = (id: number) => {
    setAttachments((prev) => prev.filter((a) => a !== id));
  };

  const handleSubmit = () => {
    if (!message.trim()) {
      setError('Message is required');
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess('Thank you for your feedback!');
  };

  return (
    <ScrollView style={styles.container} testID="feedback-screen">
      <Text style={styles.heading}>Send Feedback</Text>

      <View testID="feedback-form">
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setType(t.key)}
                testID={`type-${t.key}`}
              >
                <Ionicons name={t.icon} size={18} color={active ? '#fff' : '#667eea'} />
                <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Rating</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)} testID={`rating-${n}`}>
              <Ionicons
                name={n <= rating ? 'star' : 'star-outline'}
                size={28}
                color="#f59e0b"
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Message</Text>
        <TextInput
          testID="feedback-message"
          style={styles.messageInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what you think"
          multiline
        />

        <TouchableOpacity style={styles.attachButton} onPress={addAttachment} testID="attach-screenshot">
          <Ionicons name="image-outline" size={18} color="#667eea" />
          <Text style={styles.attachText}>Attach screenshot</Text>
        </TouchableOpacity>

        {attachments.map((id) => (
          <View key={id} style={styles.attachment} testID={`attachment-${id}`}>
            <Ionicons name="document-attach-outline" size={18} color="#667eea" />
            <Text style={styles.attachmentName}>Screenshot {id}</Text>
            <TouchableOpacity onPress={() => removeAttachment(id)} testID={`remove-attachment-${id}`}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} testID="submit-feedback">
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  heading: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#888', paddingHorizontal: 16, marginTop: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 8 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  typeChipActive: { backgroundColor: '#667eea' },
  typeLabel: { marginLeft: 6, color: '#667eea', fontSize: 14 },
  typeLabelActive: { color: '#fff' },
  ratingRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8 },
  star: { marginHorizontal: 4 },
  messageInput: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
    padding: 12,
    minHeight: 96,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1a1a2e',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachText: { marginLeft: 8, color: '#667eea', fontSize: 15 },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
  },
  attachmentName: { flex: 1, marginLeft: 8, color: '#1a1a2e' },
  error: { color: '#ef4444', paddingHorizontal: 16, paddingTop: 8, fontWeight: '600' },
  success: { color: '#22c55e', paddingHorizontal: 16, paddingTop: 8, fontWeight: '600' },
  submitButton: {
    backgroundColor: '#667eea',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default FeedbackScreen;
