const fs = require('fs');

// Read CHANGELOG.md
let content = fs.readFileSync('CHANGELOG.md', 'utf8');

// Perform all replacements
content = content
  .replace(/VoiceFlow PRO/g, 'VoiceCode')
  .replace(/VoiceFlow/g, 'VoiceCode')
  .replace(/github\.com\/kimhons\/VoiceCode/g, 'github.com/kimhons/VoiceCode')
  .replace(/Hey VoiceFlow/g, 'Hey VoiceCode');

// Write back
fs.writeFileSync('CHANGELOG.md', content);

console.log('✅ CHANGELOG.md rebranded successfully!');
