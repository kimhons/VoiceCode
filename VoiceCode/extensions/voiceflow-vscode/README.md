# 🎤 VoiceCode - Voice-Powered AI Coding Assistant

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=voicecode.voicecode-vscode)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/kimhons/VoiceCode-PRO/blob/master/LICENSE)
[![Voice-First](https://img.shields.io/badge/voice--first-coding-blue)](https://github.com/kimhons/VoiceCode-PRO)
[![Accessibility](https://img.shields.io/badge/accessibility-friendly-green)](https://github.com/kimhons/VoiceCode-PRO)

**Code at the speed of thought with voice commands.** VoiceCode is the **only voice-first coding assistant** that lets you control your IDE, write code, and interact with AI assistants using natural language voice commands.

Perfect for developers with accessibility needs, RSI/carpal tunnel, or anyone who wants to **code faster without typing**.

![VoiceCode Demo](https://raw.githubusercontent.com/kimhons/VoiceCode-PRO/master/docs/demo.gif)

## ✨ Why VoiceCode?

### 🎯 Unique Value Proposition

- **🎤 Voice-First Architecture**: The ONLY extension built from the ground up for voice coding
- **🤖 Multi-AI Orchestration**: Works seamlessly with Copilot, Cursor, Cline, Aider, and Augment
- **♿ Accessibility Focus**: Designed for developers with disabilities and accessibility needs
- **🚀 Hands-Free Development**: Code, navigate, and refactor without touching the keyboard
- **🌍 100+ Languages**: Supports voice recognition in over 100 languages
- **🔒 Privacy-First**: Local AI processing with Whisper.js (no data sent to cloud)

## 🚀 Quick Start

### Installation

1. Install from [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=voicecode.voicecode-vscode)
2. Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) to start listening
3. Say a command like **"Open file App.tsx"** or **"Create a new function called getUserData"**
4. Watch VoiceCode execute your command!

### First Voice Command

```
You: "Hey VoiceCode, open the command palette"
VoiceCode: ✅ Opening command palette...

You: "Create a new React component called UserProfile"
VoiceCode: ✅ Creating UserProfile component...

You: "Add a useState hook for user data"
VoiceCode: ✅ Adding useState hook...
```

## 🎯 Core Features

### 🎤 Advanced Voice Recognition

- **Local AI Processing**: Whisper.js models (tiny, base, small, medium)
- **Cloud Fallback**: AIML API for higher accuracy
- **Professional Tier**: Deepgram Nova-2 integration
- **Wake Word Detection**: "Hey VoiceCode" to activate
- **Continuous Listening**: Always-on mode for hands-free coding
- **Push-to-Talk**: Walky-talky mode for precise control

### 🤖 AI Integration

VoiceCode bridges your voice to ALL major AI coding assistants:

- ✅ **GitHub Copilot**: Voice-controlled code suggestions
- ✅ **Cursor**: Voice-driven multi-file editing
- ✅ **Cline**: Voice-activated code generation
- ✅ **Aider**: Voice-powered refactoring
- ✅ **Augment**: Voice-enhanced context awareness

### 📝 50+ Built-in Commands

**File Operations**:
- "Open file [name]"
- "Create new file [name]"
- "Save current file"
- "Close all files"

**Code Editing**:
- "Go to line [number]"
- "Select all"
- "Copy selection"
- "Paste"
- "Undo last change"
- "Format document"

**Navigation**:
- "Go to definition"
- "Find all references"
- "Search for [term]"
- "Go to symbol [name]"

**AI Commands**:
- "Explain this code"
- "Refactor this function"
- "Add comments"
- "Generate tests"
- "Fix this bug"

**Git Operations**:
- "Git commit with message [message]"
- "Git push"
- "Git pull"
- "Show git status"

**Terminal**:
- "Run command [command]"
- "Open terminal"
- "Clear terminal"

### 🎨 Custom Commands

Create project-specific voice commands:

```json
{
  "name": "Deploy to production",
  "trigger": "deploy prod",
  "actions": [
    { "type": "terminal", "command": "npm run build" },
    { "type": "terminal", "command": "npm run deploy" },
    { "type": "notification", "message": "Deployment started!" }
  ]
}
```

### 🧠 Context-Aware Intelligence

VoiceCode understands your codebase:

- **3-Tier Context Gathering**: Minimal (~10ms), Medium (~100ms), Deep (~200ms)
- **AST Parsing**: Tree-sitter for multi-language code understanding
- **Semantic Search**: Vector embeddings for intelligent code search
- **Symbol Resolution**: Automatic import and dependency tracking
- **Workspace Awareness**: Multi-folder project support

## 📊 Performance

- **Voice Recognition Accuracy**: 85-95% (depending on model)
- **Command Execution Latency**: <1 second
- **Memory Usage**: ~150MB (with Whisper base model)
- **Startup Time**: <3 seconds

## 🔧 Configuration

### Settings

```json
{
  "voiceflow.enabled": true,
  "voiceflow.language": "en-US",
  "voiceflow.sttEngine": "whisper-base",
  "voiceflow.aiModel": "gpt-4o-mini",
  "voiceflow.wakeWord": "hey voiceflow",
  "voiceflow.wakeWordEnabled": true
}
```

### Keyboard Shortcuts

- `Ctrl+Shift+V` (Mac: `Cmd+Shift+V`): Toggle voice listening
- `Ctrl+Shift+C` (Mac: `Cmd+Shift+C`): Open AI chatbox

## 🌟 Use Cases

### Accessibility

Perfect for developers with:
- RSI (Repetitive Strain Injury)
- Carpal tunnel syndrome
- Visual impairments
- Motor disabilities
- Chronic pain conditions

### Productivity

Boost your coding speed:
- Hands-free code navigation
- Voice-driven refactoring
- Quick command execution
- Multi-tasking while coding

### Learning

Great for:
- Code reviews (voice annotations)
- Pair programming (voice collaboration)
- Teaching (voice-guided tutorials)
- Documentation (voice-to-text)

## 🛠️ Requirements

- **VSCode**: Version 1.85.0 or higher
- **Node.js**: Version 20.0.0 or higher
- **Microphone**: Any USB or built-in microphone
- **Internet**: Optional (for cloud AI features)

## 📚 Documentation

- [Getting Started Guide](https://github.com/kimhons/VoiceCode-PRO/wiki/Getting-Started)
- [Command Reference](https://github.com/kimhons/VoiceCode-PRO/wiki/Commands)
- [Troubleshooting](https://github.com/kimhons/VoiceCode-PRO/wiki/Troubleshooting)
- [FAQ](https://github.com/kimhons/VoiceCode-PRO/wiki/FAQ)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/kimhons/VoiceCode-PRO/blob/master/CONTRIBUTING.md)

## 📝 License

MIT License - see [LICENSE](https://github.com/kimhons/VoiceCode-PRO/blob/master/LICENSE)

## 🙏 Support

- [GitHub Issues](https://github.com/kimhons/VoiceCode-PRO/issues)
- [Email Support](mailto:khonour@yahoo.com)
- [Sponsor on GitHub](https://github.com/sponsors/kimhons)

---

**Made with ❤️ by developers, for developers**

*VoiceCode - Code at the speed of thought* 🚀

