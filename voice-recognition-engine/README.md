# VoiceFlow Pro Voice Recognition Engine

A comprehensive, production-ready voice recognition system for web applications, supporting both real-time Web Speech API and offline Whisper.js processing with 150+ languages.

## 🚀 Features

- **Dual Engine Architecture**: Web Speech API for real-time recognition + Whisper.js for offline processing
- **150+ Language Support**: Automatic language detection and seamless switching
- **Advanced Audio Processing**: Noise reduction, echo cancellation, and quality enhancement
- **Real-time Transcription**: Live speech-to-text with confidence scoring
- **Plugin System**: Extensible architecture for custom enhancements
- **Cross-browser Compatibility**: Works across modern browsers with graceful fallbacks
- **Performance Monitoring**: Detailed statistics and metrics tracking
- **Privacy-first**: Local processing capabilities with optional cloud enhancement

## 📦 Installation

```bash
npm install voiceflow-voice-recognition-engine
```

## 🏃‍♂️ Quick Start

### Basic Usage

```typescript
import { VoiceFlowPro, quickStart } from 'voiceflow-voice-recognition-engine';

// Option 1: Quick start (recommended for most cases)
const voiceEngine = await quickStart();

voiceEngine.onResult((result) => {
    console.log('Transcription:', result.transcript);
    console.log('Confidence:', result.confidence);
});

await voiceEngine.startListening();

// Option 2: Full configuration
import { createVoiceEngine, ModelType } from 'voiceflow-voice-recognition-engine';

const engine = createVoiceEngine({
    primaryEngine: ModelType.WEB_SPEECH_API,
    fallbackEngine: ModelType.WHISPER_BASE,
    autoEngineSelection: true,
    offlineFirst: false,
    qualityPreference: QualityLevel.EXCELLENT
});

await engine.initialize('en-US');

engine.on('recognition:result', (result) => {
    console.log('Transcript:', result.transcript);
});

await engine.startListening();
```

### Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>Voice Recognition Demo</title>
</head>
<body>
    <div id="transcription"></div>
    <button id="start">Start Listening</button>
    <button id="stop" disabled>Stop Listening</button>
    
    <script type="module">
        import { VoiceFlowPro } from './dist/index.js';
        
        const voiceEngine = new VoiceFlowPro();
        
        // Set up event listeners
        voiceEngine.onResult((result) => {
            document.getElementById('transcription').innerHTML = 
                `<p>${result.transcript} (${Math.round(result.confidence * 100)}%)</p>`;
        });
        
        voiceEngine.onError((error) => {
            console.error('Recognition error:', error.message);
        });
        
        document.getElementById('start').onclick = async () => {
            await voiceEngine.initialize('en-US');
            await voiceEngine.startListening();
        };
        
        document.getElementById('stop').onclick = async () => {
            await voiceEngine.stopListening();
        };
    </script>
</body>
</html>
```

## 🔧 Configuration Options

### Engine Configuration

```typescript
interface EngineConfig {
    primaryEngine: ModelType;              // Primary recognition engine
    fallbackEngine: ModelType;             // Fallback engine on errors
    autoEngineSelection: boolean;          // Automatic engine switching
    offlineFirst: boolean;                 // Prefer offline processing
    qualityPreference: QualityLevel;       // Quality vs speed preference
    performancePreference: PerformancePreference; // Performance optimization
    privacyMode: boolean;                  // Privacy-focused processing
    cacheEnabled: boolean;                 // Enable result caching
}
```

### Recognition Configuration

```typescript
interface RecognitionConfig {
    language: string;              // Language code (e.g., 'en-US')
    continuous: boolean;           // Continuous recognition
    interimResults: boolean;       // Include interim results
    maxAlternatives: number;       // Maximum alternative results
    confidenceThreshold: number;   // Minimum confidence threshold
    noiseReduction: boolean;       // Enable noise reduction
    autoLanguageDetection: boolean; // Automatic language detection
    realTimeTranscription: boolean; // Real-time processing
}
```

## 🌐 Language Support

The engine supports 150+ languages with automatic detection:

### Major Languages (High Quality)
- **English** (en-US, en-GB, en-AU, etc.)
- **Spanish** (es-ES, es-MX, es-AR, etc.)
- **French** (fr-FR, fr-CA, fr-BE, etc.)
- **German** (de-DE, de-AT, de-CH, etc.)
- **Italian** (it-IT)
- **Portuguese** (pt-PT, pt-BR)
- **Chinese** (zh-CN, zh-TW)
- **Japanese** (ja-JP)
- **Korean** (ko-KR)
- **Arabic** (ar-SA, ar-EG, etc.)

### Regional Languages
- European: Dutch, Swedish, Norwegian, Danish, Finnish, Polish, Czech, Hungarian, Romanian, Bulgarian, Croatian, Serbian, Slovenian, Estonian, Latvian, Lithuanian, Greek, Ukrainian, Belarusian, Macedonian, Albanian, Maltese, Icelandic, Irish, Welsh, Basque, Catalan, Galician
- Asian: Hindi, Thai, Vietnamese, Turkish, Indonesian, Malay, Filipino, Bengali, Tamil, Telugu, Malayalam, Kannada, Gujarati, Punjabi, Odia, Assamese, Nepali, Sinhala, Myanmar, Khmer, Lao, Georgian, Amharic
- African: Swahili, Zulu, Afrikaans, Malagasy, Yoruba, Igbo, Hausa, Chichewa

### Usage Examples

```typescript
// Set specific language
await voiceEngine.setLanguage('es-ES'); // Spanish (Spain)
await voiceEngine.setLanguage('pt-BR'); // Portuguese (Brazil)

