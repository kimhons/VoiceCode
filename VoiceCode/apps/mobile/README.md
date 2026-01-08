# VoiceCode Mobile

Voice-to-text transcription app for iOS and Android built with React Native and Expo.

## Features

- 🎤 High-quality audio recording
- 📝 AI-powered transcription
- 💾 Cloud storage with Supabase
- 🔐 Secure authentication with biometric support
- 💳 Stripe payment integration
- 📱 Native iOS and Android apps
- 🌐 Offline support with sync
- 🎨 Beautiful, intuitive UI

## Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **State Management:** Redux Toolkit
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Payments:** Stripe
- **AI:** AIML API for transcription
- **Navigation:** React Navigation

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   - Supabase URL and Anon Key
   - AIML API Key
   - Stripe Publishable Key

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on iOS:**
   ```bash
   npm run ios
   ```

5. **Run on Android:**
   ```bash
   npm run android
   ```

## Project Structure

```
src/
├── config/          # App configuration and constants
├── contexts/        # React contexts (Auth, etc.)
├── navigation/      # Navigation setup
├── screens/         # Screen components
│   ├── auth/        # Authentication screens
│   ├── home/        # Recording and transcription
│   ├── library/     # Transcription library
│   ├── profile/     # User profile and settings
│   └── legal/       # Privacy policy, terms
├── services/        # API services
│   ├── supabase.service.ts
│   ├── AudioRecordingService.ts (TODO)
│   ├── TranscriptionService.ts (TODO)
│   └── PaymentService.ts (TODO)
├── store/           # Redux store and slices
├── components/      # Reusable components
├── hooks/           # Custom hooks
├── theme/           # Styling and theming
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run build:android` - Build Android app (requires EAS)
- `npm run build:ios` - Build iOS app (requires EAS)

## Environment Variables

See `.env.example` for all required environment variables.

### Required:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `EXPO_PUBLIC_AIML_API_KEY` - Your AIML API key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### Optional:
- Feature flags (biometric auth, push notifications, etc.)
- Sentry DSN for error tracking
- Analytics configuration

## Building for Production

### Using EAS (Expo Application Services)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

5. **Build for Android:**
   ```bash
   eas build --platform android
   ```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### iOS (App Store)
1. Build with EAS: `eas build --platform ios`
2. Submit to App Store: `eas submit --platform ios`

### Android (Google Play)
1. Build with EAS: `eas build --platform android`
2. Submit to Google Play: `eas submit --platform android`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Proprietary - VoiceCode

## Support

For support, email support@voicecode.com

## Status

**Current Version:** 1.0.0 (Beta)  
**Last Updated:** January 4, 2026

### Implementation Status:
- ✅ Project setup and configuration
- ✅ Authentication (login, signup, biometric)
- ✅ Navigation structure
- ✅ State management (Redux)
- ✅ Supabase integration
- ✅ UI screens (all placeholders created)
- 🔄 Audio recording service (TODO)
- 🔄 Transcription service (TODO)
- 🔄 Payment integration (TODO)
- 🔄 App icons and splash screens (TODO)
- 🔄 Testing (TODO)

See `MOBILE_CRITICAL_TASKS.md` for detailed implementation plan.

