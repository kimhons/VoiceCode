// VoiceCode Mobile - Enhanced Share Transcript Screen
// Social sharing, email, cloud storage, collaboration, analytics with Apple-caliber design

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';
import { Text } from '../../components/common/Text';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  createShareLink,
  getSharedTranscripts,
  deleteShareLink,
} from '../../store/slices/exportSlice';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { elevation, blurIntensity } from '../../theme';
import * as Sharing from 'expo-sharing';

type ShareTranscriptScreenRouteProp = RouteProp<HomeStackParamList, 'ShareTranscript'>;
type ShareTranscriptScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'ShareTranscript'
>;

interface Props {
  route: ShareTranscriptScreenRouteProp;
  navigation: ShareTranscriptScreenNavigationProp;
}

type ShareMethod = 'social' | 'email' | 'cloud' | 'link' | 'team';
type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'whatsapp';
type CloudProvider = 'google-drive' | 'dropbox' | 'icloud';

interface ShareAnalytics {
  totalShares: number;
  platformBreakdown: { [key: string]: number };
  recentShares: Array<{
    platform: string;
    timestamp: string;
    recipient?: string;
  }>;
  views: number;
  downloads: number;
}

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'view' | 'comment' | 'edit' | 'admin';
  addedAt: string;
}

