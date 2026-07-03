# VoiceFlow Pro UI Components

A comprehensive, cross-platform React/TypeScript UI component library for voice recording applications. Built with accessibility-first design principles, theme support, and platform-specific optimizations for Mac, Windows, and Linux.

## Features

### 🎯 Core Components
- **VoiceRecording**: Full-featured voice recording interface with real-time feedback
- **TranscriptionDisplay**: Rich text display with editing capabilities and confidence indicators  
- **LanguageSelector**: Multi-language support with search and auto-detection
- **AudioVisualization**: Real-time audio waveform, frequency, and circular visualizations
- **SettingsPanel**: Comprehensive settings management with import/export

### ♿ Accessibility Features
- WCAG 2.1 AA compliant
- Screen reader support with ARIA labels
- Keyboard navigation with customizable shortcuts
- High contrast mode support
- Voice feedback options
- Focus management and indicators

### 🎨 Theme System
- Light, Dark, and Auto themes
- Platform-specific styling (macOS, Windows, Linux)
- High contrast accessibility themes
- Customizable color palettes
- Responsive design patterns

### 📱 Cross-Platform Support
- Platform detection and optimization
- Native styling patterns for each OS
- Electron-ready architecture
- Web and desktop compatible
- Consistent API across platforms

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd voiceflow-pro-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import {
  ThemeProvider,
  SettingsProvider,
  VoiceRecording,
  TranscriptionDisplay,
} from './components';

function App() {
  return (
    <ThemeProvider defaultTheme="auto">
      <SettingsProvider>
        <div>
          <VoiceRecording />
          <TranscriptionDisplay />
        </div>
      </SettingsProvider>
    </ThemeProvider>
  );
}
```

### Voice Recording Component

```tsx
import { VoiceRecording } from './components';

<VoiceRecording
  onRecordingStart={() => console.log('Started')}
  onRecordingStop={() => console.log('Stopped')}
  showVolume={true}
  showSettings={true}
  size="large"
  variant="primary"
  // Accessibility props
  'aria-label': 'Start voice recording'
  role="button"
/>
```

### Transcription Display

```tsx
import { TranscriptionDisplay } from './components';

const segments = [
  {
    id: '1',
    text: 'Hello world',
    confidence: 0.95,
    startTime: 0,
    endTime: 2.5,
    isFinal: true,
    speaker: 'User',
  },
];

<TranscriptionDisplay
  segments={segments}
  onSegmentEdit={(id, text) => console.log('Edit:', id, text)}
  editable={true}
  showTimestamps={true}
  showConfidence={true}
  autoScroll={true}
/>
```

### Language Selector

```tsx
import { LanguageSelector } from './components';

<LanguageSelector
  value="en"
  onChange={(lang) => setLanguage(lang)}
  onAutoDetect={() => console.log('Auto-detecting')}
  searchable={true}
  showNativeNames={true}
  showFlags={true}
  size="medium"
/>
```

### Audio Visualization

```tsx
import { AudioVisualization } from './components';

<AudioVisualization
  isRecording={true}
  onDataUpdate={(data) => console.log(data)}
  visualizationType="waveform" // waveform | frequency | circular | bars
  showRecordingIndicator={true}
  showVolume={true}
  showFrequency={true}
  height={120}
/>
```

### Settings Panel

```tsx
import { SettingsPanel } from './components';

const [isSettingsOpen, setIsSettingsOpen] = useState(false);

<>
  <button onClick={() => setIsSettingsOpen(true)}>
    Settings
  </button>
  
  <SettingsPanel
    isOpen={isSettingsOpen}
    onClose={() => setIsSettingsOpen(false)}
    onSave={(settings) => console.log('Saved:', settings)}
  />
