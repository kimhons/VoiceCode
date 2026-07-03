#!/bin/bash

# VoiceCode Mobile Deployment Script
# Usage: ./scripts/deploy.sh [environment] [platform]
# Environment: development | staging | production
# Platform: ios | android | all

set -e

ENVIRONMENT=${1:-staging}
PLATFORM=${2:-all}

echo "🚀 VoiceCode Mobile Deployment"
echo "=============================="
echo "Environment: $ENVIRONMENT"
echo "Platform: $PLATFORM"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "   Valid options: development, staging, production"
    exit 1
fi

# Validate platform
if [[ ! "$PLATFORM" =~ ^(ios|android|all)$ ]]; then
    echo "❌ Invalid platform: $PLATFORM"
    echo "   Valid options: ios, android, all"
    exit 1
fi

# Set profile based on environment
case $ENVIRONMENT in
    development)
        PROFILE="development"
        ;;
    staging)
        PROFILE="preview"
        ;;
    production)
        PROFILE="production"
        ;;
esac

echo "📦 Installing dependencies..."
npm ci

echo "🔍 Running type check..."
npm run typecheck

echo "🧪 Running tests..."
npm test

echo "📱 Building for $PLATFORM..."

if [[ "$PLATFORM" == "all" || "$PLATFORM" == "ios" ]]; then
    echo ""
    echo "🍎 Building iOS..."
    eas build --platform ios --profile $PROFILE --non-interactive
fi

if [[ "$PLATFORM" == "all" || "$PLATFORM" == "android" ]]; then
    echo ""
    echo "🤖 Building Android..."
    eas build --platform android --profile $PROFILE --non-interactive
fi

# Submit to stores for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    echo "📤 Submitting to app stores..."
    
    if [[ "$PLATFORM" == "all" || "$PLATFORM" == "ios" ]]; then
        echo "🍎 Submitting to App Store..."
        eas submit --platform ios --profile production --non-interactive
    fi
    
    if [[ "$PLATFORM" == "all" || "$PLATFORM" == "android" ]]; then
        echo "🤖 Submitting to Play Store..."
        eas submit --platform android --profile production --non-interactive
    fi
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"

case $ENVIRONMENT in
    development)
        echo "   - Install development build on device/simulator"
        echo "   - Run: npx expo start --dev-client"
        ;;
    staging)
        echo "   - Download preview build from Expo dashboard"
        echo "   - Test all features before production release"
        ;;
    production)
        echo "   - Monitor App Store Connect for iOS review status"
        echo "   - Monitor Play Console for Android review status"
        echo "   - Prepare release notes and announcements"
        ;;
esac
