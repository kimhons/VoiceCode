# VoiceCode - AI Coding Agent Instructions

VoiceCode is a **multi-platform voice-first coding assistant** with web, desktop (Tauri), mobile (Expo/React Native), and VSCode extension components. The project emphasizes accessibility, voice recognition, and AI-powered code assistance.

## Project Architecture

### Monorepo Structure
```
VoiceCode/
├── apps/
│   ├── web/          # React + Vite web app (primary platform)
│   ├── desktop/      # Tauri desktop app
│   ├── mobile/       # Expo/React Native mobile app (separate VoiceCodeMobile/)
│   └── api/          # Express API server (alerts/notifications)
├── extensions/
│   └── voiceflow-vscode/  # VSCode extension for voice-powered coding
├── packages/         # Shared packages (currently empty placeholders)
├── services/         # Backend services (voice-engine, ai-processor - mostly empty)
├── supabase/         # Supabase database configuration
└── docs/             # Comprehensive documentation
```

**Note**: This is NOT a monorepo with workspace tooling (no turbo.json, pnpm-workspace.yaml). Each app manages dependencies independently with npm.

### Key Components

**Web App** ([apps/web](VoiceCode/apps/web))
- Vite + React + TypeScript
- Radix UI components with Tailwind CSS
- Path alias: `@/` → `./src/`
- Supabase integration for auth/database
- AIML API for voice transcription
- Performance optimized: 87.8% bundle size reduction via lazy loading

**VSCode Extension** ([extensions/voiceflow-vscode](VoiceCode/extensions/voiceflow-vscode))
- Voice-first IDE control with Whisper.js local processing
- Multi-AI orchestration (Copilot, Cursor, Cline, Aider, Augment)
- Path aliases: `@/`, `@services/`, `@providers/`, `@types/`, `@controllers/`, `@managers/`, `@ui/`
- 50+ built-in voice commands for file ops, navigation, Git
- Context gathering: 3-tier (minimal ~10ms, medium ~100ms, deep ~200ms)

**Desktop App** ([apps/desktop](VoiceCode/apps/desktop))
- Tauri 1.6 + Vite + React
- Cross-platform (Windows/macOS/Linux)

**Mobile App** (VoiceCodeMobile/ - separate root directory)
- Expo SDK 52 + React Native 0.76.6
- React Navigation + Redux Toolkit
- EAS Build for iOS/Android

## Development Workflows

### Build & Run Commands

**Web App**:
```bash
cd VoiceCode/apps/web
npm install
npm run dev                    # Development server
npm run build                  # Production build
npm run build:staging          # Staging build
npm run preview                # Preview production build
```

**Desktop App**:
```bash
cd VoiceCode/apps/desktop
npm install
npm run tauri:dev              # Development with hot reload
npm run tauri:build            # Production build
```

**Mobile App**:
```bash
cd VoiceCodeMobile
npm install
npx expo start                 # Development server
eas build --platform ios       # iOS build
eas build --platform android   # Android build
```

**VSCode Extension**:
```bash
cd VoiceCode/extensions/voiceflow-vscode
npm install
npm run compile                # TypeScript compilation
code --extensionDevelopmentHost=. # Test in Extension Host
```

### Testing Strategy

**Web App** - Vitest + Playwright:
- Unit tests: `npm run test` (Vitest with jsdom, 80% coverage threshold)
- E2E tests: `npm run test:e2e` (Playwright for smoke tests)
- Test files: `src/**/*.{test,spec}.{ts,tsx}`
- Setup: [src/test/setup.ts](VoiceCode/apps/web/src/test/setup.ts) - mocks ResizeObserver, IntersectionObserver, matchMedia

**VSCode Extension** - Vitest:
- Unit tests with mocked VSCode API
- Example: [WhisperModelManager.test.ts](VoiceCode/extensions/voiceflow-vscode/src/services/WhisperModelManager.test.ts)

**API Server** - Jest:
- Node.js testing with ts-jest
- Test coverage reporting to `test-results/junit.xml`

## Project-Specific Conventions

