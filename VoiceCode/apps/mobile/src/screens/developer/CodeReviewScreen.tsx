import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ReviewComment {
  id: string;
  line: number;
  type: 'suggestion' | 'issue' | 'praise' | 'question';
  content: string;
  severity: 'low' | 'medium' | 'high';
}

interface CodeReview {
  filename: string;
  language: string;
  overallScore: number;
  comments: ReviewComment[];
  summary: string;
}

const CodeReviewScreen: React.FC = () => {
  const [review, setReview] = useState<CodeReview>({
    filename: 'UserService.ts',
    language: 'TypeScript',
    overallScore: 85,
    summary:
      'Good overall structure with some minor improvements suggested for error handling and type safety.',
    comments: [
      {
        id: '1',
        line: 15,
        type: 'issue',
        content: 'Missing null check before accessing user.email',
        severity: 'high',
      },
      {
        id: '2',
        line: 23,
        type: 'suggestion',
        content: 'Consider using async/await instead of .then() for consistency',
        severity: 'low',
      },
      {
        id: '3',
        line: 45,
        type: 'praise',
        content: 'Great use of TypeScript generics here!',
        severity: 'low',
      },
      {
        id: '4',
        line: 67,
        type: 'question',
        content: 'Is this error message user-facing? Consider i18n.',
        severity: 'medium',
      },
    ],
  });

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'issues' | 'suggestions'>('all');

  const getCommentIcon = (type: ReviewComment['type']) => {
    switch (type) {
      case 'issue':
        return 'alert-circle';
      case 'suggestion':
        return 'bulb';
      case 'praise':
        return 'thumbs-up';
      case 'question':
        return 'help-circle';
      default:
        return 'chatbubble';
    }
  };

  const getCommentColor = (type: ReviewComment['type']) => {
    switch (type) {
      case 'issue':
        return '#FF3B30';
      case 'suggestion':
        return '#FF9500';
      case 'praise':
        return '#34C759';
      case 'question':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  const getSeverityColor = (severity: ReviewComment['severity']) => {
    switch (severity) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#666';
    }
  };

  const filteredComments = review.comments.filter(comment => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'issues') return comment.type === 'issue';
    if (selectedFilter === 'suggestions') return comment.type === 'suggestion';
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34C759';
    if (score >= 60) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Code Review</Text>
        <TouchableOpacity style={styles.newReviewButton}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.newReviewText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreValue, { color: getScoreColor(review.overallScore) }]}>
              {review.overallScore}
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.filename}>{review.filename}</Text>
            <Text style={styles.language}>{review.language}</Text>
            <Text style={styles.summary}>{review.summary}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF3B30' }]}>
              {review.comments.filter(c => c.type === 'issue').length}
            </Text>
            <Text style={styles.statLabel}>Issues</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF9500' }]}>
              {review.comments.filter(c => c.type === 'suggestion').length}
            </Text>
            <Text style={styles.statLabel}>Suggestions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#34C759' }]}>
              {review.comments.filter(c => c.type === 'praise').length}
            </Text>
            <Text style={styles.statLabel}>Praise</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#007AFF' }]}>
              {review.comments.filter(c => c.type === 'question').length}
            </Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'issues', 'suggestions'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Review Comments</Text>
          {filteredComments.map(comment => (
            <TouchableOpacity key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View
                  style={[
                    styles.commentIcon,
                    { backgroundColor: `${getCommentColor(comment.type)}20` },
                  ]}
                >
                  <Ionicons
                    name={getCommentIcon(comment.type) as any}
                    size={16}
                    color={getCommentColor(comment.type)}
                  />
                </View>
                <View style={styles.commentMeta}>
                  <Text style={styles.commentType}>{comment.type}</Text>
                  <Text style={styles.commentLine}>Line {comment.line}</Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: `${getSeverityColor(comment.severity)}20` },
                  ]}
                >
                  <Text
                    style={[styles.severityText, { color: getSeverityColor(comment.severity) }]}
                  >
                    {comment.severity}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <View style={styles.commentActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="checkmark" size={16} color="#34C759" />
                  <Text style={[styles.actionText, { color: '#34C759' }]}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
                  <Text style={[styles.actionText, { color: '#007AFF' }]}>Discuss</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="close" size={16} color="#999" />
                  <Text style={styles.actionText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryAction}>
            <Ionicons name="checkmark-done" size={20} color="#FFF" />
            <Text style={styles.primaryActionText}>Apply All Fixes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction}>
            <Ionicons name="share-outline" size={20} color="#007AFF" />
            <Text style={styles.secondaryActionText}>Export Review</Text>
          </TouchableOpacity>
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
  newReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newReviewText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#666',
  },
  scoreDetails: {
    flex: 1,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  language: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  summary: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  commentsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentMeta: {
    flex: 1,
    marginLeft: 10,
  },
  commentType: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  commentLine: {
    fontSize: 11,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  actionsSection: {
    padding: 16,
    marginTop: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default CodeReviewScreen;