// Auto-detect language
const detectedLang = await voiceEngine.detectLanguage(audioData);

// Search supported languages
import { VoiceUtils } from 'voiceflow-voice-recognition-engine';

const europeanLangs = VoiceUtils.searchLanguages('European');
const asianLangs = VoiceUtils.searchLanguages('Asian');

// Check language support
const isSupported = VoiceUtils.isLanguageSupported('fr-FR');
```

## 🎛️ Engine Management

### Model Types

```typescript
enum ModelType {
    WEB_SPEECH_API = 'web-speech-api',      // Browser native, requires internet
    WHISPER_TINY = 'whisper-tiny',          // 75MB, fast, lower accuracy
    WHISPER_BASE = 'whisper-base',          // 142MB, balanced performance
    WHISPER_SMALL = 'whisper-small',        // 488MB, good accuracy
    WHISPER_MEDIUM = 'whisper-medium',      // 1.5GB, high accuracy
    WHISPER_LARGE = 'whisper-large'         // 3GB, highest accuracy
}
```

### Engine Switching

```typescript
// Automatic engine selection (recommended)
engine.config.autoEngineSelection = true;

// Manual engine switching
await engine.switchEngine(ModelType.WHISPER_BASE);

// Monitor engine switches
engine.onEngineSwitched((modelType) => {
    console.log(`Switched to engine: ${modelType}`);
});
```

### Performance Optimization

```typescript
// Speed-optimized configuration
const speedConfig = {
    performancePreference: PerformancePreference.SPEED,
    primaryEngine: ModelType.WEB_SPEECH_API,
    qualityPreference: QualityLevel.GOOD
};

// Accuracy-optimized configuration
const accuracyConfig = {
    performancePreference: PerformancePreference.ACCURACY,
    primaryEngine: ModelType.WHISPER_LARGE,
    offlineFirst: true
};

// Resource-efficient configuration
const resourceConfig = {
    performancePreference: PerformancePreference.RESOURCE_SAVING,
    primaryEngine: ModelType.WHISPER_TINY,
    cacheEnabled: true
};
```

## 🎤 Audio Processing

### Audio Configuration

```typescript
interface AudioConfig {
    sampleRate: number;        // Audio sample rate (default: 44100)
    channels: number;          // Number of audio channels (default: 1)
    bufferSize: number;        // Audio buffer size (default: 4096)
    noiseReductionLevel: number; // Noise reduction intensity (0-1)
    echoCancellation: boolean; // Enable echo cancellation
    autoGainControl: boolean;  // Enable automatic gain control
    beamforming: boolean;      // Enable beamforming (if supported)
}
```

### Audio Monitoring

```typescript
engine.onAudioMetrics((metrics) => {
    console.log('Audio Level:', metrics.volume);
    console.log('Signal-to-Noise Ratio:', metrics.signalToNoiseRatio);
    console.log('Clipping Detected:', metrics.clipping);
    console.log('Latency:', metrics.latency, 'ms');
});