### Environment Variables
All web app env vars use `VITE_` prefix (Vite convention):
- `VITE_AIML_API_KEY` - AIML API for voice transcription
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` - Database/auth
- `VITE_STRIPE_PUBLISHABLE_KEY` - Payment integration
- `VITE_ENABLE_E2E_AUTH_BYPASS` - **NEVER true in production**

See [apps/web/.env.example](VoiceCode/apps/web/.env.example) for complete list.

### Import Path Aliases
- **Web**: `@/` → `src/` (e.g., `import { Button } from '@/components/ui/button'`)
- **VSCode Extension**: 
  - `@/` → `src/`
  - `@services/` → `src/services/`
  - `@providers/` → `src/providers/`
  - `@types/` → `src/types/`

### Component Patterns
**Lazy Loading** (Web App):
```typescript
// Use for heavy components to optimize bundle size
import { createLazyComponent } from '@/utils/lazyComponent';
const LazyVoiceRecording = createLazyComponent(
  () => import('@/components/VoiceRecording')
);
```

**Accessibility-First**:
- All interactive elements need `aria-label`, `role`, proper keyboard navigation
- Support WCAG 2.1 AA compliance
- Use `data-testid` attributes for E2E tests

**Theme Context**:
```typescript
import { useTheme } from '@/contexts/ThemeContext';
const { theme, setTheme, platform, colors } = useTheme();
// platform: 'mac' | 'windows' | 'linux' | 'web'
```

### Code Style
- TypeScript strict mode enabled
- Prefer function components with hooks over class components
- Use Radix UI primitives for UI components
- Tailwind classes with `clsx` for conditional styling
- React 18.3+ with concurrent features

## Critical Integration Points

### Supabase (Database/Auth)
- Client initialized in web app services layer
- Used for: user profiles, transcription storage, settings sync
- Real-time sync with conflict resolution (last-write-wins)

### AIML API (Voice Transcription)
- Primary cloud transcription service
- WebSocket streaming: `VITE_AIML_WS_URL`
- Fallback when Whisper.js unavailable

### Whisper.js (VSCode Extension)
- Local AI processing for privacy-first transcription
- Models: tiny, base, small, medium
- Model caching via IndexedDB
- See [WhisperModelManager](VoiceCode/extensions/voiceflow-vscode/src/services/WhisperModelManager.ts)

### Build Optimizations
**Vite Configuration** ([apps/web/vite.config.ts](VoiceCode/apps/web/vite.config.ts)):
- Manual chunk splitting: `react-vendor`, `ui-vendor`, `form-vendor`, etc.
- Production: minify with terser, drop console/debugger
- Dev: HMR with overlay, API proxy to `localhost:3001`

## Common Gotchas

1. **No monorepo tooling**: Don't look for `turbo.json` or workspace configs. Run npm commands in individual app directories.

2. **Mobile app location**: VoiceCodeMobile is a **separate root directory**, not under VoiceCode/apps/mobile.

3. **Empty packages/services**: The `packages/` and `services/` directories are placeholders. Don't reference shared code from there.

4. **Build mode detection**: Web app uses `BUILD_MODE` env var, not `NODE_ENV`. Set `BUILD_MODE=prod` for production builds.

5. **Path resolution**: Desktop/Mobile apps may not have path aliases configured. Use relative imports there.

6. **VSCode Extension testing**: Must run in Extension Development Host, not regular VSCode instance.

## Documentation Locations

- [Web App README](VoiceCode/apps/web/README.md) - Component API, accessibility features, performance metrics
- [VSCode Extension README](VoiceCode/extensions/voiceflow-vscode/README.md) - Voice commands, AI integration, configuration
- [Developer Guide](VoiceCode/docs/developer-guide/README.md) - Architecture, testing, component development
- [Deployment Guide](VoiceCode/apps/web/DEPLOYMENT.md) - Environment config, Vercel setup, CI/CD
- [Testing & CI/CD](VoiceCode/docs/TESTING_AND_CICD.md) - Testing strategy, coverage targets

## Quick Start for New Features

1. **Identify target platform**: Web, Desktop, Mobile, or VSCode Extension
2. **Navigate to app directory**: `cd VoiceCode/apps/web` (or relevant path)
3. **Install dependencies**: `npm install`
4. **Check existing components**: Browse `src/components/` for reusable patterns
5. **Follow conventions**: Use TypeScript, path aliases, accessibility attributes
6. **Add tests**: Write unit tests alongside feature code
7. **Run locally**: Use platform-specific dev command from above
