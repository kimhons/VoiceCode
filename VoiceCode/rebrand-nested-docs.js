const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Nested Monorepo Documentation Rebranding...\n');

// Nested monorepo documentation files to rebrand
const files = [
  'REBRANDING_SUMMARY.md',
  'REBRANDING_STATUS_REPORT.md',
  'EXTERNAL_REPO_ANALYSIS_AND_REBRANDING.md',
  'IMPROVEMENT_SUMMARY.md',
  'INTEGRATED_ACTION_PLAN.md',
  'IMPLEMENTATION_ROADMAP.md',
  'EXECUTIVE_SUMMARY.md',
  'COMPREHENSIVE_COMPETITIVE_ANALYSIS.md',
];

// Replacement patterns
const replacements = [
  // Brand names
  { from: /VoiceFlow PRO/g, to: 'VoiceCode' },
  { from: /VoiceFlow Pro/g, to: 'VoiceCode' },
  { from: /VoiceFlow/g, to: 'VoiceCode' },

  // Directory paths
  { from: /VoiceFlow-PRO\\VoiceFlow-PRO/g, to: 'VoiceCode\\VoiceCode' },
  { from: /VoiceFlow-PRO\/VoiceFlow-PRO/g, to: 'VoiceCode/VoiceCode' },
  { from: /VoiceFlow-PRO\\/g, to: 'VoiceCode\\' },
  { from: /VoiceFlow-PRO\//g, to: 'VoiceCode/' },
  { from: /VoiceFlow-PRO/g, to: 'VoiceCode' },

  // Package names
  { from: /voiceflow-vscode/g, to: 'voicecode-vscode' },
  { from: /voiceflow-pro-desktop/g, to: 'voicecode-desktop' },
  { from: /voiceflow-pro-ui/g, to: 'voicecode-ui' },
  { from: /voiceflow-mobile/g, to: 'voicecode-mobile' },
  { from: /voiceflowpro/g, to: 'voicecode' },

  // URLs
  { from: /github\.com\/kimhons\/VoiceFlow-PRO/g, to: 'github.com/kimhons/VoiceCode' },
  { from: /voiceflowpro\.com/g, to: 'voicecode.app' },

  // Directory names
  { from: /VoiceFlowMobile/g, to: 'VoiceCodeMobile' },

  // Wake words
  { from: /Hey VoiceFlow/g, to: 'Hey VoiceCode' },
];

let totalChanges = 0;
let filesModified = 0;

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
    filesModified++;
  } else {
    console.log(`   ℹ️  No changes needed`);
  }
});

console.log(`\n✨ Nested monorepo documentation rebranding complete!`);
console.log(`📊 Files modified: ${filesModified}/${files.length}`);
console.log(`📊 Total replacements: ${totalChanges}`);

