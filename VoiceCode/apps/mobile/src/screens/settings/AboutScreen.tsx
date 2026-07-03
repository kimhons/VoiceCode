import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Share,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const WEBSITE_URL = 'https://voicecode.app';
const PRIVACY_URL = 'https://voicecode.app/privacy';
const TERMS_URL = 'https://voicecode.app/terms';
const SUPPORT_URL = 'https://voicecode.app/support';
const APP_STORE_URL = 'https://apps.apple.com/app/voicecode';

interface AboutScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    String(Constants.expoConfig?.android?.versionCode ?? '1');
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  const checkForUpdates = () => {
    setUpdateStatus('Checking for updates…');
  };

  const rateApp = () => openUrl(APP_STORE_URL);

  const shareApp = () => {
    Share.share({
      message: `Check out VoiceCode — voice-directed coding. ${WEBSITE_URL}`,
    }).catch(() => undefined);
  };

  const Row = ({
    label,
    icon,
    onPress,
    testID,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    testID?: string;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={20} color="#667eea" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#bbb" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} testID="about-screen">
      <View style={styles.header}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          testID="app-logo"
        />
        <Text style={styles.appName}>VoiceCode</Text>
        <Text style={styles.version}>Version {version}</Text>
        <Text style={styles.build}>Build {buildNumber}</Text>
      </View>

      <View style={styles.section}>
        <Row label="Website" icon="globe-outline" onPress={() => openUrl(WEBSITE_URL)} />
        <Row label="Support" icon="help-buoy-outline" onPress={() => openUrl(SUPPORT_URL)} />
        <Row label="Privacy Policy" icon="lock-closed-outline" onPress={() => openUrl(PRIVACY_URL)} />
        <Row label="Terms of Service" icon="document-text-outline" onPress={() => openUrl(TERMS_URL)} />
        <Row label="Licenses" icon="ribbon-outline" onPress={() => navigation.navigate('Licenses')} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={checkForUpdates} testID="check-updates">
          <Ionicons name="refresh-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Check for Updates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={rateApp} testID="rate-app">
          <Ionicons name="star-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Rate the App</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={shareApp} testID="share-app">
          <Ionicons name="share-social-outline" size={20} color="#667eea" style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Share the App</Text>
        </TouchableOpacity>
      </View>

      {updateStatus ? <Text style={styles.updateStatus}>{updateStatus}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fa' },
  header: { alignItems: 'center', paddingVertical: 32 },
  logo: { width: 88, height: 88, borderRadius: 20, marginBottom: 12 },
  appName: { fontSize: 24, fontWeight: '700', color: '#1a1a2e' },
  version: { fontSize: 14, color: '#555', marginTop: 4 },
  build: { fontSize: 12, color: '#888', marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: '#1a1a2e' },
  updateStatus: { textAlign: 'center', color: '#667eea', paddingVertical: 16 },
});

export default AboutScreen;
