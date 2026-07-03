// Generate PWA Icons using Sharp
// Run: node generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'public', 'logo.svg');
const iconsDir = path.join(__dirname, 'public', 'icons');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error(`Logo file not found: ${logoPath}`);
  process.exit(1);
}

// Create icons directory
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...\n');

// Icon sizes required by manifest.json
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons
async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputFile = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✓ Generated ${size}x${size}`);
    }
    
    // Generate favicon.ico (using 48x48 as base)
    const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
    await sharp(logoPath)
      .resize(48, 48, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    // Copy to .ico (browsers will accept PNG)
    fs.copyFileSync(faviconPath.replace('.ico', '.png'), faviconPath);
    console.log('✓ Generated favicon.ico');
    
    // Generate shortcut icons
    const recordIcon = path.join(iconsDir, 'record-96x96.png');
    const transcribeIcon = path.join(iconsDir, 'transcribe-96x96.png');
    const sourceIcon = path.join(iconsDir, 'icon-96x96.png');
    
    fs.copyFileSync(sourceIcon, recordIcon);
    fs.copyFileSync(sourceIcon, transcribeIcon);
    console.log('✓ Generated shortcut icons');
    
    console.log('\n✅ Icon generation complete!\n');
    console.log('Generated files:');
    const files = fs.readdirSync(iconsDir);
    files.forEach(file => console.log(`  - ${file}`));
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

