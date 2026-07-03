# 🚀 VoiceFlow PRO - Publishing Guide

**Priority**: CRITICAL for Launch  
**Estimated Time**: 4-6 hours  
**Prerequisites**: All assets created, testing complete

---

## 📋 Pre-Publishing Checklist

Before you start:
- [ ] Extension icon created (256x256 PNG)
- [ ] 5+ screenshots taken
- [ ] Demo video/GIF created
- [ ] README.md complete
- [ ] CHANGELOG.md updated
- [ ] All tests passed
- [ ] No critical bugs
- [ ] package.json metadata complete

---

## Step 1: Create Publisher Account (30 minutes)

### 1.1 Sign up for Azure DevOps

**URL**: https://dev.azure.com

**Steps**:
1. Click "Start free"
2. Sign in with Microsoft account (or create one)
3. Create organization:
   - Name: `voiceflow-pro` or your preferred name
   - Region: Select closest to you
4. Create project (optional, not required for publishing)

### 1.2 Create Personal Access Token (PAT)

**Steps**:
1. Go to https://dev.azure.com/[your-org]/_usersSettings/tokens
2. Click "New Token"
3. Configure token:
   - **Name**: `vsce-publish-token`
   - **Organization**: All accessible organizations
   - **Expiration**: 90 days (or custom)
   - **Scopes**: 
     - ✅ Marketplace → **Manage** (CRITICAL)
     - ✅ Marketplace → **Acquire**
     - ✅ Marketplace → **Publish**
