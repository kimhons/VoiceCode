# VoiceCode Mobile - Architecture Documentation

## Overview

VoiceCode Mobile is a React Native application built with Expo, featuring voice-to-text transcription, AI-powered features, and comprehensive collaboration tools.

## Technology Stack

### Core
- **React Native**: 0.76.5
- **Expo**: ~52.0.0
- **TypeScript**: 5.7.2

### State Management
- **Redux Toolkit**: 2.5.0
- **React Redux**: 9.2.0
- **Redux Persist**: 6.0.0

### Navigation
- **React Navigation**: 7.x
- Bottom Tabs
- Stack Navigator
- Native Stack

### Backend
- **Supabase**: 2.47.10 (Auth, Database, Storage, Real-time)
- **WebSocket**: Real-time streaming

### AI/ML
- **AIML API**: Voice transcription
- **OpenAI**: GPT models
- **Anthropic**: Claude models

### Audio
- **Expo AV**: Recording and playback
- **Expo File System**: File management

### Security
- **Expo Secure Store**: Encrypted storage
- **Expo Local Authentication**: Biometric auth

### Monitoring
- **Sentry**: Error tracking
- **Firebase Crashlytics**: Crash reporting
- **Firebase Analytics**: User analytics
- **Firebase Performance**: Performance monitoring

## Architecture Patterns

### 1. Service Layer
All business logic is encapsulated in services:
- Singleton pattern for service instances
- Async/await for all operations
- Comprehensive error handling
- Type-safe interfaces

### 2. State Management
Redux Toolkit with slices:
- Feature-based slice organization
- Async thunks for API calls
- Normalized state shape
- Persistent storage for offline support

### 3. Component Structure
- Functional components with hooks
- Custom hooks for reusable logic
- Presentational vs Container components
- Strict TypeScript typing

### 4. Navigation
Type-safe navigation:
- Centralized navigation types
- Screen-specific param types
- Deep linking support

## Directory Structure

```
src/
├── __tests__/          # Test files
├── components/         # Reusable components
├── config/            # Configuration files
├── contexts/          # React contexts
├── hooks/             # Custom hooks
├── navigation/        # Navigation setup
├── screens/           # Screen components
├── services/          # Business logic
├── store/             # Redux store
├── theme/             # Styling
├── types/             # TypeScript types
└── utils/             # Utility functions
```

## Data Flow

1. User interaction → Component
2. Component → Dispatch action
3. Action → Async thunk
4. Thunk → Service
5. Service → API/Database
6. Response → Reducer
7. Reducer → Update state
8. State → Component re-render

## Security

- API keys stored in Expo Secure Store
- End-to-end encryption for sensitive data
- Rate limiting on client side
- Input validation
- Secure authentication flow

## Performance

- Code splitting by feature
- Lazy loading of heavy components
- Image optimization
- Request caching
- Offline queue for failed requests
- Memory management

## Testing Strategy

- Unit tests for services
- Component tests with React Testing Library
- Integration tests for flows
- E2E tests with Detox
- 80%+ code coverage target

## Deployment

- Expo Application Services (EAS)
- Automated builds via GitHub Actions
- Beta distribution via TestFlight/Play Console
- Over-the-air updates via Expo Updates
