# Screenshot Capture Checklist

**Status**: Ready to capture  
**Location**: `VoiceCode/extensions/voiceflow-vscode/screenshots/`  
**Target**: 7 professional screenshots for marketplace listing

---

## 🚀 Quick Start

### Step 1: Install Extension
```powershell
cd VoiceCode/extensions/voiceflow-vscode
.\install-and-test.ps1
```

### Step 2: Open Demo Project
```powershell
code demo-project
```

### Step 3: Follow Screenshot Guide
Open `SCREENSHOT_GUIDE.md` and capture each screenshot

---

## ✅ Screenshot Checklist

### Screenshot 1: Voice Recording Interface
- [ ] Extension installed and activated
- [ ] Press `Ctrl+Shift+V` to start recording
- [ ] Microphone icon visible in status bar
- [ ] Waveform or recording indicator visible
- [ ] Speak: "Create a new React component called UserProfile"
- [ ] Capture screenshot
- [ ] Save as: `screenshots/01-voice-recording-active.png`

**Status**: ⬜ Not Started

---

### Screenshot 2: AI Chat Integration
- [ ] Open Chat panel (`Ctrl+Shift+I`)
- [ ] Type: `@voicecode explain this function`
- [ ] Show AI response with code explanation
- [ ] Ensure @voicecode participant is visible
- [ ] Capture screenshot
- [ ] Save as: `screenshots/02-ai-chat-integration.png`

**Status**: ⬜ Not Started

---

### Screenshot 3: Code Generation Workflow
- [ ] Open empty file: `demo-project/src/components/UserProfile.tsx`
- [ ] Use voice: "Create a React functional component with props for name and email"
- [ ] Show generated code with syntax highlighting
- [ ] Capture screenshot
- [ ] Save as: `screenshots/03-code-generation-workflow.png`

**Status**: ⬜ Not Started

---

### Screenshot 4: Multi-File Editing
- [ ] Open 2-3 files side by side (split editor)
- [ ] Files: `Button.tsx`, `helpers.ts`, `index.ts`
- [ ] Use voice: "Refactor the Button component and update all imports"
- [ ] Show modified indicators (M badge) on multiple tabs
- [ ] Capture screenshot
- [ ] Save as: `screenshots/04-multi-file-editing.png`

**Status**: ⬜ Not Started

---

### Screenshot 5: Extension Settings
- [ ] Open Settings (`Ctrl+,`)
- [ ] Search: "voicecode"
- [ ] Show extension settings section
- [ ] Ensure visible settings:
  - [ ] STT Engine dropdown
  - [ ] AI Model selection
  - [ ] Wake word configuration
  - [ ] Language selection
  - [ ] Enabled toggle
- [ ] Capture screenshot
- [ ] Save as: `screenshots/05-extension-settings.png`

**Status**: ⬜ Not Started

---

### Screenshot 6: Command Palette
- [ ] Open Command Palette (`Ctrl+Shift+P`)
- [ ] Type: "VoiceCode"
- [ ] Show list of commands:
  - [ ] VoiceCode: Start Listening
  - [ ] VoiceCode: Stop Listening
  - [ ] VoiceCode: Toggle Listening
  - [ ] VoiceCode: Show Chatbox
  - [ ] VoiceCode: Open Settings
- [ ] Capture screenshot
- [ ] Save as: `screenshots/06-command-palette.png`

**Status**: ⬜ Not Started

---

### Screenshot 7: Dashboard/Analytics
- [ ] Click VoiceCode icon in Activity Bar
- [ ] Open sidebar dashboard
- [ ] Show:
  - [ ] Command history (use extension first to generate data)
  - [ ] Available commands list
  - [ ] Quick actions
- [ ] Capture screenshot
- [ ] Save as: `screenshots/07-dashboard-analytics.png`

**Status**: ⬜ Not Started

---

## 📋 Quality Checklist

After capturing all screenshots, verify:

### Technical Quality
- [ ] All screenshots are 1920x1080 or higher
- [ ] All files are PNG format
- [ ] All files are under 5MB
- [ ] No compression artifacts visible
- [ ] Text is sharp and readable

### Visual Consistency
- [ ] Same VSCode theme used (Dark+ or GitHub Dark)
- [ ] Same font and size (14-16px)
- [ ] Same window size/layout
- [ ] Consistent UI elements visible

### Content Quality
- [ ] Key features clearly visible
- [ ] No sensitive information (API keys, personal data)
- [ ] Code is clean and readable
- [ ] UI elements are properly aligned
- [ ] No error messages or warnings (unless intentional)

### Feature Coverage
- [ ] Voice recording interface shown
- [ ] AI chat integration demonstrated
- [ ] Code generation visible
- [ ] Multi-file editing capability shown
- [ ] Settings panel comprehensive
- [ ] Command palette complete
- [ ] Dashboard/analytics informative

---

## 🎨 Optional: Post-Processing

If needed, enhance screenshots with:

### Annotations
- [ ] Add arrows to highlight key features
- [ ] Add text labels for clarity
- [ ] Add numbered callouts for step-by-step guides

### Tools for Annotations
- **Snagit** (Windows/Mac) - Professional tool
- **Greenshot** (Windows) - Free alternative
- **Skitch** (Mac) - Simple and quick
- **Figma** (Web) - For advanced editing

### Compression (if needed)
- [ ] Use TinyPNG or similar to reduce file size
- [ ] Ensure quality remains high after compression
- [ ] Keep files under 5MB for marketplace

---

## 📊 Progress Tracking

| Screenshot | Status | Filename | Size | Notes |
|------------|--------|----------|------|-------|
| 1. Voice Recording | ⬜ | 01-voice-recording-active.png | - | - |
| 2. AI Chat | ⬜ | 02-ai-chat-integration.png | - | - |
| 3. Code Generation | ⬜ | 03-code-generation-workflow.png | - | - |
| 4. Multi-File Editing | ⬜ | 04-multi-file-editing.png | - | - |
| 5. Settings Panel | ⬜ | 05-extension-settings.png | - | - |
| 6. Command Palette | ⬜ | 06-command-palette.png | - | - |
| 7. Dashboard | ⬜ | 07-dashboard-analytics.png | - | - |

**Overall Progress**: 0/7 (0%)

---

## 🚨 Troubleshooting

### Extension Not Loading
- Check Output panel → VoiceCode for errors
- Reload VSCode window (`Ctrl+R`)
- Reinstall extension: `.\install-and-test.ps1`

### No Data in Dashboard
- Use the extension first to generate command history
- Try a few voice commands
- Refresh the sidebar view

### Chat Participant Not Showing
- Ensure VSCode version is 1.85 or higher
- Check if Chat feature is enabled
- Restart VSCode

### Voice Recording Not Working
- Check microphone permissions
- Verify microphone is selected in system settings
- Test with Web Speech API first (easier to set up)

---

## ✅ Completion

When all screenshots are captured:
- [ ] All 7 screenshots saved to `screenshots/` directory
- [ ] Quality checklist completed
- [ ] Files reviewed for sensitive information
- [ ] Ready for marketplace upload

**Next Step**: Proceed to demo video creation (SCREENSHOT_GUIDE.md → Video section)