4. Click "Create"
5. **IMPORTANT**: Copy token immediately (you won't see it again)
6. Save token securely:
   ```bash
   # Save to environment variable
   # Windows (PowerShell)
   $env:VSCE_PAT = "your-token-here"
   
   # macOS/Linux
   export VSCE_PAT="your-token-here"
   
   # Or save to .env file (DO NOT COMMIT)
   echo "VSCE_PAT=your-token-here" > .env
   ```

### 1.3 Create Publisher on Marketplace

**URL**: https://marketplace.visualstudio.com/manage

**Steps**:
1. Sign in with same Microsoft account
2. Click "Create publisher"
3. Fill in details:
   - **ID**: `voiceflow-pro` (must match package.json)
   - **Display Name**: `VoiceFlow PRO`
   - **Description**: `Voice-first coding assistant for VSCode`
   - **Logo**: Upload your icon (256x256)
   - **Website**: `https://github.com/kimhons/VoiceFlow-PRO`
   - **Email**: Your email
4. Click "Create"

**IMPORTANT**: Publisher ID must match `publisher` field in package.json!

---

## Step 2: Install Publishing Tools (5 minutes)

### 2.1 Install vsce (VSCode Extension Manager)

```bash
# Install globally
npm install -g @vscode/vsce

# Verify installation
vsce --version
# Should show: 2.x.x or higher
```

### 2.2 Install ovsx (Open VSX Registry)

```bash
# Install globally (for publishing to Open VSX)
npm install -g ovsx

# Verify installation
ovsx --version
```

---

## Step 3: Prepare Extension Package (30 minutes)

### 3.1 Update package.json

Verify all fields are correct:
```json
{
  "name": "voiceflow-pro",
  "displayName": "VoiceFlow PRO - Voice-First Coding Assistant",
  "version": "1.0.0",
  "publisher": "voiceflow-pro",
  "description": "Revolutionary voice-first coding assistant...",
  "icon": "resources/icon.png",
  "galleryBanner": {
    "color": "#007AFF",
    "theme": "dark"
  },
  "categories": ["AI", "Programming Languages", "Other"],
  "keywords": ["voice", "ai", "assistant", "accessibility"],
  "repository": {
    "type": "git",
    "url": "https://github.com/kimhons/VoiceFlow-PRO.git"
  },
  "bugs": {
    "url": "https://github.com/kimhons/VoiceFlow-PRO/issues"
  },
  "homepage": "https://github.com/kimhons/VoiceFlow-PRO#readme",
  "engines": {
    "vscode": "^1.85.0"
  }
}
```

### 3.2 Update README.md

Add screenshots:
```markdown
## Screenshots

![Voice Command](screenshots/screenshot-01-voice-command.png)
*Execute commands with your voice*

![AI Integration](screenshots/screenshot-02-ai-integration.png)
*Powered by GPT-4 and Claude*

![Custom Commands](screenshots/screenshot-03-custom-commands.png)
*Create your own voice commands*
```

### 3.3 Verify .vscodeignore

Ensure unnecessary files are excluded:
```
src/**
.vscode/**
.vscode-test/**
test/**
*.test.ts
*.spec.ts
.gitignore
tsconfig.json
node_modules/**
```

### 3.4 Build Extension

```bash
cd extensions/voiceflow-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests (optional but recommended)
npm test

# Verify no errors
```

---

## Step 4: Package Extension (15 minutes)

### 4.1 Create .vsix Package

```bash
# Package extension
vsce package

# Output: voiceflow-pro-1.0.0.vsix

# Verify package contents
vsce ls

# Should show:
# - README.md
# - CHANGELOG.md
# - package.json
# - resources/icon.png
# - screenshots/*.png
# - dist/ (compiled code)
# - NOT src/ (source code)
```

### 4.2 Test Package Locally

```bash
# Install .vsix locally
code --install-extension voiceflow-pro-1.0.0.vsix

# Test in VSCode:
# 1. Restart VSCode
# 2. Verify extension appears in Extensions panel
# 3. Test basic functionality
# 4. Check for errors in Developer Tools

# If issues found:
# 1. Fix issues
# 2. Increment version in package.json
# 3. Rebuild and repackage
```

---

## Step 5: Publish to VSCode Marketplace (15 minutes)

### 5.1 Publish Extension

```bash
# Login with PAT
vsce login voiceflow-pro
# Enter your Personal Access Token when prompted

# Publish extension
vsce publish

# Or publish with specific version
vsce publish 1.0.0

# Or publish and increment version
vsce publish minor # 1.0.0 → 1.1.0
vsce publish patch # 1.0.0 → 1.0.1
vsce publish major # 1.0.0 → 2.0.0
```

**Expected Output**:
```
Publishing voiceflow-pro@1.0.0...
Successfully published voiceflow-pro@1.0.0!
Your extension will live at https://marketplace.visualstudio.com/items?itemName=voiceflow-pro.voiceflow-pro
```

### 5.2 Verify Publication

1. Go to https://marketplace.visualstudio.com/items?itemName=voiceflow-pro.voiceflow-pro
2. Verify:
   - [ ] Icon displays correctly
   - [ ] Screenshots appear
   - [ ] README renders properly
   - [ ] Install button works
   - [ ] Version is correct

**Note**: It may take 5-10 minutes for extension to appear in search results.

---

## Step 6: Publish to Open VSX (15 minutes)

### 6.1 Create Open VSX Account

**URL**: https://open-vsx.org

**Steps**:
1. Sign in with GitHub
2. Go to https://open-vsx.org/user-settings/tokens
3. Create new access token
4. Copy token

### 6.2 Publish to Open VSX

```bash
# Login
ovsx login
# Enter your Open VSX token

# Publish same .vsix file
ovsx publish voiceflow-pro-1.0.0.vsix

# Or publish directly
ovsx publish
```

**Why Open VSX?**
- Used by VSCodium, Gitpod, Eclipse Theia
- Reaches additional users
- Free and open source

---

## Step 7: Post-Publishing Tasks (1-2 hours)

### 7.1 Update Repository

```bash
# Tag release
git tag v1.0.0
git push origin v1.0.0

# Create GitHub Release
# Go to https://github.com/kimhons/VoiceFlow-PRO/releases/new
# - Tag: v1.0.0
# - Title: VoiceFlow PRO v1.0.0
# - Description: Copy from CHANGELOG.md
# - Attach: voiceflow-pro-1.0.0.vsix
```

### 7.2 Update Documentation

```markdown
# Add to README.md

## Installation

Install from VSCode Marketplace:
1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "VoiceFlow PRO"
4. Click Install

Or install via command line:
```bash
code --install-extension voiceflow-pro.voiceflow-pro
```

### 7.3 Monitor Metrics

**VSCode Marketplace Dashboard**:
- URL: https://marketplace.visualstudio.com/manage/publishers/voiceflow-pro
- Metrics:
  - Installs
  - Ratings
  - Reviews
  - Uninstalls

**Check Daily**:
- Install count
- Rating (target: 4.0+)
- Reviews (respond to all)
- Issues (fix critical bugs ASAP)

---

## Step 8: Launch Marketing (2-4 hours)

### 8.1 Product Hunt

**URL**: https://www.producthunt.com/posts/create

**Steps**:
1. Create account
2. Submit product:
   - **Name**: VoiceFlow PRO
   - **Tagline**: Voice-first coding assistant for VSCode
   - **Description**: Full description with features
   - **Link**: Marketplace URL
   - **Images**: Screenshots + demo GIF
   - **Topics**: Developer Tools, Productivity, AI
3. **Launch time**: 12:01 AM PST (optimal)
4. **Engage**: Respond to all comments throughout the day

### 8.2 Hacker News

**URL**: https://news.ycombinator.com/submit

**Title**: "Show HN: VoiceFlow PRO – Voice-first coding assistant for VSCode"

**Text**:
```
I built VoiceFlow PRO, a voice-first coding assistant for VSCode.

Key features:
- Voice commands for coding (no typing needed)
- AI integration (GPT-4, Claude, Gemini)
- Custom voice commands
- Perfect for accessibility

It's free and open source. Would love your feedback!

Marketplace: [link]
GitHub: [link]
Demo: [link]
```

### 8.3 Social Media

**Twitter/X**:
```
🚀 Launching VoiceFlow PRO - the first voice-first coding assistant for VSCode!

✨ Code with your voice
🤖 AI-powered (GPT-4, Claude)
♿ Perfect for accessibility
🆓 Free and open source

Install now: [link]

#VSCode #AI #Accessibility #DevTools
```

**LinkedIn**:
```
Excited to announce the launch of VoiceFlow PRO! 🎉

After months of development, I'm releasing the first voice-first coding assistant for VSCode.

Why voice-first?
- 40% productivity boost
- Perfect for accessibility
- Hands-free coding
- Natural AI interaction

Try it free: [link]

#SoftwareDevelopment #AI #Accessibility
```

**Reddit**:
- r/vscode
- r/programming
- r/webdev
- r/accessibility

**Dev.to Article**:
Write detailed article about:
- Why you built it
- Technical challenges
- How it works
- Future plans

---

## 🎉 Success Metrics

### Week 1
- [ ] 100+ installs
- [ ] 4.0+ rating
- [ ] 10+ reviews
- [ ] <5% uninstall rate

### Month 1
- [ ] 1,000+ installs
- [ ] 4.5+ rating
- [ ] 50+ reviews
- [ ] Featured in "Trending" section

---

## 🚨 Troubleshooting

### "Publisher not found"
- Verify publisher ID matches package.json
- Create publisher at marketplace.visualstudio.com/manage

### "Invalid PAT"
- Ensure PAT has "Marketplace (Manage)" scope
- Token may have expired (create new one)

### "Package too large"
- Check .vscodeignore excludes node_modules
- Remove unnecessary files
- Compress images

### "Extension not appearing in search"
- Wait 10-15 minutes after publishing
- Clear browser cache
- Check marketplace dashboard for errors

---

## 📞 Support

**VSCode Extension Publishing Docs**:
https://code.visualstudio.com/api/working-with-extensions/publishing-extension

**Marketplace Support**:
vsmarketplace@microsoft.com

**Community**:
- VSCode Extension Discord
- Stack Overflow (tag: vscode-extensions)

---

**Congratulations on publishing! 🎉🚀**

