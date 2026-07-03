# Code Signing Configuration for VoiceCode Desktop

This document outlines the code signing requirements and setup for VoiceCode Desktop across all platforms.

## Overview

Code signing is essential for:
- User trust and security
- Avoiding OS security warnings
- App store distribution
- Auto-update verification

## Windows Code Signing

### Prerequisites
1. Purchase an EV (Extended Validation) or Standard Code Signing Certificate from:
   - DigiCert
   - Sectigo
   - GlobalSign

### Configuration

1. **Set environment variables:**
```powershell
$env:TAURI_PRIVATE_KEY = "path/to/private-key.pem"
$env:TAURI_KEY_PASSWORD = "your-key-password"
```

2. **Update tauri.conf.json:**
```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "certificateThumbprint": "YOUR_CERTIFICATE_THUMBPRINT",
        "digestAlgorithm": "sha256",
        "timestampUrl": "http://timestamp.digicert.com"
      }
    }
  }
}
```

3. **Sign during build:**
```powershell
npm run tauri build
```

## macOS Code Signing

### Prerequisites
1. Apple Developer Program membership ($99/year)
2. Developer ID Application certificate
3. Developer ID Installer certificate (for PKG distribution)

### Configuration

1. **Set environment variables:**
```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_CERTIFICATE_PASSWORD="your-password"
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

2. **Update tauri.conf.json:**
```json
{
  "tauri": {
    "bundle": {
      "macOS": {
        "signingIdentity": "Developer ID Application: Your Name (TEAMID)",
        "providerShortName": "TEAMID",
        "entitlements": "./entitlements.plist"
      }
    }
  }
}
```

3. **Create entitlements.plist:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.automation.apple-events</key>
    <true/>
</dict>
</plist>
```

4. **Notarization (required for macOS 10.15+):**
```bash
# After building
xcrun notarytool submit target/release/bundle/macos/VoiceCode.app.zip \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# Staple the notarization ticket
xcrun stapler staple "target/release/bundle/macos/VoiceCode.app"
```

## Linux Code Signing

Linux applications don't require traditional code signing, but for security:

1. **GPG Signing for packages:**
```bash
gpg --sign --armor --detach-sig voicecode.AppImage
```

2. **Provide checksums:**
```bash
sha256sum voicecode*.AppImage > checksums.txt
```

## Auto-Updater Keys

Generate updater key pair for Tauri auto-updates:

```bash
# Generate private/public key pair
npx @tauri-apps/cli signer generate -w ~/.tauri/voicecode.key

# The public key goes in tauri.conf.json
# The private key is used during build for signing updates
```

**Build with signing:**
```bash
TAURI_PRIVATE_KEY="~/.tauri/voicecode.key" \
TAURI_KEY_PASSWORD="optional-password" \
npm run tauri build
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Sign

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, windows-latest, ubuntu-22.04]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install Rust
        uses: dtolnay/rust-action@stable
      
      - name: Install dependencies
        run: npm install
      
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
          # Windows
          TAURI_WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
          TAURI_WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
          # macOS
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

## Security Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** or secret managers
3. **Rotate keys** periodically
4. **Use hardware security modules (HSM)** for production certificates
5. **Enable timestamping** to ensure signatures remain valid after certificate expiration

## Verification

### Verify Windows signature:
```powershell
Get-AuthenticodeSignature "VoiceCode.exe"
```

### Verify macOS signature:
```bash
codesign -dv --verbose=4 "VoiceCode.app"
spctl -a -vv "VoiceCode.app"
```

### Verify Linux package:
```bash
gpg --verify voicecode.AppImage.asc voicecode.AppImage
```