// Real-time audio level checking
const audioLevel = engine.getAudioLevel();
const isSpeaking = engine.isAudioActive(0.01); // 1% threshold
```

### Noise Reduction

```typescript
// The engine automatically applies noise reduction when enabled
const config = {
    noiseReduction: true,
    recognitionConfig: {
        // Custom audio processing configuration
        sampleRate: 16000, // Lower sample rate for better compression
        channels: 1,       // Mono for voice recognition
        bufferSize: 2048   // Smaller buffer for lower latency
    }
};
```

## 📊 Real-time Transcription

### Result Handling

```typescript
engine.onResult((result) => {
    console.log('Transcript:', result.transcript);
    console.log('Confidence:', result.confidence);
    console.log('Is Final:', result.isFinal);
    console.log('Language:', result.language);
    console.log('Timestamp:', new Date(result.timestamp));
    
    // Access alternatives
    result.alternatives.forEach((alt, index) => {
        console.log(`Alternative ${index + 1}: ${alt.transcript} (${alt.confidence})`);
    });
    
    // Check metadata
    console.log('Audio Level:', result.metadata.audioLevel);
    console.log('Processing Time:', result.metadata.processingTime, 'ms');
    console.log('Model Used:', result.metadata.modelUsed);
});
```

### Interim Results

```typescript
const config = {
    interimResults: true, // Enable interim results
    continuous: true      // Continuous recognition
};

await engine.startListening(config);

engine.onResult((result) => {
    if (result.isFinal) {
        // Final result
        console.log('Final:', result.transcript);
    } else {
        // Interim result (changes as you speak)
        console.log('Interim:', result.transcript);
    }
});
```

## 🔌 Plugin System

### Creating Custom Plugins

```typescript
import { VoiceRecognitionPlugin } from 'voiceflow-voice-recognition-engine';

class NoiseReductionPlugin implements VoiceRecognitionPlugin {
    name = 'advanced-noise-reduction';
    version = '1.0.0';
    
    async initialize(): Promise<void> {
        // Plugin initialization
        console.log('Noise reduction plugin initialized');
    }
    
    async processAudio(audioData: Float32Array): Promise<Float32Array> {
        // Apply custom noise reduction
        return this.applyAdvancedNoiseReduction(audioData);
    }
    
    async enhanceResult(result: SpeechRecognitionResult): Promise<SpeechRecognitionResult> {
        // Enhance transcription result
        result.transcript = this.postProcessTranscript(result.transcript);
        return result;
    }
    
    async cleanup(): Promise<void> {
        // Plugin cleanup
        console.log('Noise reduction plugin cleaned up');
    }
}

// Register the plugin
await engine.registerPlugin(new NoiseReductionPlugin());
```

### Available Plugin Types

```typescript
interface VoiceRecognitionPlugin {
    name: string;
    version: string;
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
    
    // Optional methods
    processAudio?(audioData: Float32Array): Promise<Float32Array>;
    enhanceResult?(result: SpeechRecognitionResult): Promise<SpeechRecognitionResult>;
    detectLanguage?(audioData: Float32Array): Promise<Language | null>;
}
```

## 📈 Statistics and Monitoring

### Performance Statistics

```typescript
// Get comprehensive statistics
const stats = engine.getStatistics();
console.log('Total Recognitions:', stats.totalRecognitions);
console.log('Average Accuracy:', Math.round(stats.averageAccuracy * 100) + '%');
console.log('Average Speed:', stats.averageSpeed + 'ms');
console.log('Error Rate:', Math.round(stats.errorRate * 100) + '%');

// Language usage statistics
console.log('Language Usage:', stats.languageUsage);
console.log('Engine Usage:', stats.engineUsage);

// Performance metrics
const performance = engine.getPerformanceMetrics();
console.log('Average Response Time:', performance.averageResponseTime + 'ms');
console.log('Success Rate:', Math.round(performance.successRate * 100) + '%');
console.log('Engine Switches:', performance.switchCount);
```

### Custom Metrics Collection

```typescript
class MetricsCollector {
    private metrics: any[] = [];
    
    constructor(engine: VoiceFlowPro) {
        engine.onResult((result) => {
            this.metrics.push({
                timestamp: Date.now(),
                confidence: result.confidence,
                processingTime: result.metadata.processingTime,
                language: result.language,
                engine: result.metadata.modelUsed
            });
        });
    }
    
