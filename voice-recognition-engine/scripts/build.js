/**
 * Simple build script for VoiceFlow Pro Voice Recognition Engine
 * JavaScript version for easier execution
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');

class SimpleBuildManager {
  constructor() {
    this.outputDir = 'dist';
  }

  async build() {
    console.log('🚀 Building VoiceFlow Pro Voice Recognition Engine...');
    
    try {
      // Ensure output directory exists
      if (!existsSync(this.outputDir)) {
        mkdirSync(this.outputDir, { recursive: true });
      }

      // Clean previous build
      this.cleanDist();

      // Compile TypeScript
      await this.compileTypeScript();

      // Create browser bundle
      await this.createBrowserBundle();

      // Generate API documentation
      await this.generateAPIDocs();

      console.log('✅ Build completed successfully!');
      console.log(`📦 Output directory: ${this.outputDir}`);
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw error;
    }
  }

  cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    execSync('rm -rf dist/*', { stdio: 'inherit' });
  }

  async compileTypeScript() {
    console.log('📝 Compiling TypeScript...');
    
    const tscCommand = [
      'tsc',
      '--project', 'tsconfig.json',
      '--outDir', this.outputDir,
      '--declaration',
      '--declarationMap',
      '--sourceMap',
      '--removeComments'
    ];

    execSync(tscCommand.join(' '), { stdio: 'inherit' });
  }

  async createBrowserBundle() {
    console.log('🌐 Creating browser bundle...');
    
    const browserEntry = `
// VoiceFlow Pro Voice Recognition Engine - Browser Bundle
// This file provides browser-compatible entry points

import * as core from './index.js';

// Export everything from the main module
export * from './index.js';

// Add browser-specific globals
if (typeof window !== 'undefined') {
  window.VoiceFlowPro = core;
  window.VoiceFlowRecognition = core;
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('VoiceFlow Pro Voice Recognition Engine loaded');
  });
}
`;

    writeFileSync(join(this.outputDir, 'browser.js'), browserEntry);
  }

  async generateAPIDocs() {
    console.log('📚 Generating API documentation...');
    
    const docs = this.generateAPIDocs();
    writeFileSync(join(this.outputDir, 'API.md'), docs);
  }

  generateAPIDocs() {
    return `# VoiceFlow Pro Voice Recognition Engine - API Reference

## Quick Start

\`\`\`typescript
import { VoiceFlowPro, quickStart } from 'voiceflow-voice-recognition-engine';

// Quick start (recommended)
const engine = await quickStart();

engine.onResult((result) => {
  console.log('Transcript:', result.transcript);
  console.log('Confidence:', result.confidence);
});

await engine.startListening();
\`\`\`

## Main Classes

### VoiceFlowPro
Main engine class for voice recognition.

\`\`\`typescript
class VoiceFlowPro {
  async initialize(language?: string): Promise<void>
  async startListening(config?: RecognitionConfig): Promise<void>
  async stopListening(): Promise<void>
  async setLanguage(languageCode: string): Promise<void>
  async switchEngine(modelType: ModelType): Promise<void>
  
  // Event handlers
  onResult(callback: (result: SpeechRecognitionResult) => void): () => void
  onError(callback: (error: RecognitionError) => void): () => void
  onStart(callback: () => void): () => void
  onStop(callback: () => void): () => void
  onAudioMetrics(callback: (metrics: AudioMetrics) => void): () => void
}
\`\`\`

### VoiceUtils
Utility functions for common tasks.

\`\`\`typescript
class VoiceUtils {
  static isLanguageSupported(languageCode: string): boolean
  static searchLanguages(query: string): Language[]
  static formatTranscript(result: SpeechRecognitionResult): string
  static createVoiceCommandParser(commands: { [key: string]: string }): Function
  static calculateAverageConfidence(results: SpeechRecognitionResult[]): number
}
\`\`\`

## Types

### RecognitionConfig
\`\`\`typescript
interface RecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  noiseReduction: boolean;
  autoLanguageDetection: boolean;
  realTimeTranscription: boolean;
}
\`\`\`

### SpeechRecognitionResult
\`\`\`typescript
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  language: string;
  alternatives: Alternative[];
  metadata: RecognitionMetadata;
}
\`\`\`

## Engine Types

\`\`\`typescript
enum ModelType {
  WEB_SPEECH_API = 'web-speech-api',
  WHISPER_TINY = 'whisper-tiny',
  WHISPER_BASE = 'whisper-base',
  WHISPER_SMALL = 'whisper-small',
  WHISPER_MEDIUM = 'whisper-medium',
  WHISPER_LARGE = 'whisper-large'
}
\`\`\`

## Language Support

The engine supports 150+ languages including major world languages and regional variants.

### Supported Languages (Sample)
- English (en-US, en-GB, en-AU, etc.)
- Spanish (es-ES, es-MX, es-AR, etc.)
- French (fr-FR, fr-CA, fr-BE, etc.)
- German (de-DE, de-AT, de-CH, etc.)
- Italian (it-IT)
- Portuguese (pt-PT, pt-BR)
- Chinese (zh-CN, zh-TW)
- Japanese (ja-JP)
- Korean (ko-KR)
- Arabic (ar-SA, ar-EG, etc.)

Plus 140+ additional languages for global coverage.

## Configuration Examples

### Speed-Optimized
\`\`\`typescript
const engine = new VoiceFlowPro({
  primaryEngine: ModelType.WEB_SPEECH_API,
  performancePreference: PerformancePreference.SPEED,
  qualityPreference: QualityLevel.GOOD
});
\`\`\`

### Accuracy-Optimized
\`\`\`typescript
const engine = new VoiceFlowPro({
  primaryEngine: ModelType.WHISPER_LARGE,
  offlineFirst: true,
  performancePreference: PerformancePreference.ACCURACY
});
\`\`\`

### Resource-Efficient
\`\`\`typescript
const engine = new VoiceFlowPro({
  primaryEngine: ModelType.WHISPER_TINY,
  cacheEnabled: true,
  performancePreference: PerformancePreference.RESOURCE_SAVING
});
\`\`\`

## Plugin System

### Custom Plugin Example
\`\`\`typescript
class NoiseReductionPlugin implements VoiceRecognitionPlugin {
  name = 'advanced-noise-reduction';
  version = '1.0.0';
  
  async initialize(): Promise<void> {
    console.log('Plugin initialized');
  }
  
  async processAudio(audioData: Float32Array): Promise<Float32Array> {
    // Apply noise reduction
    return this.applyNoiseReduction(audioData);
  }
  
  async cleanup(): Promise<void> {
    console.log('Plugin cleaned up');
  }
}

// Register plugin
await engine.registerPlugin(new NoiseReductionPlugin());
\`\`\`

## Browser Usage

### CDN Import
\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/voiceflow-voice-recognition-engine/dist/voiceflow-pro.umd.js"></script>
<script>
  const engine = new VoiceFlowPro.VoiceFlowPro();
  // Use engine...
</script>
\`\`\`

### Module Import
\`\`\`html
<script type="module">
  import { VoiceFlowPro } from 'https://cdn.jsdelivr.net/npm/voiceflow-voice-recognition-engine/dist/browser.js';
  
  const engine = new VoiceFlowPro();
  await engine.initialize();
  await engine.startListening();
</script>
\`\`\`

## Error Handling

\`\`\`typescript
engine.onError((error) => {
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
      alert('Selected language is not supported.');
      break;
  }
});
\`\`\`

## Performance Monitoring

\`\`\`typescript
// Get statistics
const stats = engine.getStatistics();
console.log('Total Recognitions:', stats.totalRecognitions);
console.log('Average Accuracy:', Math.round(stats.averageAccuracy * 100) + '%');

// Monitor performance
const metrics = engine.getPerformanceMetrics();
console.log('Average Response Time:', metrics.averageResponseTime + 'ms');
console.log('Success Rate:', Math.round(metrics.successRate * 100) + '%');
\`\`\`

## Best Practices

1. **Initialize Early**: Call initialize() on app startup
2. **Handle Permissions**: Request microphone permissions before starting
3. **Monitor Errors**: Always implement error handlers
4. **Resource Management**: Call dispose() when done
5. **Language Selection**: Set appropriate language for best accuracy
6. **Performance Tuning**: Choose engine based on use case requirements

## Troubleshooting

### Common Issues

**Microphone not detected:**
- Check browser permissions
- Ensure HTTPS in production
- Verify microphone hardware

**Poor recognition accuracy:**
- Check microphone quality
- Enable noise reduction
- Verify language setting
- Consider switching to Whisper for better accuracy

**High memory usage:**
- Use smaller Whisper models (Tiny/Base)
- Enable cache cleanup
- Monitor plugin usage

**Slow performance:**
- Switch to Web Speech API for speed
- Reduce audio quality settings
- Disable real-time processing

For more detailed documentation, visit our [GitHub repository](https://github.com/voiceflow-pro/voice-recognition-engine).
`;
  }

  async clean() {
    console.log('🧹 Cleaning build artifacts...');
    execSync('rm -rf dist', { stdio: 'inherit' });
    console.log('✅ Clean completed');
  }

  async examples() {
    console.log('📝 Building examples...');
    execSync('cp -r examples dist/', { stdio: 'inherit' });
    console.log('✅ Examples built');
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

const buildManager = new SimpleBuildManager();

switch (command) {
  case 'build':
    buildManager.build().catch(console.error);
    break;
  case 'clean':
    buildManager.clean().catch(console.error);
    break;
  case 'examples':
    buildManager.examples().catch(console.error);
    break;
  default:
    console.log(`
VoiceFlow Pro Voice Recognition Engine - Build Manager

Commands:
  build     - Build the project
  clean     - Clean build artifacts
  examples  - Build examples

Usage:
  node scripts/build.js build      # Build the project
  node scripts/build.js clean      # Clean artifacts
  node scripts/build.js examples   # Build examples
    `);
}

module.exports = { SimpleBuildManager };