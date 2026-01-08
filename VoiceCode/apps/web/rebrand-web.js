const fs = require('fs');
const path = require('path');

console.log('🚀 Starting VoiceCode Web App Rebranding...\n');

// Files to rebrand
const files = [
  'package.json',
  'index.html',
  'public/manifest.json',
  'README.md',
];

// Replacement patterns
const replacements = [
  // Brand names
  { from: /VoiceFlow Pro/g, to: 'VoiceCode' },
  { from: /VoiceFlow PRO/g, to: 'VoiceCode' },
  { from: /VoiceFlow/g, to: 'VoiceCode' },

  // Package/slug names
  { from: /voiceflow-pro-ui/g, to: 'voicecode-ui' },
  { from: /voiceflow-pro/g, to: 'voicecode' },
  { from: /voiceflowpro/g, to: 'voicecode' },

  // URLs and domains
  { from: /voiceflowpro\.com/g, to: 'voicecode.app' },
  { from: /https:\/\/voiceflowpro\.com/g, to: 'https://voicecode.app' },

  // Bundle identifiers
  { from: /com\.voiceflowpro\.app/g, to: 'com.voicecode.app' },

  // Twitter handles
  { from: /@voiceflowpro/g, to: '@voicecode' },

  // App store URLs
  { from: /voiceflow-pro\/id/g, to: 'voicecode/id' },

  // Descriptions
  {
    from: /Cross-platform React\/TypeScript UI component library for voice recording applications/g,
    to: 'VoiceCode - Transcription Pro & Voice Coding Assistant - Web Application',
  },
  {
    from: /Unlimited voice transcription for \$7\.99\/month\. 150\+ languages, offline mode, AI-powered features\./g,
    to: 'Professional voice transcription and coding assistant with AI-powered features.',
  },
  {
    from: /Unlimited voice transcription for \$7\.99\/month\. 50-75% cheaper than Otter\.ai, Rev\.com, Descript\. 150\+ languages, offline mode, HIPAA-compliant\. Try free for 14 days!/g,
    to: 'Professional voice transcription and AI coding assistant. Multi-language support, offline mode, and advanced features.',
  },
  {
    from: /Unlimited Voice Transcription for \$7\.99\/Month/g,
    to: 'Professional Voice Transcription & Coding Assistant',
  },
  {
    from: /Otter\.ai Alternative/g, to: 'AI-Powered Transcription',
  },
  {
    from: /Stop overpaying for transcription\. Get unlimited minutes, 150\+ languages, and AI-powered features for 50-75% less than competitors\. HIPAA-compliant, offline mode, 14-day free trial\./g,
    to: 'Professional voice transcription with AI-powered coding assistance. Multi-language support, offline mode, and advanced features.',
  },
  {
    from: /Stop overpaying for transcription\. Get unlimited minutes, 150\+ languages, and AI-powered features for 50-75% less than competitors\./g,
    to: 'Professional voice transcription with AI-powered coding assistance and multi-language support.',
  },
];

let totalChanges = 0;

files.forEach((file) => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${file} (not found)`);
    return;
  }

  console.log(`📝 Processing ${file}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      fileChanges += matches.length;
      content = content.replace(from, to);
    }
  });

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ ${fileChanges} replacements made`);
    totalChanges += fileChanges;
  } else {
    console.log(`   ℹ️  No changes needed`);
  }
});

console.log(`\n✨ Rebranding complete!`);
console.log(`📊 Total replacements: ${totalChanges}`);
console.log(`\n📋 Next steps:`);
console.log(`   1. Review the changes in each file`);
console.log(`   2. Update app icons and images`);
console.log(`   3. Test the app: npm run dev`);
console.log(`   4. Build for production: npm run build`);

