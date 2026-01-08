// VoiceFlow Pro Mobile - Navigation Types

import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Permissions: undefined;
  Auth: undefined;
  Main: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Home Stack
export type HomeStackParamList = {
  HomeScreen: undefined;
  RecordingScreen: { recordingId?: string };
  ReviewScreen: { recordingId: string };
  AudioTest: undefined;
};

export type HomeStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList>,
  MainTabNavigationProp
>;

// Library Stack
export type LibraryStackParamList = {
  LibraryScreen: undefined;
  TranscriptionDetail: { transcriptionId: string };
};

export type LibraryStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<LibraryStackParamList>,
  MainTabNavigationProp
>;

// Settings Stack
export type SettingsStackParamList = {
  SettingsScreen: undefined;
  RecordingSettings: undefined;
  TranscriptionSettings: undefined;
  AISettings: undefined;
  AppearanceSettings: undefined;
  PrivacySettings: undefined;
  SyncSettings: undefined;
};

export type SettingsStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<SettingsStackParamList>,
  MainTabNavigationProp
>;

// Profile Stack
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  SubscriptionScreen: undefined;
  AccountScreen: undefined;
};

export type ProfileStackNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ProfileStackParamList>,
  MainTabNavigationProp
>;

// Screen Props Helper Types
export type ScreenProps<
  ParamList extends Record<string, any>,
  RouteName extends keyof ParamList
> = {
  navigation: StackNavigationProp<ParamList, RouteName>;
  route: RouteProp<ParamList, RouteName>;
};

