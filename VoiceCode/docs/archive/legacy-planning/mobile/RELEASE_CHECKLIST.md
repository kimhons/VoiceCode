# VoiceCode Mobile Release Checklist

## Pre-Release Verification

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] TypeScript type check passing (`npm run typecheck`)
- [ ] ESLint check passing (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] Code coverage >= 80%

### Security
- [ ] API keys stored in environment variables
- [ ] Secure storage used for sensitive data
- [ ] Authentication tokens properly managed
- [ ] No hardcoded credentials
- [ ] HTTPS enforced for all API calls
- [ ] Input sanitization implemented
- [ ] Rate limiting configured

### Performance
- [ ] Bundle size optimized
- [ ] Images optimized and compressed
- [ ] Lazy loading implemented for heavy components
- [ ] Memory leaks checked and resolved
- [ ] App startup time < 3 seconds

### Functionality
- [ ] All core features working
  - [ ] Recording audio
  - [ ] Live transcription
  - [ ] Playback with sync
  - [ ] AI features (summary, key points)
  - [ ] Export functionality
  - [ ] Sharing
  - [ ] Offline mode
- [ ] Authentication flows tested
  - [ ] Sign up
  - [ ] Sign in
  - [ ] Password reset
  - [ ] Social login
  - [ ] Biometric authentication
- [ ] Subscription/payment flows tested
- [ ] Push notifications working
- [ ] Deep linking working

### UI/UX
- [ ] All screens render correctly
- [ ] Dark/light mode working
- [ ] Accessibility features working
- [ ] Responsive on all device sizes
- [ ] Animations smooth
- [ ] Error states handled gracefully
- [ ] Loading states displayed

### Platform-Specific (iOS)
- [ ] Runs on iOS 14+
- [ ] Works on iPhone and iPad
- [ ] Background audio working
- [ ] App Transport Security configured
- [ ] Privacy descriptions set in Info.plist
- [ ] App icons all sizes provided
- [ ] Launch screen configured

### Platform-Specific (Android)
- [ ] Runs on Android 8+
- [ ] Works on phones and tablets
- [ ] Permissions properly requested
- [ ] Adaptive icons configured
- [ ] ProGuard/R8 rules configured
- [ ] Splash screen configured

---

## App Store Submission

### iOS App Store
- [ ] App Store Connect account ready
- [ ] Certificates and provisioning profiles valid
- [ ] App screenshots prepared (all device sizes)
- [ ] App preview video (optional)
- [ ] App description written
- [ ] Keywords optimized
- [ ] Age rating selected
- [ ] Privacy policy URL valid
- [ ] Support URL valid
- [ ] App review information provided
- [ ] Export compliance answered
- [ ] Content rights confirmed

### Google Play Store
- [ ] Play Console account ready
- [ ] App signing configured
- [ ] Store listing graphics prepared
  - [ ] Feature graphic (1024x500)
  - [ ] Phone screenshots
  - [ ] Tablet screenshots
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App category selected
- [ ] Content rating questionnaire completed
- [ ] Target audience set
- [ ] Privacy policy URL valid
- [ ] Data safety form completed

---

## Deployment Steps

### 1. Version Bump
```bash
# Update version in app.json
npm version patch|minor|major
```

### 2. Build Production
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### 3. Submit to Stores
```bash
# iOS
eas submit --platform ios --profile production

# Android
eas submit --platform android --profile production
```

### 4. Post-Submission
- [ ] Monitor build status in EAS dashboard
- [ ] Monitor review status in App Store Connect
- [ ] Monitor review status in Play Console
- [ ] Prepare release notes for users
- [ ] Prepare marketing materials

---

## Post-Release

### Monitoring
- [ ] Crash reporting enabled (Sentry)
- [ ] Analytics tracking verified
- [ ] Error rates monitored
- [ ] Performance metrics tracked

### Communication
- [ ] Release announcement prepared
- [ ] Social media posts scheduled
- [ ] Email to existing users (if applicable)
- [ ] Update website/landing page

### Rollback Plan
- [ ] Previous version available
- [ ] Rollback procedure documented
- [ ] Team notified of release

---

## Emergency Contacts

- **Lead Developer**: [Name] - [Email]
- **DevOps**: [Name] - [Email]  
- **Product Manager**: [Name] - [Email]

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0   | TBD  | Initial release |

