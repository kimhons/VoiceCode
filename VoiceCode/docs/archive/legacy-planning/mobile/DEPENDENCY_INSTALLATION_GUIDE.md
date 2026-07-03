# VoiceCode Pro Mobile - Dependency Installation Guide

**Date:** January 4, 2026  
**Status:** ⚠️ **MANUAL INSTALLATION REQUIRED**

---

## Issue Encountered

During automated dependency installation, encountered an "Invalid Version" error in the monorepo's npm workspace. This appears to be related to a corrupted package in the root node_modules or a workspace configuration issue.

---

## Manual Installation Steps

### Step 1: Clean Installation (Recommended)

```bash
# Navigate to the mobile app directory
cd C:\Githhub\VoiceCode\VoiceCode\apps\mobile

# Remove node_modules and lock file
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps
```

### Step 2: Install Missing Packages Individually

If Step 1 fails, install packages one by one:

```bash
# Navigate to mobile app directory
cd C:\Githhub\VoiceCode\VoiceCode\apps\mobile

# Install Stripe
npm install @stripe/stripe-react-native@^0.35.0 --legacy-peer-deps

# Install Supabase
npm install @supabase/supabase-js@^2.39.0 --legacy-peer-deps

# Install AsyncStorage
npm install @react-native-async-storage/async-storage@^1.21.0 --legacy-peer-deps

# Install Gesture Handler
npm install react-native-gesture-handler@~2.14.0 --legacy-peer-deps

# Install Reanimated
npm install react-native-reanimated@~3.6.2 --legacy-peer-deps
```

### Step 3: Verify Installation

```bash
# Check if all packages are installed
npm list --depth=0

# Run type check to see remaining errors
npm run type-check
```

---

## Alternative: Use Yarn or PNPM

If npm continues to fail, try using an alternative package manager:

### Using Yarn

```bash
cd C:\Githhub\VoiceCode\VoiceCode\apps\mobile

# Install Yarn globally if not already installed
npm install -g yarn

# Install dependencies
yarn install
```

### Using PNPM

```bash
cd C:\Githhub\VoiceCode\VoiceCode\apps\mobile

# Install PNPM globally if not already installed
npm install -g pnpm

# Install dependencies
pnpm install
```

---

## Updated package.json

The package.json has been updated with all required dependencies:

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/stack": "^6.4.1",
    "@reduxjs/toolkit": "^2.0.1",
    "@stripe/stripe-react-native": "^0.35.0",
    "@supabase/supabase-js": "^2.39.0",
    "expo": "~50.0.0",
    "expo-av": "~13.10.4",
    "expo-background-fetch": "~14.0.9",
    "expo-file-system": "~16.0.6",
    "expo-local-authentication": "~17.0.8",
    "expo-media-library": "~18.2.1",
    "expo-notifications": "~0.32.15",
    "expo-secure-store": "~15.0.8",
    "expo-status-bar": "~1.11.1",
    "expo-task-manager": "~14.0.9",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.2",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "react-redux": "^9.0.4"
  }
}
```

---

## Troubleshooting

### Error: "Invalid Version"

**Cause:** Corrupted package in root node_modules or workspace configuration issue

**Solution:**
1. Clean root node_modules: `Remove-Item -Recurse -Force C:\Githhub\VoiceCode\VoiceCode\node_modules`
2. Clean mobile node_modules: `Remove-Item -Recurse -Force C:\Githhub\VoiceCode\VoiceCode\apps\mobile\node_modules`
3. Reinstall from root: `cd C:\Githhub\VoiceCode\VoiceCode && npm install`

### Error: "ERESOLVE unable to resolve dependency tree"

**Cause:** Peer dependency conflicts

**Solution:** Use `--legacy-peer-deps` flag with all npm install commands

### Error: "Cannot find module '@react-navigation/stack'"

**Cause:** Package not installed

**Solution:** `npm install @react-navigation/stack@^6.4.1 --legacy-peer-deps`

---

## Next Steps After Installation

Once dependencies are successfully installed:

1. **Update .env file** with actual API credentials
2. **Run type check**: `npm run type-check`
3. **Start Expo**: `npm run start`
4. **Test on device**: `npm run android` or `npm run ios`

---

## Support

If you continue to experience issues:

1. Check npm version: `npm --version` (should be >=9.0.0)
2. Check node version: `node --version` (should be >=18.0.0)
3. Try clearing all caches: `npm cache clean --force`
4. Try using Yarn or PNPM instead of npm

---

**Last Updated:** January 4, 2026  
**Status:** Awaiting manual installation

