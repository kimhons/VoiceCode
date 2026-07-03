// VoiceCode Mobile - Account Settings Screen

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { Text, Button, Input, Card } from '../../components/common';

export const AccountScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAppSelector(state => state.auth);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    // TODO: Implement save functionality
    Alert.alert('Success', 'Account settings saved successfully!');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Text variant="h3" color={theme.colors.textPrimary} style={styles.sectionTitle}>
            Personal Information
          </Text>

          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            style={styles.input}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Button
            onPress={handleSave}
            variant="primary"
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </Card>

        <Card style={styles.card}>
          <Text variant="h3" color={theme.colors.textPrimary} style={styles.sectionTitle}>
            Password
          </Text>

          <Button
            onPress={() => Alert.alert('Coming Soon', 'Password change coming soon!')}
            variant="outline"
          >
            Change Password
          </Button>
        </Card>

        <Card style={styles.card}>
          <Text variant="h3" color={theme.colors.textPrimary} style={styles.sectionTitle}>
            Danger Zone
          </Text>

          <Button
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => Alert.alert('Coming Soon', 'Account deletion coming soon!'),
                  },
                ]
              );
            }}
            variant="outline"
            style={styles.deleteButton}
          >
            Delete Account
          </Button>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
});