    getMetrics() {
        return this.metrics;
    }
    
    exportMetrics() {
        return JSON.stringify(this.metrics, null, 2);
    }
}
```

## 🛡️ Error Handling

### Error Types

```typescript
engine.onError((error) => {
    console.error('Recognition Error:', {
        message: error.message,
        code: error.code,
        model: error.model,
        recoverable: error.recoverable
    });
    
    // Handle specific error types
    switch (error.code) {
        case ErrorCode.NO_MICROPHONE:
            alert('No microphone found. Please connect a microphone.');
            break;
        case ErrorCode.PERMISSION_DENIED:
            alert('Microphone permission denied. Please allow microphone access.');
            break;
        case ErrorCode.NETWORK_ERROR:
            console.log('Network error, switching to offline mode');
            break;
        case ErrorCode.LANGUAGE_NOT_SUPPORTED:
            alert('Selected language is not supported by this engine.');
            break;
    }
});
```

### Automatic Recovery

```typescript
const config = {
    autoEngineSelection: true, // Enable automatic recovery
    fallbackEngine: ModelType.WHISPER_BASE
};

// The engine will automatically switch engines on recoverable errors
engine.on('model:switched', (newModel) => {
    console.log(`Automatically switched to: ${newModel}`);
});
```

## 🔒 Privacy and Security

### Privacy-First Configuration

```typescript
const privacyConfig = {
    privacyMode: true,              // Process everything locally
    offlineFirst: true,             // Prefer offline processing
    cacheEnabled: false,            // Disable caching
    autoEngineSelection: false      // Use only local engines
};

// Verify privacy settings
engine.onResult((result) => {
    // Check if result was processed locally
    if (result.metadata.modelUsed.startsWith('whisper')) {
        console.log('Processed locally (private)');
    } else {
        console.log('Processed online (may be stored)');
    }
});
```

### GDPR Compliance

```typescript
// Data retention and export
const stats = engine.getStatistics();

// Clear all data
function clearUserData(engine: VoiceFlowPro) {
    engine.clearResults();
    engine.clearStatistics();
    // Optionally remove from localStorage
    localStorage.removeItem('voiceflow-stats');
}
```

## 🚀 Advanced Usage

### Multi-language Support

```typescript
class MultiLanguageManager {
    private engine: VoiceFlowPro;
    private currentLanguages: Set<string> = new Set();
    
    async addLanguage(languageCode: string) {
        await this.engine.setLanguage(languageCode);
        this.currentLanguages.add(languageCode);
        
        // Monitor for language detection
        this.engine.onLanguageDetected((detected) => {
            if (detected && !this.currentLanguages.has(detected.code)) {
                this.currentLanguages.add(detected.code);
                console.log('Detected new language:', detected.name);
            }
        });
    }
    
    async switchToBestLanguage(results: SpeechRecognitionResult[]) {
        // Analyze results to determine best language
        const languageScores = new Map<string, number>();
        
        results.forEach(result => {
            const score = languageScores.get(result.language) || 0;
            languageScores.set(result.language, score + result.confidence);
        });
        
        // Switch to highest scoring language
        const bestLanguage = Array.from(languageScores.entries())
            .sort((a, b) => b[1] - a[1])[0];
            
        if (bestLanguage) {
            await this.engine.setLanguage(bestLanguage[0]);
        }
    }
}
```

### Custom Voice Commands

```typescript
class VoiceCommandProcessor {
    private commands: Map<string, () => void> = new Map();
    
    constructor(engine: VoiceFlowPro) {
        engine.onResult((result) => {
            const transcript = result.transcript.toLowerCase().trim();
            
            this.commands.forEach((action, command) => {
                if (transcript.includes(command.toLowerCase())) {
                    action();
                }
            });
        });
    }
    
    addCommand(phrase: string, action: () => void) {
        this.commands.set(phrase, action);
    }
    
    removeCommand(phrase: string) {
        this.commands.delete(phrase);
    }
}

// Usage example
const commandProcessor = new VoiceCommandProcessor(engine);

commandProcessor.addCommand('start recording', () => {
    console.log('Starting recording...');
    engine.startListening();
});

commandProcessor.addCommand('stop recording', () => {
    console.log('Stopping recording...');
    engine.stopListening();
});
```

### Integration with AI Services

```typescript
class AIServiceIntegration {
    private engine: VoiceFlowPro;
    private openaiClient: any; // OpenAI client
    
