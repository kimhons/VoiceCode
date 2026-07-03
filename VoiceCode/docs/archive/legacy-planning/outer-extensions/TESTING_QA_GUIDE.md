# 🧪 VoiceFlow PRO - Testing & QA Guide

**Priority**: CRITICAL before Publishing  
**Estimated Time**: 6-8 hours  
**Deadline**: Before Week 2 (Publishing)

---

## 📋 Testing Checklist

### Pre-Publishing Tests
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] Performance profiling
- [ ] Security audit
- [ ] Dependency vulnerability scan
- [ ] Fresh install testing
- [ ] Compatibility testing
- [ ] Accessibility testing

---

## 1. Cross-Platform Testing (3-4 hours)

### Windows 10/11 Testing

**Test Environment**:
- Windows 10 (minimum supported)
- Windows 11 (latest)
- VSCode 1.85.0+ (minimum required)

**Test Cases**:
```bash
# 1. Install extension
cd extensions/voiceflow-vscode
npm install
npm run compile

# 2. Launch Extension Development Host
# Press F5 in VSCode

# 3. Test voice recognition
# - Activate voice command
# - Test microphone access
# - Verify audio capture works
# - Test Whisper model loading

# 4. Test AI integration
# - Test GPT-4 integration
# - Test Claude integration
# - Verify API key handling

# 5. Test custom commands
# - Create custom command
# - Execute custom command
# - Verify command history
```

**Windows-Specific Issues to Check**:
- [ ] Microphone permissions (Windows Security)
- [ ] File path handling (backslashes vs forward slashes)
- [ ] Audio device selection
- [ ] PowerShell vs CMD compatibility

### macOS Testing (Intel + Apple Silicon)

**Test Environment**:
- macOS 12+ (Monterey or later)
- Intel Mac (x86_64)
- Apple Silicon Mac (arm64)
- VSCode 1.85.0+

**Test Cases**:
```bash
# 1. Install and build
cd extensions/voiceflow-vscode
npm install
npm run compile

# 2. Test on both architectures
# Intel: Rosetta 2 compatibility
# Apple Silicon: Native arm64 performance

# 3. Test microphone access
# System Preferences → Security & Privacy → Microphone
# Verify VSCode has permission

# 4. Test Whisper model loading
# Check ~/Library/Caches for model storage
# Verify IndexedDB caching works
```

**macOS-Specific Issues to Check**:
- [ ] Microphone permissions (System Preferences)
- [ ] Gatekeeper warnings
- [ ] Rosetta 2 compatibility (Intel Macs)
- [ ] Native arm64 performance (Apple Silicon)
- [ ] Keychain access for API keys

### Linux Testing (Ubuntu, Fedora)

**Test Environment**:
- Ubuntu 22.04 LTS
- Fedora 38+
- VSCode 1.85.0+

**Test Cases**:
```bash
# 1. Install dependencies
sudo apt-get install -y libasound2-dev # Ubuntu
sudo dnf install -y alsa-lib-devel # Fedora

# 2. Install and build
cd extensions/voiceflow-vscode
npm install
npm run compile

# 3. Test audio capture
# Verify ALSA/PulseAudio works
arecord -l # List audio devices
pactl list sources # PulseAudio sources

# 4. Test permissions
# Verify user is in 'audio' group
groups
```

**Linux-Specific Issues to Check**:
- [ ] Audio system compatibility (ALSA, PulseAudio, PipeWire)
- [ ] Microphone permissions
- [ ] File permissions
- [ ] Wayland vs X11 compatibility

---

## 2. Performance Profiling (2-3 hours)

### Memory Usage Testing

**Tools**:
- VSCode Developer Tools (Help → Toggle Developer Tools)
- Chrome DevTools Memory Profiler

**Test Procedure**:
```javascript
// 1. Open Developer Tools
// 2. Go to Memory tab
// 3. Take heap snapshot (baseline)
// 4. Use extension for 30 minutes
//    - Execute 50+ voice commands
//    - Load/unload Whisper model 5 times
//    - Create 10+ custom commands
// 5. Take another heap snapshot
// 6. Compare snapshots

// Expected Results:
// - Memory growth < 50MB after 30 minutes
// - No memory leaks in audio buffers
// - Whisper model properly cached
```

**Memory Leak Indicators**:
- Detached DOM nodes
- Growing array sizes
- Unreleased event listeners
- Unclosed file handles

**Acceptance Criteria**:
- [ ] Memory usage stable after 1 hour
- [ ] No memory leaks detected
- [ ] Heap size < 200MB
- [ ] GC cycles normal

### CPU Usage Testing

**Test Procedure**:
```bash
# 1. Monitor CPU usage
# Windows: Task Manager
# macOS: Activity Monitor
# Linux: htop

# 2. Baseline (idle): < 1% CPU
# 3. Voice recognition active: < 20% CPU
# 4. Whisper model loading: < 50% CPU (temporary)
# 5. AI request processing: < 10% CPU

# Expected Results:
# - No sustained high CPU usage
# - CPU returns to baseline after tasks
# - No CPU spikes during idle
```

**Acceptance Criteria**:
- [ ] Idle CPU < 1%
- [ ] Active CPU < 20%
- [ ] No CPU spikes during idle
- [ ] Responsive UI (no freezing)

### Startup Time Testing

**Test Procedure**:
```bash
# 1. Measure extension activation time
# VSCode → Help → Toggle Developer Tools → Console

# Look for:
# "Extension 'voiceflow-pro' activated in X ms"

# Expected Results:
# - Activation time < 500ms
# - No blocking operations during activation
# - Lazy loading of heavy components
```

