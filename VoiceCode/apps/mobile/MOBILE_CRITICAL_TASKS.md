# Mobile App Critical Tasks - Implementation Plan

**Date:** January 4, 2026  
**Framework:** Expo (React Native)  
**Target:** Beta Launch in 3-4 weeks

---

## MOB-CRIT-001: Project Initialization & Configuration (2 days)

### Objective
Set up a complete Expo/React Native project with TypeScript, navigation, and build configuration.

### Tasks
- [ ] Initialize Expo project with TypeScript template
- [ ] Configure `app.json` with app metadata
- [ ] Set up TypeScript configuration
- [ ] Configure Metro bundler
- [ ] Set up environment variables (.env)
- [ ] Install core dependencies (navigation, state management, UI)
- [ ] Configure iOS build settings
- [ ] Configure Android build settings
- [ ] Set up development scripts

### Deliverables
- `package.json` with all dependencies
- `app.json` / `app.config.js`
- `tsconfig.json`
- `metro.config.js`
- `.env.example`
- `App.tsx` entry point
- Build configurations for iOS/Android

### Dependencies
```json
{
  "expo": "~50.0.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/stack": "^6.3.0",
  "@supabase/supabase-js": "^2.39.0",
  "expo-av": "~14.0.0",
  "expo-file-system": "~16.0.0",
  "expo-secure-store": "~13.0.0",
  "@stripe/stripe-react-native": "^0.35.0",
  "react-native-reanimated": "~3.6.0",
  "react-native-gesture-handler": "~2.14.0"
}
```

---

## MOB-CRIT-002: Authentication Implementation (2 days)

### Objective
Implement complete authentication flow with Supabase including login, signup, and session management.

### Tasks
- [ ] Create Supabase client configuration
- [ ] Implement AuthContext/AuthProvider
- [ ] Create Login screen
- [ ] Create Signup screen
- [ ] Create Forgot Password screen
- [ ] Implement session persistence (SecureStore)
- [ ] Add biometric authentication (Face ID/Touch ID)
- [ ] Handle OAuth providers (Google, Apple)
- [ ] Implement logout functionality
- [ ] Add loading states and error handling

### Deliverables
- `src/services/supabase.service.ts`
- `src/contexts/AuthContext.tsx`
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/SignupScreen.tsx`
- `src/screens/auth/ForgotPasswordScreen.tsx`
- `src/hooks/useAuth.ts`

### Security
- Store tokens in SecureStore (encrypted)
- Implement token refresh logic
- Add session timeout handling
- Validate all inputs

---

## MOB-CRIT-003: Audio Recording Service (3 days)

### Objective
Implement native audio recording with proper permissions and file management.

### Tasks
- [ ] Request microphone permissions (iOS/Android)
- [ ] Integrate expo-av for audio recording
- [ ] Create AudioRecordingService
- [ ] Implement recording UI with waveform visualization
- [ ] Handle recording states (idle, recording, paused, stopped)
- [ ] Save recordings to local file system
- [ ] Upload recordings to Supabase Storage
- [ ] Implement audio playback
- [ ] Add recording quality settings
- [ ] Handle background recording (if needed)

### Deliverables
- `src/services/AudioRecordingService.ts`
- `src/components/recording/RecordButton.tsx`
- `src/components/recording/WaveformVisualizer.tsx`
- `src/screens/home/RecordingScreen.tsx`
- Permission configurations in `app.json`

### Permissions (app.json)
```json
{
  "ios": {
    "infoPlist": {
      "NSMicrophoneUsageDescription": "VoiceCode needs microphone access to record your voice for transcription."
    }
  },
  "android": {
    "permissions": ["RECORD_AUDIO", "WRITE_EXTERNAL_STORAGE"]
  }
}
```

---

## MOB-CRIT-004: Transcription Integration (3 days)

### Objective
Integrate AIML API for voice-to-text transcription with real-time updates.

### Tasks
- [ ] Create TranscriptionService
- [ ] Implement audio upload to Supabase Storage
- [ ] Integrate AIML API for transcription
- [ ] Display transcription results in real-time
- [ ] Implement transcription history/library
- [ ] Add edit/copy/share functionality
- [ ] Handle transcription errors gracefully
- [ ] Implement offline queue for failed uploads
- [ ] Add transcription quality indicators
- [ ] Optimize for mobile data usage

### Deliverables
- `src/services/TranscriptionService.ts`
- `src/screens/home/TranscriptionScreen.tsx`
- `src/screens/library/LibraryScreen.tsx`
- `src/components/transcription/TranscriptCard.tsx`
- `src/store/slices/transcriptionSlice.ts`

---

## MOB-CRIT-005: Navigation & App Structure (1 day)

### Objective
Set up complete navigation structure with tab navigation and stack navigation.

### Tasks
- [ ] Configure React Navigation
- [ ] Create bottom tab navigator
- [ ] Create stack navigators for each tab
- [ ] Implement authentication flow navigation
- [ ] Add deep linking support
- [ ] Create navigation types
- [ ] Add navigation guards (auth required)
- [ ] Implement back button handling (Android)

### Deliverables
- `src/navigation/AppNavigator.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/MainNavigator.tsx`
- `src/navigation/types.ts`

### Navigation Structure
```
- Auth Stack (if not authenticated)
  - Login
  - Signup
  - Forgot Password

