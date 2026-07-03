const fs = require('fs');
const path = require('path');

console.log('🚀 Starting VoiceCode Desktop App Rebranding...\n');

// Files to rebrand
const files = [
  'package.json',
  'src-tauri/Cargo.toml',
  'src-tauri/tauri.conf.json',
];

// Replacement patterns
const replacements = [
  // Brand names
  { from: /VoiceFlow Pro/g, to: 'VoiceCode' },
  { from: /VoiceFlow PRO/g, to: 'VoiceCode' },
  { from: /VoiceFlow/g, to: 'VoiceCode' },

  // Package/slug names
  { from: /voiceflow-pro-desktop/g, to: 'voicecode-desktop' },
  { from: /voiceflow-pro/g, to: 'voicecode' },
  { from: /voiceflow\.pro/g, to: 'voicecode.app' },

  // Bundle identifiers
  { from: /com\.voiceflow\.pro/g, to: 'com.voicecode.app' },

  // Team/Author names
  { from: /VoiceFlow Team/g, to: 'VoiceCode Team' },

  // Repository URLs
  { from: /VoiceFlow-PRO/g, to: 'VoiceCode' },

  // Update endpoints
  { from: /releases\.voiceflow\.pro/g, to: 'releases.voicecode.app' },

  // Descriptions
  {
    from: /Professional Voice Recognition Desktop Application/g,
    to: 'Professional Voice Transcription & AI Coding Assistant - Desktop Application',
  },
  {
    from: /VoiceFlow Pro is a professional voice recognition and transcription application that enables hands-free coding and document creation\./g,
    to: 'VoiceCode is a professional voice transcription and AI coding assistant that enables hands-free development and productivity.',
  },
  {
    from: /Professional Voice Recognition & Transcription/g,
    to: 'Voice Transcription & AI Coding Assistant',
  },

  // Copyright
  { from: /© 2024 VoiceFlow Pro/g, to: '© 2024 VoiceCode' },
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
console.log(`   2. Update app icons if needed`);
console.log(`   3. Test the app: npm run tauri:dev`);
console.log(`   4. Build for production: npm run tauri:build`);

