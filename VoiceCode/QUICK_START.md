# VoiceCode Monorepo - Quick Start Guide

**Welcome to the VoiceCode unified platform!** 🎉

This monorepo contains all VoiceCode applications and shared packages in one place.

---

## 📁 Project Structure

```
VoiceCode/
├── apps/
│   ├── desktop/        # Tauri desktop app (Windows, macOS, Linux)
│   ├── web/            # React web app (Vite + React)
│   ├── mobile/         # Expo mobile app (iOS + Android)
│   ├── api/            # Express API server
│   └── vscode-extension/  # VS Code extension
├── packages/
│   └── shared/         # Shared code (types, UI, utils)
├── package.json        # Root package.json
├── turbo.json          # Turborepo configuration
└── pnpm-workspace.yaml # pnpm workspace configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (or **pnpm** >= 8.0.0)
- **Rust** (for desktop app) - [Install Rust](https://rustup.rs/)
- **Expo CLI** (for mobile app) - `npm install -g expo-cli`

### 1. Install Dependencies

```bash
# Using npm (recommended for this monorepo)
npm install

# Or using pnpm
pnpm install
```

This will install dependencies for all apps and packages in the monorepo.

---

## 🖥️ Desktop App (Tauri)

### Run Development Server

```bash
npm run desktop:dev
```

### Build for Production

```bash
npm run desktop:build
```

### Features

- ✅ Global dictation with floating button
- ✅ AIML API integration for transcription
- ✅ Advanced AI features panel
- ✅ Audio processing and enhancement
- ✅ Encryption and security
- ✅ Cloud sync and collaboration
- ✅ Professional vocabularies
- ✅ Video transcription
- ✅ Live streaming support

### Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Rust (Tauri)
- **AI/ML:** AIML API integration
- **Database:** Supabase

---

## 🌐 Web App (React)

### Run Development Server

```bash
npm run web:dev
```

### Build for Production

```bash
npm run web:build
```

### Run E2E Tests

```bash
cd apps/web
npm run test:e2e
```

### Features

- ✅ Modern dashboard
- ✅ Voice recording and transcription
- ✅ WebSocket streaming
- ✅ Stripe payments integration
- ✅ Landing page, pricing, blog
- ✅ Help center
- ✅ PWA support with offline mode

### Tech Stack

- **Framework:** React + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase
- **Payments:** Stripe
- **Testing:** Playwright (E2E), Vitest (Unit)
- **Deployment:** Vercel

---

## 📱 Mobile App (Expo)

### Run Development Server

```bash
npm run mobile:start
```

### Run on Android

```bash
npm run mobile:android
```

### Run on iOS

```bash
npm run mobile:ios
```

### Features

- ✅ Voice recording and transcription
- ✅ Audio playback
- ✅ User authentication
- ✅ Cloud sync
- ✅ Offline support
- ✅ Push notifications

### Tech Stack

- **Framework:** Expo + React Native
- **Language:** TypeScript
- **Navigation:** React Navigation
- **State:** Redux Toolkit
- **Backend:** Supabase

---

## 🔌 API Server (Express)

### Run Development Server

```bash
npm run api:dev
```

### Build for Production

```bash
npm run api:build
```

### Features

- ✅ RESTful API endpoints
- ✅ Email notifications
- ✅ CORS support
- ✅ Environment configuration

### Tech Stack

- **Framework:** Express + TypeScript
- **Email:** Nodemailer
- **Environment:** dotenv

---

## 🔧 Shared Packages

Located in `packages/shared/`:

- **types/** - Shared TypeScript types and interfaces
- **ui/** - Shared UI components
- **utils/** - Shared utility functions

### Using Shared Packages

```typescript
// Import shared types
import { UserType, TranscriptType } from '@voicecode/shared/types';

// Import shared UI components
import { Button, Card } from '@voicecode/shared/ui';

// Import shared utilities
import { formatDate, validateEmail } from '@voicecode/shared/utils';
```

---

## 🛠️ Development Commands

### Run All Apps in Development Mode

```bash
npm run dev
```

### Build All Apps

```bash
npm run build
```

### Run All Tests

```bash
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Lint All Code

```bash
npm run lint
```

### Fix Linting Issues

```bash
npm run lint:fix
```

### Type Check All Code

```bash
npm run type-check
```

---

## 📝 Environment Variables

Each app requires its own `.env` file:

### Desktop App (`apps/desktop/.env`)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AIML_API_KEY=your_aiml_api_key
```

### Web App (`apps/web/.env`)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### Mobile App (`apps/mobile/.env`)

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### API Server (`apps/api/.env`)

```env
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

---

## 🎯 Next Steps

1. **Set up environment variables** for each app
2. **Install dependencies** with `npm install`
3. **Run the app you want to work on** (desktop, web, or mobile)
4. **Read the app-specific documentation** in each app's directory
5. **Start building!** 🚀

---

## 📚 Additional Resources

- **Desktop App Documentation:** `apps/desktop/README.md`
- **Web App Documentation:** `apps/web/README.md`
- **Mobile App Documentation:** `apps/mobile/README.md`
- **API Documentation:** `apps/api/README.md`
- **Integration Report:** `INTEGRATION_COMPLETE.md`
- **Integration Plan:** `VOICEFLOW_PRO_INTEGRATION_PLAN.md`

---

## 🆘 Need Help?

- Check the `README.md` in each app directory
- Review the integration documentation
- Check the backup at `VoiceCode_Backup_20260103_211606/`

---

**Happy Coding!** 🎉

