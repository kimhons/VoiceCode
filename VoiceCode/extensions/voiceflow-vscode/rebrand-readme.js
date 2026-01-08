const fs = require('fs');

// Read README.md
let content = fs.readFileSync('README.md', 'utf8');

// Perform all replacements
content = content
  .replace(/VoiceFlow PRO/g, 'VoiceCode')
  .replace(/VoiceFlow/g, 'VoiceCode')
  .replace(/voiceflowpro\.voiceflow-vscode/g, 'voicecode.voicecode-vscode')
  .replace(/voiceflowpro/g, 'voicecode')
  .replace(/github\.com\/kimhons\/VoiceCode/g, 'github.com/kimhons/VoiceCode')
  .replace(/@voiceflow/g, '@voicecode')
  .replace(/Hey VoiceFlow/g, 'Hey VoiceCode')
  .replace(/command:voiceflow\./g, 'command:voicecode.');

// Write back
fs.writeFileSync('README.md', content);

console.log('✅ README.md rebranded successfully!');
