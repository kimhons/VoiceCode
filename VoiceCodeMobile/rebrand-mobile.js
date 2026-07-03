const fs = require('fs');
const path = require('path');

console.log('🚀 Starting VoiceCode Mobile App Rebranding...\n');

// Files to rebrand
const files = ['package.json', 'app.json', 'App.tsx'];

// Replacement patterns
const replacements = [
  // Brand names
  { from: /VoiceFlow Pro/g, to: 'VoiceCode' },
  { from: /VoiceFlow PRO/g, to: 'VoiceCode' },
  { from: /VoiceFlow/g, to: 'VoiceCode' },

  // Package/slug names
  { from: /voiceflow-pro/g, to: 'voicecode' },
  { from: /voiceflow-mobile/g, to: 'voicecode-mobile' },
  { from: /voiceflowpro/g, to: 'voicecode' },

  // Bundle identifiers
  { from: /com\.voiceflowpro\.app/g, to: 'com.voicecode.app' },

  // URLs and project IDs
  { from: /voiceflow-pro-mobile/g, to: 'voicecode-mobile' },

  // Descriptions
  {
    from: /Professional Voice Recording & Transcription Mobile App/g,
    to: 'Transcription Pro & Voice Coding Assistant - Mobile App',
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
console.log(`   2. Rename directory: VoiceFlowMobile → VoiceCodeMobile`);
console.log(`   3. Update app icons in assets/ folder`);
console.log(`   4. Test the app: npm start`);