**Acceptance Criteria**:
- [ ] Activation time < 500ms
- [ ] No UI freezing during activation
- [ ] Whisper model loaded lazily

---

## 3. Security Audit (1-2 hours)

### Dependency Vulnerability Scan

**Run npm audit**:
```bash
cd extensions/voiceflow-vscode
npm audit

# Expected: 0 high/critical vulnerabilities

# If vulnerabilities found:
npm audit fix
npm audit fix --force # If needed

# Verify fixes don't break functionality
npm run compile
npm test
```

**Acceptance Criteria**:
- [ ] 0 critical vulnerabilities
- [ ] 0 high vulnerabilities
- [ ] < 5 moderate vulnerabilities
- [ ] All dependencies up to date

### API Key Security

**Test Cases**:
```javascript
// 1. Verify API keys are stored securely
// - Check VSCode SecretStorage usage
// - Verify no keys in localStorage
// - Verify no keys in plain text files

// 2. Test API key encryption
// - Keys should be encrypted at rest
// - Keys should not appear in logs
// - Keys should not be sent to telemetry

// 3. Test API key validation
// - Invalid keys should show error
// - Expired keys should be detected
// - Rate limiting should be handled
```

**Acceptance Criteria**:
- [ ] API keys stored in SecretStorage
- [ ] No keys in logs or telemetry
- [ ] Keys encrypted at rest
- [ ] Proper error handling for invalid keys

### Code Injection Prevention

**Test Cases**:
```javascript
// 1. Test command injection
// Try malicious voice commands:
// - "delete all files"
// - "run rm -rf /"
// - "execute malicious script"

// Expected: Commands should be sanitized and validated

// 2. Test XSS in webviews
// Try injecting HTML/JS in:
// - Custom command names
// - AI responses
// - User input fields

// Expected: All input should be sanitized
```

**Acceptance Criteria**:
- [ ] No command injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] All user input sanitized
- [ ] Proper CSP (Content Security Policy) in webviews

---

## 4. Fresh Install Testing (1 hour)

### Clean Installation Test

**Test Procedure**:
```bash
# 1. Uninstall extension completely
# VSCode → Extensions → VoiceFlow PRO → Uninstall

# 2. Clear all extension data
# Windows: %APPDATA%\Code\User\globalStorage\voiceflow-pro
# macOS: ~/Library/Application Support/Code/User/globalStorage/voiceflow-pro
# Linux: ~/.config/Code/User/globalStorage/voiceflow-pro

# 3. Restart VSCode

# 4. Install extension from .vsix
code --install-extension voiceflow-pro-1.0.0.vsix

# 5. Test first-time setup
# - Welcome screen should appear
# - Onboarding should guide user
# - Default settings should be applied
# - Microphone permission should be requested

# 6. Test basic functionality
# - Voice command execution
# - AI integration
# - Custom commands
```

**Acceptance Criteria**:
- [ ] Clean install works without errors
- [ ] Welcome screen appears
- [ ] Onboarding is clear and helpful
- [ ] Default settings are sensible
- [ ] All features work out of the box

---

## 5. Compatibility Testing (1 hour)

### VSCode Version Compatibility

**Test Versions**:
- VSCode 1.85.0 (minimum required)
- VSCode 1.90.0 (current stable)
- VSCode Insiders (latest)

**Test Cases**:
```bash
# 1. Install different VSCode versions
# Download from: https://code.visualstudio.com/updates

# 2. Test extension on each version
# - Install extension
# - Test core features
# - Check for deprecation warnings
# - Verify API compatibility

# 3. Test with other extensions
# - GitHub Copilot
# - Cursor
# - Prettier
# - ESLint
```

**Acceptance Criteria**:
- [ ] Works on VSCode 1.85.0+
- [ ] No deprecation warnings
- [ ] Compatible with popular extensions
- [ ] No conflicts with other extensions

---

## 6. Accessibility Testing (1 hour)

### Screen Reader Compatibility

**Test with**:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- Orca (Linux)

**Test Cases**:
```
1. Navigate extension UI with keyboard only
2. Verify all buttons have labels
3. Test focus management
4. Verify ARIA labels
5. Test with high contrast themes
```

**Acceptance Criteria**:
- [ ] All UI elements keyboard accessible
- [ ] Proper ARIA labels
- [ ] Screen reader announces actions
- [ ] High contrast theme support

---

## 7. Automated Testing (Optional)

### Unit Tests

```bash
# Run existing tests
npm test

# Expected: All tests pass
# Coverage: > 80%
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Test scenarios:
# - Voice command → AI → Code generation
# - Custom command execution
# - Settings persistence
```

---

## 📊 Test Report Template

```markdown
# VoiceFlow PRO - Test Report

**Date**: [Date]
**Tester**: [Name]
**Version**: 1.0.0

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

## Platform Testing
- [ ] Windows 10/11: PASS/FAIL
- [ ] macOS (Intel): PASS/FAIL
- [ ] macOS (Apple Silicon): PASS/FAIL
- [ ] Linux (Ubuntu): PASS/FAIL

## Performance
- Memory Usage: X MB
- CPU Usage: X%
- Startup Time: X ms

## Security
- Vulnerabilities: X
- API Key Security: PASS/FAIL

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Sign-off
Ready for publishing: YES/NO
```

---

## 🚀 Final Checklist

Before publishing:
- [ ] All platform tests passed
- [ ] Performance acceptable
- [ ] No critical security issues
- [ ] Fresh install works
- [ ] Accessibility verified
- [ ] Test report completed
- [ ] All critical bugs fixed

**If all checks pass → Proceed to publishing! 🎉**