    constructor(engine: VoiceFlowPro) {
        this.engine = engine;
        this.engine.onResult(async (result) => {
            if (result.confidence > 0.8) {
                await this.processWithAI(result.transcript);
            }
        });
    }
    
    async processWithAI(text: string) {
        try {
            const response = await this.openaiClient.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'user', content: `Improve this transcription: "${text}"` }
                ]
            });
            
            const improvedText = response.choices[0].message.content;
            console.log('AI Improved:', improvedText);
            
            // Emit improved result
            this.engine.emit('recognition:result', {
                ...result,
                transcript: improvedText,
                metadata: {
                    ...result.metadata,
                    aiEnhanced: true
                }
            });
            
        } catch (error) {
            console.error('AI processing failed:', error);
        }
    }
}
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```typescript
// Test setup
import { createVoiceEngine, ModelType } from 'voiceflow-voice-recognition-engine';

describe('Voice Recognition Engine', () => {
    let engine: VoiceFlowPro;
    
    beforeEach(async () => {
        engine = createVoiceEngine({
            primaryEngine: ModelType.WHISPER_BASE,
            offlineFirst: true
        });
        await engine.initialize('en-US');
    });
    
    afterEach(async () => {
        engine.dispose();
    });
    
    test('should initialize successfully', async () => {
        expect(engine.isSupported).toBe(true);
    });
    
    test('should start and stop listening', async () => {
        await engine.startListening();
        expect(engine.isListening).toBe(true);
        
        await engine.stopListening();
        expect(engine.isListening).toBe(false);
    });
    
    test('should handle transcription results', async (done) => {
        engine.onResult((result) => {
            expect(result.transcript).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0);
            done();
        });
        
        // Simulate result (in real tests, you'd use audio input)
        engine.emit('recognition:result', {
            transcript: 'Test transcription',
            confidence: 0.9,
            isFinal: true,
            timestamp: Date.now(),
            language: 'en-US',
            alternatives: [{ transcript: 'Test transcription', confidence: 0.9 }],
            metadata: {
                audioLevel: 0.5,
                signalQuality: 0.9,
                processingTime: 100,
                modelUsed: ModelType.WHISPER_BASE,
                noiseLevel: 0.1
            }
        });
    });
});
```

## 📚 API Reference

### Core Classes

#### VoiceFlowPro
Main engine class providing the primary interface for voice recognition.

**Methods:**
- `initialize(language?: string): Promise<void>`
- `startListening(config?: RecognitionConfig): Promise<void>`
- `stopListening(): Promise<void>`
- `setLanguage(languageCode: string): Promise<void>`
- `switchEngine(modelType: ModelType): Promise<void>`
- `registerPlugin(plugin: VoiceRecognitionPlugin): Promise<void>`
- `unregisterPlugin(pluginName: string): Promise<void>`
- `getStatistics(): RecognitionStats`
- `getPerformanceMetrics(): any`

**Events:**
- `recognition:start`
- `recognition:stop`
- `recognition:result`
- `recognition:error`
- `audio:metrics`
- `language:detected`
- `model:switched`

#### VoiceUtils
Utility class providing helper functions for common tasks.

**Methods:**
- `isLanguageSupported(languageCode: string): boolean`
- `searchLanguages(query: string): Language[]`
- `formatTranscript(result: SpeechRecognitionResult): string`
- `createVoiceCommandParser(commands: { [key: string]: string }): (text: string) => string | null`

### Types

See `src/types/index.ts` for complete type definitions.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/voiceflow-pro/voice-recognition-engine.git
cd voice-recognition-engine

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
npm run lint
npm run format
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **OpenAI Whisper** for the excellent offline speech recognition model
- **Web Speech API** for browser-native speech recognition
- **The open-source community** for various audio processing libraries

## 📞 Support

- 📧 Email: support@voiceflowpro.com
- 📚 Documentation: [docs.voiceflowpro.com](https://docs.voiceflowpro.com)
- 🐛 Issues: [GitHub Issues](https://github.com/voiceflow-pro/voice-recognition-engine/issues)
- 💬 Discord: [Join our community](https://discord.gg/voiceflowpro)

---

**Built with ❤️ by the VoiceFlow Pro Team**

*Empowering the future of voice interaction, one word at a time.*