import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursorPosition?: number;
  isTyping: boolean;
}

interface Comment {
  id: string;
  author: string;
  authorColor: string;
  text: string;
  timestamp: string;
  isResolved: boolean;
  replies: number;
}

const RealTimeCollaborationScreen: React.FC = () => {
  const [showComments, setShowComments] = useState(true);
  const [newComment, setNewComment] = useState('');

  const collaborators: Collaborator[] = [
    { id: '1', name: 'Sarah Chen', color: '#007AFF', cursorPosition: 245, isTyping: true },
    { id: '2', name: 'Mike Johnson', color: '#34C759', cursorPosition: 512, isTyping: false },
    { id: '3', name: 'Emily Davis', color: '#FF9500', isTyping: false },
  ];

  const comments: Comment[] = [
    {
      id: '1',
      author: 'Sarah Chen',
      authorColor: '#007AFF',
      text: 'Should we add more context about the Q2 projections here?',
      timestamp: '2 min ago',
      isResolved: false,
      replies: 2,
    },
    {
      id: '2',
      author: 'Mike Johnson',
      authorColor: '#34C759',
      text: 'The revenue figures need to be updated with the latest data.',
      timestamp: '15 min ago',
      isResolved: false,
      replies: 0,
    },
    {
      id: '3',
      author: 'Emily Davis',
      authorColor: '#FF9500',
      text: 'Great summary of the action items!',
      timestamp: '1 hour ago',
      isResolved: true,
      replies: 1,
    },
  ];

  const documentContent = `Meeting Notes - Q1 Planning Session

Date: January 18, 2026
Attendees: Sarah Chen, Mike Johnson, Emily Davis, Jordan Lee

Agenda:
1. Review Q4 Results
2. Discuss Q1 Goals
3. Resource Allocation
4. Action Items

Discussion Summary:

The team reviewed the Q4 performance metrics, noting a 15% increase in user engagement and a 12% growth in revenue compared to Q3.

Key decisions made:
• Increase marketing budget by 20% for Q1
• Hire two additional developers for the mobile team
• Launch beta version of new features by end of February

Action Items:
- Sarah: Prepare detailed budget proposal by Friday
- Mike: Complete technical specification for new API
- Emily: Design mockups for dashboard redesign`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Q1 Planning Notes</Text>
          <View style={styles.collaboratorsRow}>
            {collaborators.map((c, i) => (
              <View
                key={c.id}
                style={[
                  styles.collaboratorDot,
                  { backgroundColor: c.color, marginLeft: i > 0 ? -6 : 0 },
                ]}
              >
                {c.isTyping && <View style={styles.typingIndicator} />}
              </View>
            ))}
            <Text style={styles.collaboratorCount}>{collaborators.length} editing</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="text" size={18} color="#1C1C1E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="color-wand" size={18} color="#1C1C1E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="list" size={18} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={styles.toolDivider} />
        <TouchableOpacity
          style={[styles.toolButton, showComments && styles.toolButtonActive]}
          onPress={() => setShowComments(!showComments)}
        >
          <Ionicons name="chatbubble" size={18} color={showComments ? '#FFF' : '#1C1C1E'} />
          <View style={styles.commentBadge}>
            <Text style={styles.commentBadgeText}>
              {comments.filter(c => !c.isResolved).length}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton}>
          <Ionicons name="time" size={18} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <ScrollView style={styles.documentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.cursorIndicators}>
            {collaborators
              .filter(c => c.cursorPosition)
              .map(c => (
                <View
                  key={c.id}
                  style={[
                    styles.remoteCursor,
                    { top: c.cursorPosition! / 10, borderColor: c.color },
                  ]}
                >
                  <View style={[styles.cursorFlag, { backgroundColor: c.color }]}>
                    <Text style={styles.cursorName}>{c.name.split(' ')[0]}</Text>
                  </View>
                </View>
              ))}
          </View>
          <Text style={styles.documentText}>{documentContent}</Text>
          <View style={styles.documentPadding} />
        </ScrollView>

        {showComments && (
          <View style={styles.commentsPanel}>
            <View style={styles.commentsPanelHeader}>
              <Text style={styles.commentsPanelTitle}>Comments</Text>
              <TouchableOpacity>
                <Text style={styles.filterText}>
                  Open ({comments.filter(c => !c.isResolved).length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {comments.map(comment => (
                <TouchableOpacity
                  key={comment.id}
                  style={[styles.commentCard, comment.isResolved && styles.commentResolved]}
                >
                  <View style={styles.commentHeader}>
                    <View style={[styles.commentAvatar, { backgroundColor: comment.authorColor }]}>
                      <Text style={styles.commentAvatarText}>{comment.author[0]}</Text>
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                      <Text style={styles.commentTime}>{comment.timestamp}</Text>
                    </View>
                    {comment.isResolved && (
                      <View style={styles.resolvedBadge}>
                        <Ionicons name="checkmark" size={12} color="#34C759" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  {comment.replies > 0 && (
                    <Text style={styles.repliesText}>
                      {comment.replies} {comment.replies === 1 ? 'reply' : 'replies'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.newCommentContainer}>
              <TextInput
                style={styles.newCommentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#8E8E93"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity style={styles.sendButton}>
                <Ionicons name="send" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={styles.syncStatus}>
            <Ionicons name="cloud-done" size={16} color="#34C759" />
            <Text style={styles.syncText}>Saved</Text>
          </View>
        </View>
        <View style={styles.statusRight}>
          <Text style={styles.wordCount}>1,245 words</Text>
          <Text style={styles.lastEdit}>Last edit 2 min ago</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 4 },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  collaboratorsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  collaboratorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  collaboratorCount: { fontSize: 12, color: '#8E8E93', marginLeft: 8 },
  shareButton: { padding: 4 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9F9FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    position: 'relative',
  },
  toolButtonActive: { backgroundColor: '#007AFF' },
  toolDivider: { width: 1, height: 24, backgroundColor: '#E5E5EA', marginHorizontal: 8 },
  commentBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  mainContent: { flex: 1, flexDirection: 'row' },
  documentContainer: { flex: 1, padding: 20, position: 'relative' },
  cursorIndicators: { position: 'absolute', left: 20, right: 20 },
  remoteCursor: { position: 'absolute', left: 0, borderLeftWidth: 2 },
  cursorFlag: {
    position: 'absolute',
    top: -18,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cursorName: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  documentText: { fontSize: 16, lineHeight: 26, color: '#1C1C1E' },
  documentPadding: { height: 100 },
  commentsPanel: {
    width: 280,
    backgroundColor: '#F9F9FB',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
  },
  commentsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  commentsPanelTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  filterText: { fontSize: 13, color: '#007AFF' },
  commentsList: { flex: 1 },
  commentCard: {
    backgroundColor: '#FFF',
    margin: 10,
    marginBottom: 0,
    borderRadius: 12,
    padding: 12,
  },
  commentResolved: { opacity: 0.6 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  commentMeta: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  commentTime: { fontSize: 11, color: '#8E8E93' },
  resolvedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentText: { fontSize: 13, color: '#3C3C43', lineHeight: 18 },
  repliesText: { fontSize: 12, color: '#007AFF', marginTop: 8 },
  newCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  newCommentInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1C1C1E',
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9F9FB',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  syncStatus: { flexDirection: 'row', alignItems: 'center' },
  syncText: { fontSize: 12, color: '#34C759', marginLeft: 4 },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  wordCount: { fontSize: 12, color: '#8E8E93', marginRight: 12 },
  lastEdit: { fontSize: 12, color: '#8E8E93' },
});

export default RealTimeCollaborationScreen;
