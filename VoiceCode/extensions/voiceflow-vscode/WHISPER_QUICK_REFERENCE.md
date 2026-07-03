# Whisper Model Manager - Quick Reference

## 🚀 Quick Start

```typescript
import { WhisperModelManager } from './services/WhisperModelManager';

// Get singleton instance
const manager = WhisperModelManager.getInstance();

// Load model
const model = await manager.loadModel('whisper-base');

// Use model
const result = await model(audioData);
```

## 📚 API Reference

### getInstance()
Get the singleton instance of WhisperModelManager.

```typescript
const manager = WhisperModelManager.getInstance();
```

### loadModel(modelId, progressCallback?)
Load a Whisper model with optional progress tracking.

```typescript
const model = await manager.loadModel('whisper-base', (progress, message) => {
  console.log(`${progress}%: ${message}`);
});
```

**Parameters**:
- `modelId`: `'whisper-tiny' | 'whisper-base' | 'whisper-small' | 'whisper-medium'`
- `progressCallback`: `(progress: number, message: string) => void` (optional)

**Returns**: Promise<any> - Loaded Whisper model

### preloadModel(modelId)
Preload a model in the background (non-blocking).

```typescript
manager.preloadModel('whisper-base'); // Don't await
```

### unloadModel()
Unload the current model to free memory.

```typescript
manager.unloadModel();
```

### clearCache()
Clear all cached models from IndexedDB.

```typescript
await manager.clearCache();
```

### getCacheInfo()
Get information about cached models.

```typescript
const info = await manager.getCacheInfo();
console.log(`Cached: ${info.models.join(', ')}`);
```

**Returns**: `Promise<{ count: number; models: string[] }>`

### dispose()
Cleanup and close IndexedDB connection.

```typescript
manager.dispose();
```

## 🎯 Common Patterns

### Pattern 1: Basic Usage
```typescript
const manager = WhisperModelManager.getInstance();
const model = await manager.loadModel('whisper-base');
const result = await model(audioData);
```

### Pattern 2: With Progress
```typescript
const manager = WhisperModelManager.getInstance();
const model = await manager.loadModel('whisper-base', (progress, message) => {
  vscode.window.showInformationMessage(`${message} (${progress}%)`);
});
```

### Pattern 3: Background Preloading
```typescript
// In extension activation
const manager = WhisperModelManager.getInstance();
manager.preloadModel('whisper-base'); // Non-blocking

// Later, when needed
const model = await manager.loadModel('whisper-base'); // Instant!
```

### Pattern 4: Cache Management
```typescript
const manager = WhisperModelManager.getInstance();

// Check cache
const info = await manager.getCacheInfo();
if (info.count > 0) {
  console.log(`Using cached model: ${info.models[0]}`);
}

// Clear if needed
if (needsClear) {
  await manager.clearCache();
}
```

### Pattern 5: Memory Management
```typescript
const manager = WhisperModelManager.getInstance();

// Load and use
const model = await manager.loadModel('whisper-base');
await model(audioData);

// Unload when done
manager.unloadModel();
```

## 🔧 Integration with VoiceRecognitionService

### Step 1: Import
```typescript
import { WhisperModelManager } from './WhisperModelManager';
```

### Step 2: Add Property
```typescript
private modelManager: WhisperModelManager;
```

### Step 3: Initialize in Constructor
```typescript
constructor(config, context) {
  // ... existing code ...
  this.modelManager = WhisperModelManager.getInstance();
  this.preloadModel(); // Background preload
}
```

### Step 4: Add Preload Method
```typescript
private async preloadModel(): Promise<void> {
  try {
    if (this.sttEngine.startsWith('whisper')) {
      await this.modelManager.preloadModel(this.sttEngine);
    }
  } catch (error) {
    console.error('Preload failed:', error);
  }
}
```

### Step 5: Update initializeWhisper
```typescript
private async initializeWhisper(): Promise<void> {
  this.whisper = await this.modelManager.loadModel(
    this.sttEngine,
    (progress, message) => {
      console.log(`${progress}%: ${message}`);
    }
  );
}
```

### Step 6: Update Dispose
```typescript
dispose(): void {
  this.modelManager.unloadModel();
}
```

## ⚡ Performance Tips

1. **Preload Early**: Call `preloadModel()` during extension activation
2. **Reuse Models**: Don't reload the same model multiple times
3. **Choose Right Size**: Use `whisper-tiny` for speed, `whisper-base` for balance
4. **Unload When Done**: Call `unloadModel()` to free memory
5. **Monitor Cache**: Use `getCacheInfo()` to track cached models

## 🐛 Troubleshooting

### Model not caching?
```typescript
// Check cache
const info = await manager.getCacheInfo();
console.log('Cache:', info);

// Clear and retry
await manager.clearCache();
const model = await manager.loadModel('whisper-base');
```

### Memory issues?
```typescript
// Use smaller model
const model = await manager.loadModel('whisper-tiny');

// Or unload when not in use
manager.unloadModel();
```

### Slow loads?
```typescript
// Preload in background
manager.preloadModel('whisper-base');

// Later loads will be instant
```

## 📊 Model Comparison

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| whisper-tiny | 40MB | ⚡⚡⚡ | ⭐⭐⭐ | Quick commands |
| whisper-base | 75MB | ⚡⚡ | ⭐⭐⭐⭐ | **Recommended** |
| whisper-small | 150MB | ⚡ | ⭐⭐⭐⭐⭐ | High accuracy |
| whisper-medium | 300MB | 🐌 | ⭐⭐⭐⭐⭐⭐ | Professional |

## 🧪 Testing

### Unit Tests
```bash
npm test -- WhisperModelManager.test.ts
```

### Benchmarks
```bash
npm run benchmark
```

### Manual Test
```typescript
const manager = WhisperModelManager.getInstance();

// First load (should take 3-5s)
console.time('First Load');
await manager.loadModel('whisper-base');
console.timeEnd('First Load');

// Second load (should be < 100ms)
manager.unloadModel();
console.time('Second Load');
await manager.loadModel('whisper-base');
console.timeEnd('Second Load');
```

## 📖 Further Reading

- **Detailed Docs**: `WHISPER_OPTIMIZATION_README.md`
- **Migration Guide**: `WHISPER_MIGRATION_GUIDE.md`
- **Summary**: `WHISPER_OPTIMIZATION_SUMMARY.md`
- **Example**: `VoiceRecognitionService.INTEGRATION_EXAMPLE.ts`

## 💡 Pro Tips

1. Always use the singleton pattern
2. Preload models in the background
3. Handle errors gracefully
4. Report progress to users
5. Clean up when done
6. Monitor cache size
7. Choose the right model for your use case

---

**Quick Links**:
- [Full Documentation](./WHISPER_OPTIMIZATION_README.md)
- [Migration Guide](./WHISPER_MIGRATION_GUIDE.md)
- [Integration Example](./src/services/VoiceRecognitionService.INTEGRATION_EXAMPLE.ts)

