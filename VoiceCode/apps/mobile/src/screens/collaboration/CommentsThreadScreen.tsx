import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: string;
  author: string;
  authorColor: string;
  text: string;
  timestamp: string;
  isEdited: boolean;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
}

interface Thread {
  id: string;
  originalComment: Comment;
  replies: Comment[];
  isResolved: boolean;
  quotedText: string;
  quotedTimestamp: string;
}

const CommentsThreadScreen: React.FC = () => {
  const [newReply, setNewReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const thread: Thread = {
    id: '1',
    originalComment: {
      id: 'c1',
      author: 'Sarah Chen',
      authorColor: '#007AFF',
      text: 'Should we add more context about the Q2 projections here? I think the stakeholders would benefit from seeing the historical comparison.',
      timestamp: '2 hours ago',
      isEdited: false,
      reactions: [
        { emoji: '👍', count: 3, hasReacted: true },
        { emoji: '💡', count: 1, hasReacted: false },
      ],
    },
    replies: [
      {
        id: 'c2',
        author: 'Mike Johnson',
        authorColor: '#34C759',
        text: 'Good point! I can add the Q1 and Q4 data for comparison. Should I include year-over-year as well?',
        timestamp: '1 hour ago',
        isEdited: false,
        reactions: [{ emoji: '👍', count: 2, hasReacted: false }],
      },
      {
        id: 'c3',
        author: 'Sarah Chen',
        authorColor: '#007AFF',
        text: 'Yes, year-over-year would be really helpful. Can you also highlight the key growth areas?',
        timestamp: '45 min ago',
        isEdited: true,
        reactions: [],
      },
      {
        id: 'c4',
        author: 'Emily Davis',
        authorColor: '#FF9500',
        text: "I can help with the visualization. I'll create a chart that shows the trends clearly.",
        timestamp: '30 min ago',
        isEdited: false,
        reactions: [
          { emoji: '🎉', count: 1, hasReacted: false },
          { emoji: '👍', count: 1, hasReacted: true },
        ],
      },
    ],
    isResolved: false,
    quotedText:
      '...reviewing the Q2 performance metrics, noting a 15% increase in user engagement...',
    quotedTimestamp: '2:45',
  };

  const renderComment = (comment: Comment, isOriginal: boolean = false) => (
    <View key={comment.id} style={[styles.commentCard, isOriginal && styles.originalComment]}>
      <View style={styles.commentHeader}>
        <View style={[styles.avatar, { backgroundColor: comment.authorColor }]}>
          <Text style={styles.avatarText}>
            {comment.author
              .split(' ')
              .map(n => n[0])
              .join('')}
          </Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.authorName}>{comment.author}</Text>
          <View style={styles.timestampRow}>
            <Text style={styles.timestamp}>{comment.timestamp}</Text>
            {comment.isEdited && <Text style={styles.editedBadge}>(edited)</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Text style={styles.commentText}>{comment.text}</Text>

      {comment.reactions.length > 0 && (
        <View style={styles.reactionsRow}>
          {comment.reactions.map((reaction, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.reactionChip, reaction.hasReacted && styles.reactionChipActive]}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text
                style={[styles.reactionCount, reaction.hasReacted && styles.reactionCountActive]}
              >
                {reaction.count}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addReactionButton}>
            <Ionicons name="add" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Thread</Text>
          <Text style={styles.replyCount}>{thread.replies.length + 1} comments</Text>
        </View>
        <TouchableOpacity style={styles.resolveButton}>
          <Ionicons
            name={thread.isResolved ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={24}
            color={thread.isResolved ? '#34C759' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.quotedSection}>
        <TouchableOpacity style={styles.quotedContent}>
          <View style={styles.quotedBar} />
          <View style={styles.quotedTextContainer}>
            <Text style={styles.quotedLabel}>Referenced text</Text>
            <Text style={styles.quotedText} numberOfLines={2}>
              {thread.quotedText}
            </Text>
          </View>
          <View style={styles.quotedTimestamp}>
            <Ionicons name="play-circle" size={20} color="#007AFF" />
            <Text style={styles.timestampText}>{thread.quotedTimestamp}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false}>
          {renderComment(thread.originalComment, true)}

          {thread.replies.length > 0 && (
            <View style={styles.repliesSection}>
              <View style={styles.repliesDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.repliesLabel}>{thread.replies.length} replies</Text>
                <View style={styles.dividerLine} />
              </View>

              {thread.replies.map(reply => renderComment(reply))}
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        <View style={styles.replyContainer}>
          {isReplying ? (
            <View style={styles.replyInputContainer}>
              <View style={styles.replyingTo}>
                <Text style={styles.replyingText}>Replying to thread</Text>
                <TouchableOpacity onPress={() => setIsReplying(false)}>
                  <Ionicons name="close" size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Write a reply..."
                  placeholderTextColor="#8E8E93"
                  value={newReply}
                  onChangeText={setNewReply}
                  multiline
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.sendButton, !newReply.trim() && styles.sendButtonDisabled]}
                  disabled={!newReply.trim()}
                >
                  <Ionicons name="send" size={20} color={newReply.trim() ? '#007AFF' : '#C7C7CC'} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.replyPrompt} onPress={() => setIsReplying(true)}>
              <View style={styles.promptAvatar}>
                <Text style={styles.promptAvatarText}>Y</Text>
              </View>
              <Text style={styles.promptText}>Write a reply...</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  replyCount: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  resolveButton: { padding: 4 },
  quotedSection: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  quotedContent: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  quotedBar: { width: 3, height: 40, backgroundColor: '#007AFF', borderRadius: 2, marginRight: 12 },
  quotedTextContainer: { flex: 1 },
  quotedLabel: { fontSize: 11, color: '#8E8E93', marginBottom: 4 },
  quotedText: { fontSize: 14, color: '#3C3C43', fontStyle: 'italic' },
  quotedTimestamp: { flexDirection: 'row', alignItems: 'center' },
  timestampText: { fontSize: 12, color: '#007AFF', marginLeft: 4 },
  keyboardView: { flex: 1 },
  commentsContainer: { flex: 1, padding: 16 },
  commentCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  originalComment: { borderWidth: 1, borderColor: '#007AFF30' },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  commentMeta: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  timestampRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  timestamp: { fontSize: 12, color: '#8E8E93' },
  editedBadge: { fontSize: 11, color: '#8E8E93', marginLeft: 6 },
  moreButton: { padding: 4 },
  commentText: { fontSize: 15, color: '#1C1C1E', lineHeight: 22 },
  reactionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 8,
  },
  reactionChipActive: { backgroundColor: '#007AFF15', borderWidth: 1, borderColor: '#007AFF' },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 13, color: '#8E8E93', marginLeft: 4 },
  reactionCountActive: { color: '#007AFF' },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repliesSection: { marginTop: 8 },
  repliesDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E5EA' },
  repliesLabel: { fontSize: 12, color: '#8E8E93', marginHorizontal: 12 },
  bottomPadding: { height: 20 },
  replyContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 12,
  },
  replyInputContainer: {},
  replyingTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyingText: { fontSize: 12, color: '#8E8E93' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  replyInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1C1E',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.5 },
  replyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  promptAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  promptAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  promptText: { fontSize: 15, color: '#8E8E93' },
});

export default CommentsThreadScreen;