</>
```

## Component API

### VoiceRecording

Props:
- `onRecordingStart?()` - Called when recording starts
- `onRecordingStop?()` - Called when recording stops  
- `onRecordingPause?()` - Called when recording pauses
- `onRecordingResume?()` - Called when recording resumes
- `onStateChange?(state)` - Called when state changes
- `disabled?` boolean - Disable the component
- `showVolume?` boolean - Show volume indicator
- `showSettings?` boolean - Show settings button
- `size?` 'small' | 'medium' | 'large' - Component size
- `variant?` 'primary' | 'secondary' | 'minimal' - Visual variant

### TranscriptionDisplay

Props:
- `segments?` TranscriptionSegment[] - Array of transcription segments
- `onSegmentEdit?(id, text)` - Called when segment is edited
- `onTextCopy?(text)` - Called when text is copied
- `onTextExport?(text, format)` - Called when text is exported
- `editable?` boolean - Allow text editing
- `showTimestamps?` boolean - Show timestamps
- `showConfidence?` boolean - Show confidence indicators
- `showSpeaker?` boolean - Show speaker labels
- `autoScroll?` boolean - Auto-scroll to latest segment
- `maxHeight?` string - Maximum height of display area

### LanguageSelector

Props:
- `languages?` LanguageInfo[] - Custom language list
- `value?` string - Currently selected language code
- `onChange?(code)` - Called when language changes
- `onAutoDetect?()` - Called for auto-detection
- `searchable?` boolean - Enable search functionality
- `showNativeNames?` boolean - Show native language names
- `showFlags?` boolean - Show flag icons

### AudioVisualization

Props:
- `isRecording?` boolean - Whether audio is recording
- `data?` AudioVisualizationData[] - Historical data points
- `onDataUpdate?(data)` - Called with new audio data
- `visualizationType?` 'waveform' | 'frequency' | 'circular' | 'bars'
- `showRecordingIndicator?` boolean - Show recording status
- `showVolume?` boolean - Show volume level
- `showFrequency?` boolean - Show frequency info

### SettingsPanel

Props:
- `isOpen` boolean - Whether panel is open
- `onClose()` - Called when panel closes
- `onSave?(settings)` - Called when settings are saved

## Theme System

### Using Themes

```tsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, colors, spacing } = useTheme();
  
  return (
    <button style={{
      backgroundColor: colors.primary,
      color: '#ffffff',
      padding: spacing.md,
    }}>
      Styled Button
    </button>
  );
}
```

### Platform Detection

```tsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { platform, platformConfig } = useTheme();
  
  if (platform === 'mac') {
    // macOS specific styling
  } else if (platform === 'windows') {
    // Windows specific styling  
  } else if (platform === 'linux') {
    // Linux specific styling
  }
}
```

## Accessibility Features

### Keyboard Navigation

All components support keyboard navigation with proper focus management:

- Tab/Shift+Tab - Navigate between interactive elements
- Enter/Space - Activate buttons and controls
- Escape - Close modals and dropdowns
- Arrow keys - Navigate within lists and menus

### Screen Reader Support

All components include proper ARIA attributes:

```tsx
<button
  aria-label="Start voice recording"
  aria-describedby="recording-help"
  aria-expanded={isOpen}
  role="button"
>
  Record
</button>
```

### High Contrast Mode

Detects system high contrast preference and provides enhanced styling:

```tsx
import { useHighContrast } from './utils/accessibility';

function MyComponent() {
  const isHighContrast = useHighContrast();
  
  return (
    <div style={{
      border: isHighContrast ? '2px solid #000' : '1px solid #ccc',
    }}>
      Content
    </div>
  );
}
```

## Platform-Specific Optimizations

### macOS
- Native-looking controls and spacing
- SF Symbols-style icons
- Rounded corners with appropriate radius
- Platform-specific keyboard shortcuts

### Windows  
- Fluent Design language elements
- Rectangular corners with minimal radius
- DirectX-style colors and gradients
- Windows-specific hotkeys

### Linux
- Material Design influenced styling
- Ubuntu/GTK visual patterns
- Distribution-agnostic color schemes
- Cross-desktop compatibility

## Building and Deployment

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Architecture

### Component Structure

```
src/
├── components/          # UI components
│   ├── VoiceRecording.tsx
│   ├── TranscriptionDisplay.tsx
│   ├── LanguageSelector.tsx
│   ├── AudioVisualization.tsx
│   └── SettingsPanel.tsx
├── contexts/            # React contexts
│   ├── ThemeContext.tsx
│   └── SettingsContext.tsx
├── types/              # TypeScript definitions
├── utils/              # Utility functions
│   └── accessibility.ts
└── App.tsx             # Demo application
```

### State Management

- **ThemeContext**: Manages theme state and platform detection
- **SettingsContext**: Handles application settings and user preferences
- **Local State**: Component-specific state using React hooks

### Styling Strategy

- Inline styles for dynamic theming
- Platform-specific style calculations
- CSS-in-JS approach with TypeScript support
- Accessibility-focused design patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow TypeScript strict mode
- Maintain WCAG 2.1 AA compliance
- Add proper ARIA labels and roles
- Test on multiple platforms
- Update documentation

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - see LICENSE file for details

## Support

For questions and support:
- Create an issue on GitHub
- Check the documentation
- Review the demo application

---

Built with ❤️ for the VoiceFlow Pro project
