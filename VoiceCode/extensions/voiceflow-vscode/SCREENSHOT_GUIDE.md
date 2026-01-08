# VoiceCode VSCode Extension - Screenshot Capture Guide

**Purpose**: Professional screenshots for VSCode Marketplace listing  
**Target**: 5-7 high-quality images showcasing key features  
**Resolution**: Minimum 1280x720, recommended 1920x1080  
**Format**: PNG (lossless quality)

---

## 📋 Pre-Capture Checklist

### 1. Install Extension Locally
```bash
cd VoiceCode/extensions/voiceflow-vscode
code --install-extension voicecode-vscode-1.0.0.vsix
```

### 2. VSCode Theme Setup
- **Recommended Theme**: Dark+ (default dark) or GitHub Dark
- **Font**: Fira Code or JetBrains Mono (with ligatures)
- **Font Size**: 14-16px for readability
- **Zoom Level**: 100% (Ctrl+0 to reset)

### 3. Window Setup
- **Resolution**: 1920x1080 or higher
- **VSCode Window**: Maximized or large enough to show all UI elements
- **Hide unnecessary UI**: Close unrelated extensions, notifications
- **Clean workspace**: Use a demo project with clean, readable code

### 4. Demo Project Setup
Create a sample project with:
```
demo-project/
├── src/
│   ├── components/
│   │   └── Button.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── package.json
└── README.md
```

---

## 📸 Screenshot 1: Voice Recording Interface in Action

**What to Show**: Active voice recording with waveform visualization

**Setup Steps**:
1. Open VSCode with extension installed
2. Press `Ctrl+Shift+V` to start voice recording
3. Speak a command: "Create a new React component called UserProfile"
4. Capture while the microphone is active and waveform is visible

**Key Elements to Include**:
- ✅ Microphone icon in status bar (active/recording state)
- ✅ Waveform visualization (if visible)
- ✅ Voice command being processed
- ✅ Status bar showing "Listening..." or recording indicator

**Screenshot Filename**: `01-voice-recording-active.png`

---

## 📸 Screenshot 2: AI Chat Integration Panel

**What to Show**: VoiceCode chat participant in VSCode's chat panel

**Setup Steps**:
1. Open VSCode Chat panel (Ctrl+Shift+I or View → Chat)
2. Type `@voicecode` to invoke the chat participant
3. Ask a question: "@voicecode explain this function" or "@voicecode refactor this code"
4. Show the AI response with code suggestions

**Key Elements to Include**:
- ✅ Chat panel open with @voicecode participant
- ✅ User message with @voicecode mention
- ✅ AI response with code snippets or explanations
- ✅ Available commands (voice, explain, refactor, test, tools)

**Screenshot Filename**: `02-ai-chat-integration.png`

---

## 📸 Screenshot 3: Code Generation Workflow

**What to Show**: Voice command generating actual code

**Setup Steps**:
1. Open an empty file (e.g., `src/components/UserProfile.tsx`)
2. Use voice command: "Create a React functional component with props for name and email"
3. Capture the moment when code is being generated or just completed
4. Show the generated code with proper syntax highlighting

**Key Elements to Include**:
- ✅ Empty or partially filled file
- ✅ Generated code (React component, function, class, etc.)
- ✅ Syntax highlighting
- ✅ Status bar showing completion or success message

**Screenshot Filename**: `03-code-generation-workflow.png`

---

## 📸 Screenshot 4: Multi-File Editing Capabilities

**What to Show**: VoiceCode making coordinated edits across multiple files

**Setup Steps**:
1. Open 2-3 files side by side (split editor)
2. Use voice command: "Refactor the Button component and update all imports"
3. Show multiple files with changes highlighted
4. Display diff view or modified indicators

**Key Elements to Include**:
- ✅ Multiple editor panes visible
- ✅ Modified file indicators (M badge in tabs)
- ✅ Code changes in multiple files
- ✅ Related edits across files (e.g., import updates)

**Screenshot Filename**: `04-multi-file-editing.png`

---

## 📸 Screenshot 5: Extension Settings Panel

**What to Show**: VoiceCode configuration options

**Setup Steps**:
1. Open Settings (Ctrl+,)
2. Search for "voicecode" or "voiceflow"
3. Show the extension settings with key configurations visible
4. Highlight important settings (STT engine, AI model, wake word, etc.)

