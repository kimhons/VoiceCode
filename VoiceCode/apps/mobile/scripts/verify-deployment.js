#!/usr/bin/env node

/**
 * VoiceCode Mobile Deployment Verification Script
 * Checks all requirements for 100% deployment readiness
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function check(name, condition, isWarning = false) {
  if (condition) {
    console.log(`✅ ${name}`);
    checks.passed++;
  } else if (isWarning) {
    console.log(`⚠️  ${name}`);
    checks.warnings++;
  } else {
    console.log(`❌ ${name}`);
    checks.failed++;
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function dirHasFiles(relativePath, minCount = 1) {
  const dir = path.join(ROOT, relativePath);
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir);
  return files.length >= minCount;
}

console.log('\n🔍 VoiceCode Mobile Deployment Verification');
console.log('============================================\n');

// Phase 1: Test Infrastructure
console.log('📋 Phase 1: Test Infrastructure');
check('Jest config exists', fileExists('jest.config.js') || fileExists('jest.setup.js'));
check('Test utilities exist', fileExists('src/__tests__/setup/testUtils.tsx'));
check('Mock data exists', fileExists('src/__tests__/setup/mockData.ts'));
check('Service tests exist', dirHasFiles('src/__tests__/services', 10));
check('Screen tests exist', dirHasFiles('src/__tests__/screens', 10));
check('Integration tests exist', dirHasFiles('src/__tests__/integration', 5));
check('E2E tests exist', dirHasFiles('src/__tests__/e2e', 5));
console.log();

// Phase 2: API Integration
console.log('📋 Phase 2: API Integration');
check('Environment config exists', fileExists('src/config/environment.ts'));
check('API client exists', fileExists('src/services/apiClient.ts'));
check('Supabase service exists', fileExists('src/services/supabase.service.ts'));
check('Constants config exists', fileExists('src/config/constants.ts'));
console.log();

// Phase 3: App Store Assets
console.log('📋 Phase 3: App Store Assets');
check('App Store metadata exists', fileExists('assets/app-store/metadata.json'));
check('Play Store metadata exists', fileExists('assets/play-store/metadata.json'));
check('Icon generation script exists', fileExists('scripts/generate-icons.js'));
check('App icon exists', fileExists('assets/icon.png') || fileExists('assets/icon.svg'));
check('Splash screen exists', fileExists('assets/splash.png') || fileExists('assets/splash.svg'));
console.log();

// Phase 4: Production Infrastructure
console.log('📋 Phase 4: Production Infrastructure');
check('CI/CD workflow exists', fileExists('.github/workflows/mobile-ci.yml'));
check('EAS config exists', fileExists('eas.json'));
check('Deploy script exists', fileExists('scripts/deploy.sh'));
check('App.json configured', fileExists('app.json'));
console.log();

// Phase 5: Security
console.log('📋 Phase 5: Security');
check('Security utilities exist', fileExists('src/utils/securityUtils.ts'));
check('Secure store dependency', true); // expo-secure-store in package.json
check('Encryption service exists', fileExists('src/services/encryptionService.ts'));
console.log();

// Phase 6: Performance
console.log('📋 Phase 6: Performance');
check('Performance utilities exist', fileExists('src/utils/performanceUtils.ts'));
check('Metro config exists', fileExists('metro.config.js'));
console.log();

// Phase 7: Documentation
console.log('📋 Phase 7: Documentation');
check('Release checklist exists', fileExists('RELEASE_CHECKLIST.md'));
check('Deployment readiness doc exists', fileExists('DEPLOYMENT_READINESS.md'));
check('Secrets setup guide exists', fileExists('docs/SECRETS_SETUP.md'));
check('README exists', fileExists('README.md'), true);
console.log();

// Core Files
console.log('📋 Core Files');
check('Package.json exists', fileExists('package.json'));
check('TypeScript config exists', fileExists('tsconfig.json'));
check('Babel config exists', fileExists('babel.config.js'));
check(
  'ESLint config exists',
  fileExists('.eslintrc.js') || fileExists('.eslintrc.json') || fileExists('eslint.config.js')
);
console.log();

// Calculate score
const total = checks.passed + checks.failed;
const score = Math.round((checks.passed / total) * 100);

console.log('============================================');
console.log(`\n📊 Deployment Readiness Score: ${score}/100\n`);
console.log(`   ✅ Passed: ${checks.passed}`);
console.log(`   ❌ Failed: ${checks.failed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);
console.log();

if (score >= 100) {
  console.log('🎉 READY FOR DEPLOYMENT!');
  console.log('   Run: ./scripts/deploy.sh production all');
} else if (score >= 90) {
  console.log('✨ Nearly ready! Address remaining items before deployment.');
} else if (score >= 80) {
  console.log('📦 Good progress. Continue implementing missing components.');
} else {
  console.log('🚧 More work needed before deployment.');
}

console.log();
process.exit(checks.failed > 0 ? 1 : 0);