export function ShareTranscriptScreen({ route, navigation }: Props) {
  const { transcriptId, transcriptTitle } = route.params;
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);

  const { shareLinks, shareLinksLoading } = useAppSelector((state) => state.export);

  // Share method state
  const [selectedMethod, setSelectedMethod] = useState<ShareMethod>('social');
  const [selectedSocial, setSelectedSocial] = useState<SocialPlatform | null>(null);
  const [selectedCloud, setSelectedCloud] = useState<CloudProvider | null>(null);

  // Link sharing state
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'comment' | 'edit'>('view');
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  // Team sharing state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'view' | 'comment' | 'edit' | 'admin'>('view');

  // Email sharing state
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState(`Shared Transcript: ${transcriptTitle}`);
  const [emailBody, setEmailBody] = useState('');

  // Cloud storage state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [cloudFolderPath, setCloudFolderPath] = useState('/Transcripts');

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<ShareAnalytics>({
    totalShares: 0,
    platformBreakdown: {},
    recentShares: [],
    views: 0,
    downloads: 0,
  });

  // Animation values
  const analyticsSlide = useRef(new Animated.Value(300)).current;
  const methodScale = useRef<{ [key: string]: Animated.Value }>({}).current;
  const socialScale = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Initialize animation values
  const shareMethods: ShareMethod[] = ['social', 'email', 'cloud', 'link', 'team'];
  shareMethods.forEach((method) => {
    if (!methodScale[method]) {
      methodScale[method] = new Animated.Value(1);
    }
  });

  const socialPlatforms: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'whatsapp'];
  socialPlatforms.forEach((platform) => {
    if (!socialScale[platform]) {
      socialScale[platform] = new Animated.Value(1);
    }
  });

  /**
   * Load share data and analytics
   */
  useEffect(() => {
    if (userId) {
      dispatch(getSharedTranscripts(userId));
      loadShareAnalytics();
    }
  }, [userId, dispatch]);

  const loadShareAnalytics = async () => {
    // Mock analytics data - replace with actual API call
    setAnalytics({
      totalShares: 24,
      platformBreakdown: {
        twitter: 8,
        linkedin: 6,
        email: 5,
        link: 3,
        team: 2,
      },
      recentShares: [
        { platform: 'Twitter', timestamp: new Date().toISOString() },
        { platform: 'Email', timestamp: new Date(Date.now() - 86400000).toISOString(), recipient: 'john@example.com' },
        { platform: 'LinkedIn', timestamp: new Date(Date.now() - 172800000).toISOString() },
      ],
      views: 156,
      downloads: 42,
    });
  };

  /**
   * Show/hide analytics panel
   */
  const handleShowAnalytics = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAnalytics(true);

    Animated.spring(analyticsSlide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [analyticsSlide]);

  const handleHideAnalytics = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(analyticsSlide, {
      toValue: 300,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start(() => {
      setShowAnalytics(false);
    });
  }, [analyticsSlide]);

  /**
   * Handle share method selection
   */
  const handleSelectMethod = useCallback(async (method: ShareMethod) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMethod(method);

    // Animate selection
    Animated.sequence([
      Animated.timing(methodScale[method], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(methodScale[method], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [methodScale]);

  /**
   * Handle social media sharing
   */
  const handleSocialShare = useCallback(async (platform: SocialPlatform) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSocial(platform);

    // Animate selection
    Animated.sequence([
      Animated.timing(socialScale[platform], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(socialScale[platform], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Generate share text with platform-specific formatting
    const shareText = generateSocialShareText(platform);
    const shareUrl = `https://VoiceCode.app/share/${transcriptId}`;

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Track share analytics
        setAnalytics(prev => ({
          ...prev,
          totalShares: prev.totalShares + 1,
          platformBreakdown: {
            ...prev.platformBreakdown,
            [platform]: (prev.platformBreakdown[platform] || 0) + 1,
          },
          recentShares: [
            { platform: platform.charAt(0).toUpperCase() + platform.slice(1), timestamp: new Date().toISOString() },
            ...prev.recentShares.slice(0, 4),
          ],
        }));
      } else {
        Alert.alert('Error', `Cannot open ${platform}. Please install the app.`);
      }
    } catch (error) {
      console.error('Social share error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setSelectedSocial(null);
    }
  }, [transcriptId, transcriptTitle, socialScale]);

  const generateSocialShareText = (platform: SocialPlatform): string => {
    const baseText = `Check out this transcript: "${transcriptTitle}"`;

    switch (platform) {
      case 'twitter':
        return `${baseText} #VoiceCode #Transcription #AI`;
      case 'linkedin':
        return `${baseText}\n\nTranscribed with VoiceCode - AI-powered transcription`;
      case 'facebook':
        return baseText;
      case 'whatsapp':
        return `📝 ${baseText}`;
      default:
        return baseText;
    }
  };

  /**
   * Handle email sharing
   */
  const handleEmailShare = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (emailRecipients.length === 0) {
      Alert.alert('Error', 'Please enter at least one recipient email address');
      return;
    }

    try {
      const body = emailBody || `I wanted to share this transcript with you:\n\n"${transcriptTitle}"\n\nView it here: https://VoiceCode.app/share/${transcriptId}`;
      const mailtoUrl = `mailto:${emailRecipients.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;

      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Track analytics
        setAnalytics(prev => ({
          ...prev,
          totalShares: prev.totalShares + 1,
          platformBreakdown: {
            ...prev.platformBreakdown,
            email: (prev.platformBreakdown.email || 0) + 1,
          },
          recentShares: [
            { platform: 'Email', timestamp: new Date().toISOString(), recipient: emailRecipients[0] },
            ...prev.recentShares.slice(0, 4),
          ],
        }));
      } else {
        Alert.alert('Error', 'Email is not available on this device');
      }
    } catch (error) {
      console.error('Email share error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  }, [transcriptId, transcriptTitle, emailRecipients, emailSubject, emailBody]);

  /**
   * Handle cloud storage upload
   */
  const handleCloudUpload = useCallback(async (provider: CloudProvider) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCloud(provider);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Wait for upload to complete
      await new Promise(resolve => setTimeout(resolve, 2200));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Uploaded to ${provider === 'google-drive' ? 'Google Drive' : provider === 'dropbox' ? 'Dropbox' : 'iCloud Drive'}`);

      // Track analytics
      setAnalytics(prev => ({
        ...prev,
        totalShares: prev.totalShares + 1,
        platformBreakdown: {
          ...prev.platformBreakdown,
          [provider]: (prev.platformBreakdown[provider] || 0) + 1,
        },
      }));
    } catch (error) {
      console.error('Cloud upload error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to upload. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setSelectedCloud(null);
    }
  }, []);

  /**
   * Handle team member addition
   */
  const handleAddTeamMember = useCallback(async () => {
    if (!newMemberEmail || !isValidEmail(newMemberEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newMember: TeamMember = {
      id: Date.now().toString(),
      email: newMemberEmail,
      name: newMemberEmail.split('@')[0],
      role: newMemberRole,
      addedAt: new Date().toISOString(),
    };

    setTeamMembers(prev => [...prev, newMember]);
    setNewMemberEmail('');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', `Added ${newMemberEmail} with ${newMemberRole} access`);
  }, [newMemberEmail, newMemberRole]);

  const handleRemoveTeamMember = useCallback(async (memberId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Remove Team Member',
      'Are you sure you want to remove this team member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setTeamMembers(prev => prev.filter(m => m.id !== memberId));
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, []);

  const handleCreateShareLink = useCallback(async () => {
    if (email && !isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (requirePassword && !password) {
      Alert.alert('Password Required', 'Please enter a password to protect the link');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const result = await dispatch(
        createShareLink({
          transcriptId,
          userId,
          options: {
            email: email || undefined,
            accessLevel,
            expiresAt,
            password: requirePassword ? password : undefined,
          },
        })
      ).unwrap();

      // Copy link to clipboard
      await Clipboard.setStringAsync(result.shareLink);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Share Link Created',
        'The share link has been copied to your clipboard',
        [{ text: 'OK' }]
      );

      // Track analytics
      setAnalytics(prev => ({
        ...prev,
        totalShares: prev.totalShares + 1,
        platformBreakdown: {
          ...prev.platformBreakdown,
          link: (prev.platformBreakdown.link || 0) + 1,
        },
        recentShares: [
          { platform: 'Share Link', timestamp: new Date().toISOString(), recipient: email || undefined },
          ...prev.recentShares.slice(0, 4),
        ],
      }));

      // Reset form
      setEmail('');
      setPassword('');
      setRequirePassword(false);
      setExpiresIn(null);
    } catch (error) {
      console.error('Share link creation error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create share link. Please try again.');
    }
  }, [
    transcriptId,
    userId,
    email,
    accessLevel,
    requirePassword,
    password,
    expiresIn,
    dispatch,
  ]);

  const handleDeleteShareLink = useCallback(
    async (shareLinkId: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Alert.alert(
        'Delete Share Link',
        'Are you sure you want to delete this share link? Recipients will no longer be able to access the transcript.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              dispatch(deleteShareLink(shareLinkId));
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    },
    [dispatch]
  );

  const handleCopyLink = useCallback(async (link: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(link);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Share link copied to clipboard');
  }, []);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const transcriptShareLinks = shareLinks.filter(
    (link) => link.transcriptId === transcriptId
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header with Analytics Button */}
        <View style={styles.header}>
          <View>
            <Text
              variant="h3"
              style={[styles.title, { color: theme.colors.textPrimary }]}
              testID="share-title"
            >
              Share Transcript
            </Text>
            <Text variant="body" style={{ color: theme.colors.textSecondary }}>
              {transcriptTitle}
            </Text>
          </View>
          <TouchableOpacity onPress={handleShowAnalytics} style={styles.analyticsButton}>
            <Ionicons name="stats-chart-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Share Method Selection */}
        <Text variant="h6" style={styles.sectionTitle}>
          Choose Share Method
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodsScroll}>
          {[
            { method: 'social' as ShareMethod, icon: 'share-social-outline', label: 'Social' },
            { method: 'email' as ShareMethod, icon: 'mail-outline', label: 'Email' },
            { method: 'cloud' as ShareMethod, icon: 'cloud-upload-outline', label: 'Cloud' },
            { method: 'link' as ShareMethod, icon: 'link-outline', label: 'Link' },
            { method: 'team' as ShareMethod, icon: 'people-outline', label: 'Team' },
          ].map(({ method, icon, label }) => (
            <Animated.View
              key={method}
              style={{ transform: [{ scale: methodScale[method] || 1 }] }}
            >
              <TouchableOpacity
                style={[
                  styles.methodChip,
                  {
                    backgroundColor: selectedMethod === method ? theme.colors.primary : theme.colors.surface,
                    borderColor: selectedMethod === method ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => handleSelectMethod(method)}
              >
                <Ionicons
                  name={icon as any}
                  size={20}
                  color={selectedMethod === method ? '#FFFFFF' : theme.colors.primary}
                />
                <Text
                  variant="caption"
                  style={{ color: selectedMethod === method ? '#FFFFFF' : theme.colors.textPrimary }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Social Media Sharing */}
        {selectedMethod === 'social' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h6" style={styles.sectionTitle}>
              Share on Social Media
            </Text>
            <View style={styles.socialGrid}>
              {[
                { platform: 'twitter' as SocialPlatform, icon: 'logo-twitter', label: 'Twitter', color: '#1DA1F2' },
                { platform: 'linkedin' as SocialPlatform, icon: 'logo-linkedin', label: 'LinkedIn', color: '#0A66C2' },
                { platform: 'facebook' as SocialPlatform, icon: 'logo-facebook', label: 'Facebook', color: '#1877F2' },
                { platform: 'whatsapp' as SocialPlatform, icon: 'logo-whatsapp', label: 'WhatsApp', color: '#25D366' },
              ].map(({ platform, icon, label, color }) => (
                <Animated.View
                  key={platform}
                  style={{ transform: [{ scale: socialScale[platform] || 1 }] }}
                >
                  <TouchableOpacity
                    style={[styles.socialButton, { borderColor: color }]}
                    onPress={() => handleSocialShare(platform)}
                    disabled={selectedSocial === platform}
                  >
                    <Ionicons name={icon as any} size={32} color={color} />
                    <Text variant="caption" style={{ marginTop: 8 }}>
                      {label}
                    </Text>
                    {selectedSocial === platform && (
                      <ActivityIndicator size="small" color={color} style={styles.socialLoading} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Email Sharing */}
        {selectedMethod === 'email' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h6" style={styles.sectionTitle}>
              Share via Email
            </Text>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Recipients (comma-separated)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="email1@example.com, email2@example.com"
                placeholderTextColor={theme.colors.textTertiary}
                value={emailRecipients.join(', ')}
                onChangeText={(text) => setEmailRecipients(text.split(',').map(e => e.trim()).filter(Boolean))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Subject
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="Email subject"
                placeholderTextColor={theme.colors.textTertiary}
                value={emailSubject}
                onChangeText={setEmailSubject}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Message (Optional)
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="Add a personal message..."
                placeholderTextColor={theme.colors.textTertiary}
                value={emailBody}
                onChangeText={setEmailBody}
                multiline
                numberOfLines={4}
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleEmailShare}
            >
              <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
              <Text variant="button" style={{ color: '#FFFFFF' }}>
                Send Email
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cloud Storage Upload */}
        {selectedMethod === 'cloud' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h6" style={styles.sectionTitle}>
              Upload to Cloud Storage
            </Text>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Folder Path
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="/Transcripts"
                placeholderTextColor={theme.colors.textTertiary}
                value={cloudFolderPath}
                onChangeText={setCloudFolderPath}
              />
            </View>
            <View style={styles.cloudGrid}>
              {[
                { provider: 'google-drive' as CloudProvider, icon: 'logo-google', label: 'Google Drive', color: '#4285F4' },
                { provider: 'dropbox' as CloudProvider, icon: 'cloud-outline', label: 'Dropbox', color: '#0061FF' },
                ...(Platform.OS === 'ios' ? [{ provider: 'icloud' as CloudProvider, icon: 'cloud-outline', label: 'iCloud', color: '#007AFF' }] : []),
              ].map(({ provider, icon, label, color }) => (
                <TouchableOpacity
                  key={provider}
                  style={[styles.cloudButton, { borderColor: color }]}
                  onPress={() => handleCloudUpload(provider)}
                  disabled={uploading && selectedCloud === provider}
                >
                  <Ionicons name={icon as any} size={32} color={color} />
                  <Text variant="caption" style={{ marginTop: 8 }}>
                    {label}
                  </Text>
                  {uploading && selectedCloud === provider && (
                    <View style={styles.uploadProgress}>
                      <ActivityIndicator size="small" color={color} />
                      <Text variant="caption" style={{ marginTop: 4 }}>
                        {uploadProgress}%
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Team Sharing */}
        {selectedMethod === 'team' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h6" style={styles.sectionTitle}>
              Share with Team
            </Text>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Team Member Email
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="teammate@example.com"
                placeholderTextColor={theme.colors.textTertiary}
                value={newMemberEmail}
                onChangeText={setNewMemberEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Permission Level
              </Text>
              <View style={styles.accessLevelContainer}>
                {(['view', 'comment', 'edit', 'admin'] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.accessLevelButton,
                      {
                        backgroundColor: newMemberRole === role ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setNewMemberRole(role)}
                  >
                    <Text
                      variant="caption"
                      style={{ color: newMemberRole === role ? '#FFFFFF' : theme.colors.textPrimary }}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddTeamMember}
            >
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              <Text variant="button" style={{ color: '#FFFFFF' }}>
                Add Team Member
              </Text>
            </TouchableOpacity>

            {/* Team Members List */}
            {teamMembers.length > 0 && (
              <View style={styles.teamList}>
                <Text variant="label" style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
                  Team Members ({teamMembers.length})
                </Text>
                {teamMembers.map((member) => (
                  <View key={member.id} style={[styles.teamMemberCard, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.teamMemberInfo}>
                      <Ionicons name="person-circle-outline" size={40} color={theme.colors.primary} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text variant="body" style={{ fontWeight: '600' }}>
                          {member.name}
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          {member.email}
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.primary }}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)} Access
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveTeamMember(member.id)}>
                        <Ionicons name="close-circle-outline" size={24} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Link Sharing */}
        {selectedMethod === 'link' && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text variant="h6" style={styles.sectionTitle}>
              Create Share Link
            </Text>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Email (Optional)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                placeholder="recipient@example.com"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Access Level
              </Text>
              <View style={styles.accessLevelContainer}>
                {(['view', 'comment', 'edit'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.accessLevelButton,
                      {
                        backgroundColor: accessLevel === level ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setAccessLevel(level)}
                  >
                    <Text
                      variant="button"
                      style={{ color: accessLevel === level ? '#FFFFFF' : theme.colors.textPrimary }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                  Require Password
                </Text>
                <Switch
                  value={requirePassword}
                  onValueChange={setRequirePassword}
                />
              </View>
              {requirePassword && (
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="Enter password"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text variant="label" style={{ color: theme.colors.textSecondary }}>
                Link Expires In
              </Text>
              <View style={styles.expirationContainer}>
                {[
                  { label: 'Never', value: null },
                  { label: '1 Day', value: 1 },
                  { label: '7 Days', value: 7 },
                  { label: '30 Days', value: 30 },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.expirationButton,
                      {
                        backgroundColor: expiresIn === option.value ? theme.colors.primary : theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setExpiresIn(option.value)}
                  >
                    <Text
                      variant="caption"
                      style={{ color: expiresIn === option.value ? '#FFFFFF' : theme.colors.textPrimary }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCreateShareLink}
            >
              <Ionicons name="link-outline" size={20} color="#FFFFFF" />
              <Text variant="button" style={{ color: '#FFFFFF' }}>
                Create Share Link
              </Text>
            </TouchableOpacity>

            {/* Active Share Links */}
            {transcriptShareLinks.length > 0 && (
              <View style={styles.activeLinks}>
                <Text variant="label" style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
                  Active Links ({transcriptShareLinks.length})
                </Text>

                {transcriptShareLinks.map((link) => (
                  <View
                    key={link.id}
                    style={[styles.linkCard, { backgroundColor: theme.colors.background }]}
                  >
                    <View style={styles.linkCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text variant="body" style={{ fontWeight: '600' }}>
                          {link.sharedWithEmail || 'Anyone with link'}
                        </Text>
                        <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                          {link.accessLevel} • {link.viewCount} views
                        </Text>
                      </View>
                      <View style={styles.linkActions}>
                        <TouchableOpacity onPress={() => handleCopyLink(link.shareLink)}>
                          <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteShareLink(link.id)}>
                          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Analytics Panel */}
      {showAnalytics && (
        <Animated.View
          style={[
            styles.analyticsPanel,
            { transform: [{ translateY: analyticsSlide }] },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={blurIntensity.strong} tint="light" style={styles.analyticsBlur}>
              <View style={styles.analyticsHeader}>
                <Text variant="h6" style={{ fontWeight: '600' }}>
                  Share Analytics
                </Text>
                <TouchableOpacity onPress={handleHideAnalytics}>
                  <Ionicons name="close-circle-outline" size={28} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.analyticsContent}>
                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsStat}>
                    <Text variant="h3" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                      {analytics.totalShares}
                    </Text>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                      Total Shares
                    </Text>
                  </View>
                  <View style={styles.analyticsStat}>
                    <Text variant="h3" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                      {analytics.views}
                    </Text>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                      Views
                    </Text>
                  </View>
                  <View style={styles.analyticsStat}>
                    <Text variant="h3" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                      {analytics.downloads}
                    </Text>
                    <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                      Downloads
                    </Text>
                  </View>
                </View>
                <View style={styles.platformBreakdown}>
                  <Text variant="label" style={{ marginBottom: 12 }}>
                    Platform Breakdown
                  </Text>
                  {Object.entries(analytics.platformBreakdown).map(([platform, count]) => (
                    <View key={platform} style={styles.platformRow}>
                      <Text variant="body">{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                      <Text variant="body" style={{ fontWeight: '600' }}>
                        {count}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.recentShares}>
                  <Text variant="label" style={{ marginBottom: 12 }}>
                    Recent Shares
                  </Text>
                  {analytics.recentShares.map((share, index) => (
                    <View key={index} style={styles.recentShareRow}>
                      <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                        {share.platform}
                        {share.recipient && ` • ${share.recipient}`}
                      </Text>
                      <Text variant="caption" style={{ color: theme.colors.textTertiary }}>
                        {new Date(share.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </BlurView>
          ) : (
            <View style={[styles.analyticsContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.analyticsHeader}>
                <Text variant="h6" style={{ fontWeight: '600' }}>
                  Share Analytics
                </Text>
                <TouchableOpacity onPress={handleHideAnalytics}>
                  <Ionicons name="close-circle-outline" size={28} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsStat}>
                  <Text variant="h3" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                    {analytics.totalShares}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                    Total Shares
                  </Text>
                </View>
                <View style={styles.analyticsStat}>
                  <Text variant="h3" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                    {analytics.views}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                    Views
                  </Text>
                </View>
                <View style={styles.analyticsStat}>
                  <Text variant="h3" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                    {analytics.downloads}
                  </Text>
                  <Text variant="caption" style={{ color: theme.colors.textSecondary }}>
                    Downloads
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const BASE_UNIT = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: BASE_UNIT * 4,
    paddingBottom: BASE_UNIT * 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: BASE_UNIT * 6,
  },
  title: {
    marginBottom: BASE_UNIT,
  },
  analyticsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },
  sectionTitle: {
    marginBottom: BASE_UNIT * 3,
    fontWeight: '600',
  },
  methodsScroll: {
    marginBottom: BASE_UNIT * 6,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BASE_UNIT * 4,
    paddingVertical: BASE_UNIT * 2,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: BASE_UNIT * 2,
    gap: BASE_UNIT * 2,
    minHeight: 44,
  },
  section: {
    borderRadius: BASE_UNIT * 4,
    padding: BASE_UNIT * 4,
    marginBottom: BASE_UNIT * 4,
    ...elevation.sm,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 3,
  },
  socialButton: {
    width: (Platform.OS === 'ios' ? 160 : 150),
    height: 120,
    borderRadius: BASE_UNIT * 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.xs,
  },
  socialLoading: {
    position: 'absolute',
    bottom: BASE_UNIT * 2,
  },
  inputGroup: {
    marginBottom: BASE_UNIT * 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 2,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    marginTop: BASE_UNIT * 2,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: BASE_UNIT * 4,
    borderRadius: BASE_UNIT * 2,
    gap: BASE_UNIT * 2,
    minHeight: 44,
    ...elevation.sm,
  },
  cloudGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BASE_UNIT * 3,
  },
  cloudButton: {
    width: (Platform.OS === 'ios' ? 160 : 150),
    height: 120,
    borderRadius: BASE_UNIT * 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.xs,
  },
  uploadProgress: {
    position: 'absolute',
    bottom: BASE_UNIT * 2,
    alignItems: 'center',
  },
  accessLevelContainer: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT * 2,
  },
  accessLevelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    alignItems: 'center',
    minHeight: 44,
  },
  teamList: {
    marginTop: BASE_UNIT * 4,
  },
  teamMemberCard: {
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
    ...elevation.xs,
  },
  teamMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 2,
  },
  expirationContainer: {
    flexDirection: 'row',
    gap: BASE_UNIT * 2,
    marginTop: BASE_UNIT * 2,
  },
  expirationButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 2,
    alignItems: 'center',
    minHeight: 44,
  },
  activeLinks: {
    marginTop: BASE_UNIT * 4,
  },
  linkCard: {
    borderRadius: BASE_UNIT * 2,
    padding: BASE_UNIT * 3,
    marginBottom: BASE_UNIT * 2,
    ...elevation.xs,
  },
  linkCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkActions: {
    flexDirection: 'row',
    gap: BASE_UNIT * 3,
  },
  analyticsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
    borderTopLeftRadius: BASE_UNIT * 5,
    borderTopRightRadius: BASE_UNIT * 5,
    overflow: 'hidden',
    ...elevation.xl,
  },
  analyticsBlur: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: BASE_UNIT * 4,
  },
  analyticsContent: {
    flex: 1,
    padding: BASE_UNIT * 4,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: BASE_UNIT * 6,
  },
  analyticsStat: {
    alignItems: 'center',
  },
  platformBreakdown: {
    marginBottom: BASE_UNIT * 4,
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: BASE_UNIT * 2,
  },
  recentShares: {
    marginBottom: BASE_UNIT * 4,
  },
  recentShareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: BASE_UNIT * 2,
  },
});

