const fs = require('fs');

// Read package.json
let content = fs.readFileSync('package.json', 'utf8');

// Perform all replacements
content = content
  .replace(/voiceflow-/g, 'voicecode-')
  .replace(/"voiceflow\./g, '"voicecode.')
  .replace(/command:voiceflow\./g, 'command:voicecode.')
  .replace(/view == voiceflow\./g, 'view == voicecode.')
  .replace(/"voiceflow"/g, '"voicecode"')
  .replace(/VoiceFlow PRO/g, 'VoiceCode')
  .replace(/VoiceFlow/g, 'VoiceCode')
  .replace(/@voiceflow/g, '@voicecode')
  .replace(/github\.com\/kimhons\/VoiceCode/g, 'github.com/kimhons/VoiceCode')
  .replace(/voiceflowpro/g, 'voicecode')
  .replace(/when == voiceflow\./g, 'when == voicecode.');

// Write back
fs.writeFileSync('package.json', content);

console.log('✅ package.json rebranded successfully!');
