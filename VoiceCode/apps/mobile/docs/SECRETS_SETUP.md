# GitHub Secrets Setup Guide

This document describes all required secrets for the VoiceCode Mobile CI/CD pipeline.

## Required GitHub Repository Secrets

### Expo Secrets
| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `EXPO_TOKEN` | Expo access token for EAS builds | 1. Go to https://expo.dev/accounts/[your-account]/settings/access-tokens<br>2. Create a new token<br>3. Copy and save as secret |

### Apple App Store Secrets
| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `APPLE_ID` | Your Apple ID email | Your Apple Developer account email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for CI | 1. Go to https://appleid.apple.com<br>2. Security > App-Specific Passwords<br>3. Generate new password |
| `ASC_APP_ID` | App Store Connect App ID | Found in App Store Connect > App Information |
| `APPLE_TEAM_ID` | Apple Developer Team ID | Found in Apple Developer Portal > Membership |

### Google Play Store Secrets
| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON for Play Console | 1. Go to Google Cloud Console<br>2. Create service account<br>3. Grant "Service Account User" role<br>4. Create JSON key<br>5. Link in Play Console > API access |

## Environment Variables (.env)

Create a `.env` file in the mobile app root with these variables:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AIML API
EXPO_PUBLIC_AIML_API_KEY=your-aiml-api-key
EXPO_PUBLIC_AIML_BASE_URL=https://api.aimlapi.com/v1
EXPO_PUBLIC_AIML_WS_URL=wss://api.aimlapi.com/v1/realtime

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
EXPO_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
EXPO_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_xxx
EXPO_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_xxx

# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# App Environment
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_TIMEOUT=30000

# Feature Flags
EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

## Setting Secrets in GitHub

1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value

## Verifying Secrets

Run this command to verify secrets are properly configured:

```bash
gh secret list
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate secrets** regularly (every 90 days recommended)
3. **Use environment-specific secrets** for dev/staging/production
4. **Limit secret access** to only necessary team members
5. **Audit secret usage** through GitHub Actions logs

## Troubleshooting

### "Context access might be invalid" warnings
These warnings appear in the workflow file because GitHub Actions validates secret references. The secrets will work correctly once configured in GitHub.

### EAS Build fails with authentication error
1. Verify `EXPO_TOKEN` is correctly set
2. Ensure token has not expired
3. Check token has correct permissions

### App Store submission fails
1. Verify Apple credentials are correct
2. Check app-specific password is valid
3. Ensure certificates are not expired

### Play Store submission fails
1. Verify service account has correct permissions
2. Check JSON key is properly formatted
3. Ensure API access is enabled in Play Console
