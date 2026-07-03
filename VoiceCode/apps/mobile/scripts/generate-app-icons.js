// Script to generate app icons for iOS and Android
// Run with: node scripts/generate-app-icons.js

const fs = require('fs');
const path = require('path');

/**
 * Generate SVG for VoiceCode app icon
 * Design: Microphone with sound waves in gradient
 */
function generateIconSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="micGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGradient)" rx="${size * 0.22}"/>
  
  <!-- Microphone body -->
  <ellipse cx="${size/2}" cy="${size * 0.42}" rx="${size * 0.12}" ry="${size * 0.18}" fill="url(#micGradient)"/>
  
  <!-- Microphone base -->
  <path d="M ${size * 0.38} ${size * 0.6} Q ${size/2} ${size * 0.65} ${size * 0.62} ${size * 0.6}" 
        stroke="url(#micGradient)" stroke-width="${size * 0.025}" fill="none" stroke-linecap="round"/>
  
  <!-- Microphone stand -->
  <line x1="${size/2}" y1="${size * 0.6}" x2="${size/2}" y2="${size * 0.75}" 
        stroke="url(#micGradient)" stroke-width="${size * 0.025}" stroke-linecap="round"/>
  
  <!-- Base -->
  <line x1="${size * 0.4}" y1="${size * 0.75}" x2="${size * 0.6}" y2="${size * 0.75}" 
        stroke="url(#micGradient)" stroke-width="${size * 0.03}" stroke-linecap="round"/>
  
  <!-- Sound waves (left) -->
  <path d="M ${size * 0.25} ${size * 0.35} Q ${size * 0.22} ${size * 0.42} ${size * 0.25} ${size * 0.49}" 
        stroke="#ffffff" stroke-width="${size * 0.02}" fill="none" stroke-linecap="round" opacity="0.6"/>
  <path d="M ${size * 0.18} ${size * 0.3} Q ${size * 0.14} ${size * 0.42} ${size * 0.18} ${size * 0.54}" 
        stroke="#ffffff" stroke-width="${size * 0.02}" fill="none" stroke-linecap="round" opacity="0.4"/>
  
  <!-- Sound waves (right) -->
  <path d="M ${size * 0.75} ${size * 0.35} Q ${size * 0.78} ${size * 0.42} ${size * 0.75} ${size * 0.49}" 
        stroke="#ffffff" stroke-width="${size * 0.02}" fill="none" stroke-linecap="round" opacity="0.6"/>
  <path d="M ${size * 0.82} ${size * 0.3} Q ${size * 0.86} ${size * 0.42} ${size * 0.82} ${size * 0.54}" 
        stroke="#ffffff" stroke-width="${size * 0.02}" fill="none" stroke-linecap="round" opacity="0.4"/>
</svg>`;
}

/**
 * Generate splash screen SVG
 */
function generateSplashSVG(width, height) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#splashGradient)"/>
  
  <!-- Logo/Icon (centered) -->
  <g transform="translate(${width/2 - 150}, ${height/2 - 150})">
    <!-- Microphone -->
    <ellipse cx="150" cy="126" rx="36" ry="54" fill="#ffffff"/>
    <path d="M 114 180 Q 150 195 186 180" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round"/>
    <line x1="150" y1="180" x2="150" y2="225" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <line x1="120" y1="225" x2="180" y2="225" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
    
    <!-- Sound waves -->
    <path d="M 75 105 Q 66 126 75 147" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="M 54 90 Q 42 126 54 162" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.4"/>
    <path d="M 225 105 Q 234 126 225 147" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="M 246 90 Q 258 126 246 162" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.4"/>
  </g>
  
  <!-- App Name -->
  <text x="${width/2}" y="${height/2 + 200}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="#ffffff" text-anchor="middle">VoiceCode</text>
  
  <!-- Tagline -->
  <text x="${width/2}" y="${height/2 + 250}" font-family="Arial, sans-serif" font-size="24" 
        fill="#ffffff" text-anchor="middle" opacity="0.9">Voice to Text, Powered by AI</text>
</svg>`;
}

/**
 * Generate adaptive icon (Android)
 */
function generateAdaptiveIconSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="adaptiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background (full bleed) -->
  <rect width="${size}" height="${size}" fill="url(#adaptiveGradient)"/>
  
  <!-- Safe zone content (66dp = 264px at xxxhdpi) -->
  <g transform="translate(${size * 0.21}, ${size * 0.21})">
    <!-- Microphone (scaled to fit safe zone) -->
    <ellipse cx="${size * 0.29}" cy="${size * 0.24}" rx="${size * 0.07}" ry="${size * 0.105}" fill="#ffffff"/>
    <path d="M ${size * 0.22} ${size * 0.35} Q ${size * 0.29} ${size * 0.38} ${size * 0.36} ${size * 0.35}" 
          stroke="#ffffff" stroke-width="${size * 0.015}" fill="none" stroke-linecap="round"/>
    <line x1="${size * 0.29}" y1="${size * 0.35}" x2="${size * 0.29}" y2="${size * 0.44}" 
          stroke="#ffffff" stroke-width="${size * 0.015}" stroke-linecap="round"/>
    <line x1="${size * 0.23}" y1="${size * 0.44}" x2="${size * 0.35}" y2="${size * 0.44}" 
          stroke="#ffffff" stroke-width="${size * 0.018}" stroke-linecap="round"/>
    
    <!-- Sound waves -->
    <path d="M ${size * 0.145} ${size * 0.20} Q ${size * 0.13} ${size * 0.24} ${size * 0.145} ${size * 0.28}" 
          stroke="#ffffff" stroke-width="${size * 0.012}" fill="none" stroke-linecap="round" opacity="0.6"/>
    <path d="M ${size * 0.435} ${size * 0.20} Q ${size * 0.45} ${size * 0.24} ${size * 0.435} ${size * 0.28}" 
          stroke="#ffffff" stroke-width="${size * 0.012}" fill="none" stroke-linecap="round" opacity="0.6"/>
  </g>
</svg>`;
}

// Create directories
const assetsDir = path.join(__dirname, '..', 'assets');
const appStoreDir = path.join(assetsDir, 'app-store');
const playStoreDir = path.join(assetsDir, 'play-store');

[assetsDir, appStoreDir, playStoreDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Generate iOS icon (1024x1024)
const iosIcon = generateIconSVG(1024);
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iosIcon);
console.log('✅ Generated icon.svg (1024x1024)');

// Generate splash screen (1284x2778)
const splash = generateSplashSVG(1284, 2778);
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splash);
console.log('✅ Generated splash.svg (1284x2778)');

// Generate Android adaptive icon (512x512)
const adaptiveIcon = generateAdaptiveIconSVG(512);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), adaptiveIcon);
console.log('✅ Generated adaptive-icon.svg (512x512)');

console.log('\n📝 Next steps:');
console.log('1. Convert SVG files to PNG using a tool like Inkscape or online converter');
console.log('2. Place PNG files in assets/ directory');
console.log('3. Update app.json with correct asset paths');
console.log('4. Generate screenshots from running app');
console.log('5. Create feature graphic for Play Store');
console.log('\n✨ Icon generation complete!');
