import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AIHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const handleNavigate = (screenName: string, title: string) => {
    const registeredScreens = ['AISummaryMain', 'AIKeyPointsMain', 'AIActionItemsMain'];
    if (registeredScreens.includes(screenName)) {
      navigation.navigate(screenName);
      return;
    }
    Alert.alert(title, 'This feature is coming soon.', [{ text: 'OK' }]);
  };

  const quickActions = [
    {
      name: 'AISummaryMain',
      title: 'AI Summary',
      icon: 'document-text',
      color: '#AF52DE',
      description: 'Auto-generate summaries',
    },
    {
      name: 'AIActionItemsMain',
      title: 'Action Items',
      icon: 'checkbox',
      color: '#34C759',
      description: 'Extract tasks & todos',
    },
  ];

  const features = [
    {
      name: 'AIKeyPointsMain',
      title: 'Key Points',
      icon: 'key',
      color: '#007AFF',
      description: 'Highlight important points',
    },
    {
      name: 'SpeakerID',
      title: 'Speaker Detection',
      icon: 'people',
      color: '#FF9500',
      description: 'Identify who said what',
    },
    {
      name: 'Sentiment',
      title: 'Sentiment Analysis',
      icon: 'happy',
      color: '#5856D6',
      description: 'Analyze tone & emotion',
    },
    {
      name: 'LiveAssist',
      title: 'Live AI Assistant',
      icon: 'sparkles',
      color: '#00C7BE',
      description: 'Real-time AI help',
    },
    {
      name: 'CustomTraining',
      title: 'Custom Training',
      icon: 'fitness',
      color: '#FF3B30',
      description: 'Train on your data',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Tools</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map(item => (
            <TouchableOpacity
              key={item.name}
              style={[styles.quickActionCard, { borderColor: item.color + '30' }]}
              onPress={() => handleNavigate(item.name, item.title)}
            >
              <View style={[styles.quickIconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.quickActionTitle}>{item.title}</Text>
              <Text style={styles.quickActionDesc}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Features</Text>
        {features.map(screen => (
          <TouchableOpacity
            key={screen.name}
            style={styles.screenCard}
            onPress={() => handleNavigate(screen.name, screen.title)}
          >
            <View style={[styles.iconContainer, { backgroundColor: screen.color + '15' }]}>
              <Ionicons name={screen.icon as any} size={22} color={screen.color} />
            </View>
            <View style={styles.screenTextContainer}>
              <Text style={styles.screenTitle}>{screen.title}</Text>
              <Text style={styles.screenDesc}>{screen.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
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
  placeholder: { width: 32 },
  content: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  quickActionDesc: { fontSize: 12, color: '#8E8E93', textAlign: 'center' },
  screenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  screenTextContainer: { flex: 1 },
  screenTitle: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  screenDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  bottomPadding: { height: 40 },
});

export default AIHubScreen;
