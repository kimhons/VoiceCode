# VoiceCode Mobile - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- EAS CLI installed (`npm install -g eas-cli`)
- iOS: Xcode 14+ and Apple Developer account
- Android: Android Studio and Google Play Developer account

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in environment variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
AIML_API_KEY=your_aiml_key
SENTRY_DSN=your_sentry_dsn
```

## Development

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm start
```

### Run on iOS Simulator
```bash
npm run ios
```

### Run on Android Emulator
```bash
npm run android
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run E2E Tests
```bash
npm run test:e2e
```

## Building

### Configure EAS
```bash
eas build:configure
```

### Build for iOS
```bash
eas build --platform ios --profile production
```

### Build for Android
```bash
eas build --platform android --profile production
```

## Deployment

### Submit to App Store
```bash
eas submit --platform ios
```

### Submit to Play Store
```bash
eas submit --platform android
```

## CI/CD

GitHub Actions automatically:
- Run tests on every PR
- Build app on merge to main
- Deploy to beta on tagged releases
- Deploy to production on release

## Monitoring

After deployment, monitor:
- Sentry for errors
- Firebase Crashlytics for crashes
- Firebase Analytics for usage
- Firebase Performance for metrics

## Rollback

If issues occur:
1. Revert to previous version via EAS
2. Push OTA update if minor fix
3. Submit new build if major fix

## Checklist

Before production deployment:
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Beta testing completed
- [ ] App store assets ready
- [ ] Privacy policy published
- [ ] Terms of service published
