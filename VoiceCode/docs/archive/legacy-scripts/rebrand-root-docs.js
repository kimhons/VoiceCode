const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Root Documentation Rebranding...\n');

// Root-level documentation files to rebrand
const files = [
  'IMPLEMENTATION_ROADMAP.md',
  'EXECUTIVE_SUMMARY.md',
  'COMPREHENSIVE_COMPETITIVE_ANALYSIS.md',
  'DIRECTORY_STRUCTURE_ANALYSIS.md',
  'DIRECTORY_STRUCTURE_FINAL_ANALYSIS.md',
  'CRITICAL_IMPLEMENTATION_TICKETS.md',
  'CRITICAL_TECHNICAL_DEBT_FIXES.md',
  'CROSS_PLATFORM_OPTIMIZATION_SUMMARY.md',
  'FINAL_EXECUTION_SUMMARY.md',
  'IMMEDIATE_ACTION_PLAN.md',
  'IMPLEMENTATION_CHECKLIST.md',
  'IMPLEMENTATION_REVIEW_README.md',
  'IMPLEMENTATION_SUMMARY.md',
  'IMPLEMENTATION_TASK_LIST.md',
  'INDEX_IMPLEMENTATION_DOCS.md',
  'INVESTIGATION_REPORT.md',
  'PAYMENT_INTEGRATION_GUIDE.md',
  'PAYMENT_INTEGRATION_GUIDE_PART2.md',
  'PLATFORM_DETAILED_ANALYSIS.md',
  'PLATFORM_IMPLEMENTATION_REVIEW.md',
  'QUICK_IMPLEMENTATION_GUIDE.md',
  'README_CRITICAL_GAPS.md',
  'TASK_COMPLETION_REPORT.md',
  'TELEMETRY_IMPLEMENTATION.md',
  'UPGRADE_SUMMARY.md',
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

console.log(`\n✨ Root documentation rebranding complete!`);
console.log(`📊 Files modified: ${filesModified}/${files.length}`);
console.log(`📊 Total replacements: ${totalChanges}`);
console.log(`\n📋 Next steps:`);
console.log(`   1. Review the changes in each file`);
console.log(`   2. Update nested monorepo documentation`);
console.log(`   3. Rename directories`);
console.log(`   4. Update GitHub repository name`);
console.log(`   5. Final verification`);

