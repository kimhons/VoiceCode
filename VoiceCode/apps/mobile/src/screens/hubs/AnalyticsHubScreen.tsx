import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AnalyticsHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const handleNavigate = (screenName: string, title: string) => {
    const registeredScreens = ['ProductivityDashboard', 'TeamPerformance'];
    if (registeredScreens.includes(screenName)) {
      navigation.navigate(screenName);
      return;
    }
    Alert.alert(title, 'This feature is coming soon.', [{ text: 'OK' }]);
  };

  const features = [
    {
      name: 'ProductivityDashboard',
      title: 'Productivity',
      icon: 'speedometer',
      color: '#007AFF',
      description: 'Your productivity stats',
    },
    {
      name: 'TeamPerformance',
      title: 'Team Stats',
      icon: 'people',
      color: '#34C759',
      description: 'Team performance',
    },
    {
      name: 'Usage',
      title: 'Usage',
      icon: 'bar-chart',
      color: '#FF9500',
      description: 'App usage analytics',
    },
    {
      name: 'Reports',
      title: 'Reports',
      icon: 'document-text',
      color: '#5856D6',
      description: 'Generate reports',
    },
    {
      name: 'Insights',
      title: 'Insights',
      icon: 'bulb',
      color: '#AF52DE',
      description: 'Meeting insights',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Reports & Insights</Text>
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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

export default AnalyticsHubScreen;