- Main Tabs (if authenticated)
  - Home Tab
    - Recording Screen
    - Transcription Screen
  - Library Tab
    - Library List
    - Transcript Detail
  - Profile Tab
    - Profile Screen
    - Settings Screen
    - Subscription Screen
```

---

## MOB-CRIT-006: Payment Integration (3 days)

### Objective
Integrate Stripe for subscription payments with native payment sheet.

### Tasks
- [ ] Install @stripe/stripe-react-native
- [ ] Configure Stripe publishable key
- [ ] Create PaymentService
- [ ] Implement pricing screen
- [ ] Integrate Stripe Payment Sheet
- [ ] Handle subscription creation
- [ ] Implement billing portal access
- [ ] Add payment success/failure handling
- [ ] Sync subscription status with Supabase
- [ ] Test with Stripe test cards

### Deliverables
- `src/services/PaymentService.ts`
- `src/screens/pricing/PricingScreen.tsx`
- `src/screens/profile/SubscriptionScreen.tsx`
- `src/components/payment/PricingCard.tsx`

### Stripe Setup
```typescript
// Initialize Stripe
import { StripeProvider } from '@stripe/stripe-react-native';

<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
  <App />
</StripeProvider>
```

---

## MOB-CRIT-007: App Icons & Splash Screens (1 day)

### Objective
Generate all required app icons and splash screens for iOS and Android.

### Tasks
- [ ] Design app icon (1024x1024)
- [ ] Generate iOS icon set (all sizes)
- [ ] Generate Android icon set (all densities)
- [ ] Create adaptive icon (Android)
- [ ] Design splash screen
- [ ] Configure splash screen in app.json
- [ ] Test on different devices/screen sizes

### Deliverables
- `assets/icon.png` (1024x1024)
- `assets/adaptive-icon.png` (Android)
- `assets/splash.png`
- iOS icon set in `ios/` directory
- Android icon set in `android/app/src/main/res/`

### Icon Sizes
**iOS:** 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024  
**Android:** mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi

---

## MOB-CRIT-008: Permissions & Privacy (1 day)

### Objective
Implement proper permission handling and privacy compliance.

### Tasks
- [ ] Request microphone permission with rationale
- [ ] Request storage permission (Android)
- [ ] Request notification permission
- [ ] Create privacy policy screen
- [ ] Create terms of service screen
- [ ] Implement permission denied handling
- [ ] Add settings deep link for permissions
- [ ] Test permission flows on iOS/Android

### Deliverables
- `src/services/PermissionsService.ts`
- `src/screens/legal/PrivacyPolicyScreen.tsx`
- `src/screens/legal/TermsOfServiceScreen.tsx`
- Permission configurations in `app.json`

---

## MOB-CRIT-009: Offline Support & Data Sync (2 days)

### Objective
Implement offline-first architecture with background sync.

### Tasks
- [ ] Set up local storage (AsyncStorage/SQLite)
- [ ] Implement offline recording storage
- [ ] Create sync queue for pending uploads
- [ ] Add network status detection
- [ ] Implement background sync
- [ ] Handle conflict resolution
- [ ] Add offline indicators in UI
- [ ] Test offline scenarios

### Deliverables
- `src/services/StorageService.ts`
- `src/services/SyncService.ts`
- `src/hooks/useNetworkStatus.ts`
- `src/store/slices/syncSlice.ts`

---

## MOB-CRIT-010: Testing & QA (2 days)

### Objective
Comprehensive testing on physical devices and simulators.

### Tasks
- [ ] Test on iOS simulator (iPhone 14, 15)
- [ ] Test on Android emulator (Pixel 6, 7)
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test all authentication flows
- [ ] Test recording and transcription
- [ ] Test payment flows
- [ ] Test offline scenarios
- [ ] Test permissions on both platforms
- [ ] Performance profiling
- [ ] Memory leak detection
- [ ] Fix critical bugs

### Deliverables
- Test report document
- Bug fixes
- Performance optimizations
- App store ready builds

---

## Timeline Summary

| Task | Duration | Dependencies |
|------|----------|--------------|
| MOB-CRIT-001 | 2 days | None |
| MOB-CRIT-002 | 2 days | MOB-CRIT-001 |
| MOB-CRIT-003 | 3 days | MOB-CRIT-001 |
| MOB-CRIT-004 | 3 days | MOB-CRIT-003 |
| MOB-CRIT-005 | 1 day | MOB-CRIT-002 |
| MOB-CRIT-006 | 3 days | MOB-CRIT-002, MOB-CRIT-005 |
| MOB-CRIT-007 | 1 day | MOB-CRIT-001 |
| MOB-CRIT-008 | 1 day | MOB-CRIT-003 |
| MOB-CRIT-009 | 2 days | MOB-CRIT-004 |
| MOB-CRIT-010 | 2 days | All above |

**Total:** 20 days (~4 weeks)

---

## Success Criteria

- [ ] App runs on iOS and Android
- [ ] User can sign up/login
- [ ] User can record audio
- [ ] User can view transcriptions
- [ ] User can subscribe to paid plans
- [ ] App works offline
- [ ] All permissions handled properly
- [ ] App icons and splash screens configured
- [ ] No critical bugs
- [ ] Ready for TestFlight/Google Play beta


