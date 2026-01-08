# VoiceCode for VS Code

Voice-controlled coding assistant that brings natural language coding capabilities directly to VS Code.

## Features

### Voice Dictation
- **Real-time transcription** with 450ms latency (instant mode) or 850ms (enhanced mode)
- **Code-optimized vocabulary** - correctly recognizes technical terms like "Kubernetes", "PyTorch", "kubectl"
- **Smart punctuation** - context-aware punctuation for code vs prose
- **Custom dictionary** - add your own terms and corrections

### Voice Commands
- **Text editing**: "change foo to bar", "delete last line", "select all"
- **Code generation**: "generate function to validate email", "create class User"
- **Navigation**: "go to line 42", "find function handleSubmit", "open file package.json"
- **Refactoring**: "extract function", "add error handling", "refactor to async/await"
- **VS Code actions**: "save", "format", "comment", "fold", "terminal"

### Code Intelligence
- **Explain code** - Select code and ask "what does this do"
- **Find bugs** - Analyze code for potential issues
- **Suggest improvements** - Get AI-powered suggestions

## Requirements

- VoiceCode desktop application must be running
- Microphone access

## Installation

1. Install the VoiceCode desktop app from [voicecode.app](https://voicecode.app)
2. Install this extension from VS Code marketplace
3. Start the VoiceCode desktop app
4. Press `Cmd+Shift+V` (Mac) or `Ctrl+Shift+V` (Windows/Linux) to start dictating

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+V` | Toggle voice dictation |
| `Cmd/Ctrl+Shift+C` | Execute voice command |

## Extension Settings

- `voicecode.apiEndpoint`: VoiceCode desktop app API endpoint (default: http://localhost:3847)
- `voicecode.language`: Speech recognition language (default: en-US)
- `voicecode.autoStart`: Automatically start dictation when VS Code opens
- `voicecode.streamingMode`: instant, enhanced, or hybrid
- `voicecode.codeVocabulary`: Enable code-optimized vocabulary
- `voicecode.naturalLanguageCommands`: Enable natural language editing
- `voicecode.showStatusBar`: Show VoiceCode status in status bar
- `voicecode.punctuationMode`: none, basic, or smart

## Voice Command Examples

### Dictation
```
"start dictation"
"stop dictation"
"pause"
```

### Text Editing
```
"change hello to world"
"delete last word"
"undo"
"select all"
```

### Code Generation
```
"generate function to validate email address"
"create class User with name and email properties"
"add method to calculate total"
"write test for login function"
```

### Navigation
```
"go to line 42"
"go to definition"
"find function handleSubmit"
"open file package.json"
```

### Git
```
"git status"
"git commit fix login bug"
"git push"
```

## Troubleshooting

### "Not connected to VoiceCode"
Make sure the VoiceCode desktop app is running. The extension connects via WebSocket to localhost:3847.

### Poor recognition accuracy
1. Check your microphone settings
2. Add commonly misrecognized terms to your custom dictionary
3. Enable code vocabulary for better technical term recognition

### High latency
1. Switch to "instant" streaming mode for fastest response
2. Check your internet connection (enhanced mode requires API calls)

## Privacy

- Voice data is processed locally when using instant mode
- Enhanced mode sends audio to VoiceCode servers for improved accuracy
- No voice data is stored permanently

## Support

- [GitHub Issues](https://github.com/voicecode/voicecode-vscode/issues)
- [Documentation](https://docs.voicecode.app)

## License

MIT License - see LICENSE file for details.