**Key Elements to Include**:
- ✅ Settings search showing "voicecode"
- ✅ Extension settings section
- ✅ Key settings visible:
   - STT Engine (Whisper, AIML, Web Speech)
   - AI Model selection
   - Wake word configuration
   - Language selection
   - Enabled/disabled toggle

**Screenshot Filename**: `05-extension-settings.png`

---

## 📸 Screenshot 6: Command Palette with VoiceCode Commands

**What to Show**: Available VoiceCode commands in command palette

**Setup Steps**:
1. Open Command Palette (Ctrl+Shift+P)
2. Type "VoiceCode" or "VoiceFlow"
3. Show the list of available commands
4. Highlight key commands (Start Listening, Stop Listening, Show Chatbox, etc.)

**Key Elements to Include**:
- ✅ Command Palette open
- ✅ "VoiceCode" or "VoiceFlow" search query
- ✅ List of commands:
   - VoiceCode: Start Listening
   - VoiceCode: Stop Listening
   - VoiceCode: Toggle Listening
   - VoiceCode: Show Chatbox
   - VoiceCode: Open Settings
   - VoiceCode: Show Commands
- ✅ Keyboard shortcuts visible (if any)

**Screenshot Filename**: `06-command-palette.png`

---

## 📸 Screenshot 7: Dashboard/Analytics View

**What to Show**: VoiceCode sidebar dashboard with usage statistics

**Setup Steps**:
1. Open VoiceCode sidebar (click VoiceCode icon in Activity Bar)
2. Show the dashboard view with:
   - Command history
   - Usage statistics
   - Available commands list
   - Quick actions
3. Ensure data is visible (may need to use extension first to generate data)

**Key Elements to Include**:
- ✅ VoiceCode icon in Activity Bar (highlighted)
- ✅ Sidebar panel open showing dashboard
- ✅ Command history (recent voice commands)
- ✅ Usage statistics or metrics
- ✅ Available commands list
- ✅ Quick action buttons

**Screenshot Filename**: `07-dashboard-analytics.png`

---

## 🎨 Screenshot Best Practices

### Visual Quality
- **Resolution**: 1920x1080 minimum (marketplace supports up to 1920x1080)
- **Format**: PNG (lossless, no compression artifacts)
- **Color Depth**: 24-bit or 32-bit (with alpha channel)
- **File Size**: Keep under 5MB per image

### Composition
- **Focus**: Highlight the feature being demonstrated
- **Context**: Show enough UI to understand where the feature is
- **Clarity**: Use readable font sizes (14-16px)
- **Contrast**: Ensure text is readable against background

### Consistency
- **Theme**: Use the same VSCode theme for all screenshots
- **Font**: Use the same font and size
- **Window Size**: Keep VSCode window size consistent
- **Layout**: Maintain similar UI layout across screenshots

### Annotations (Optional)
- Add arrows or highlights to draw attention to key features
- Use tools like:
  - **Snagit** (Windows/Mac) - Professional screenshot tool with annotations
  - **Greenshot** (Windows) - Free with annotation features
  - **Skitch** (Mac) - Simple annotation tool
  - **Figma** (Web) - For post-processing and annotations

---

## 📁 Screenshot Storage

Save all screenshots to:
```
VoiceCode/extensions/voiceflow-vscode/screenshots/
├── 01-voice-recording-active.png
├── 02-ai-chat-integration.png
├── 03-code-generation-workflow.png
├── 04-multi-file-editing.png
├── 05-extension-settings.png
├── 06-command-palette.png
└── 07-dashboard-analytics.png
```

---

## ✅ Post-Capture Checklist

After capturing all screenshots:
- [ ] All 7 screenshots captured
- [ ] Resolution is 1920x1080 or higher
- [ ] File format is PNG
- [ ] File sizes are under 5MB each
- [ ] Screenshots are clear and readable
- [ ] Key features are visible in each screenshot
- [ ] Consistent theme and styling across all images
- [ ] No sensitive information visible (API keys, personal data)
- [ ] Screenshots saved to `screenshots/` directory

---

## 🚀 Next Steps

After capturing screenshots:
1. Review all images for quality and clarity
2. Optionally add annotations to highlight key features
3. Compress images if needed (use TinyPNG or similar)
4. Update marketplace listing with screenshots
5. Proceed to demo video creation

---

**Need Help?** If you encounter issues:
- Extension not loading: Check `Output` panel → `VoiceCode` for errors
- No data in dashboard: Use the extension first to generate command history
- Chat participant not showing: Ensure VSCode version supports chat participants (1.85+)

