#!/usr/bin/env node

/**
 * Icon Generation Script
 * Generates all required icon sizes for iOS and Android from source SVG
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requirements: sharp library (npm install sharp)
 */

const fs = require('fs');
const path = require('path');

// Icon sizes configuration
const iconSizes = {
  // iOS App Icons
  ios: [
    { size: 20, scales: [1, 2, 3], name: 'icon-20' },
    { size: 29, scales: [1, 2, 3], name: 'icon-29' },
    { size: 40, scales: [1, 2, 3], name: 'icon-40' },
    { size: 60, scales: [2, 3], name: 'icon-60' },
    { size: 76, scales: [1, 2], name: 'icon-76' },
    { size: 83.5, scales: [2], name: 'icon-83.5' },
    { size: 1024, scales: [1], name: 'icon-1024' },
  ],

  // Android Adaptive Icons
  android: [
    { size: 48, folder: 'mipmap-mdpi' },
    { size: 72, folder: 'mipmap-hdpi' },
    { size: 96, folder: 'mipmap-xhdpi' },
    { size: 144, folder: 'mipmap-xxhdpi' },
    { size: 192, folder: 'mipmap-xxxhdpi' },
    { size: 512, folder: 'playstore' },
  ],

  // General assets
  general: [
    { size: 1024, name: 'icon' },
    { size: 196, name: 'favicon' },
    { size: 512, name: 'adaptive-icon' },
  ],

  // App Store specific
  appStore: [{ size: 1024, name: 'app-store-icon' }],

  // Play Store specific
  playStore: [
    { size: 512, name: 'icon_512' },
    { size: 1024, width: 1024, height: 500, name: 'feature_graphic' },
  ],
};

// Splash screen sizes
const splashSizes = {
  ios: [
    { width: 1242, height: 2688, name: 'splash-1242x2688' }, // iPhone XS Max
    { width: 1125, height: 2436, name: 'splash-1125x2436' }, // iPhone X/XS
    { width: 828, height: 1792, name: 'splash-828x1792' }, // iPhone XR
    { width: 1242, height: 2208, name: 'splash-1242x2208' }, // iPhone 8 Plus
    { width: 750, height: 1334, name: 'splash-750x1334' }, // iPhone 8
    { width: 2048, height: 2732, name: 'splash-2048x2732' }, // iPad Pro 12.9
    { width: 1668, height: 2388, name: 'splash-1668x2388' }, // iPad Pro 11
    { width: 1536, height: 2048, name: 'splash-1536x2048' }, // iPad
  ],
  android: [
    { width: 480, height: 800, folder: 'drawable-mdpi' },
    { width: 800, height: 1280, folder: 'drawable-hdpi' },
    { width: 1080, height: 1920, folder: 'drawable-xhdpi' },
    { width: 1440, height: 2560, folder: 'drawable-xxhdpi' },
    { width: 1920, height: 3200, folder: 'drawable-xxxhdpi' },
  ],
};

async function generateIcons() {
  console.log('🎨 VoiceCode Icon Generation Script');
  console.log('==================================\n');

  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.log('⚠️  Sharp library not installed.');
      console.log('   Run: npm install sharp --save-dev\n');
      console.log('📋 Required icon sizes for manual generation:\n');

      console.log('iOS Icons:');
      iconSizes.ios.forEach(icon => {
        icon.scales.forEach(scale => {
          const actualSize = icon.size * scale;
          console.log(`   - ${icon.name}@${scale}x.png: ${actualSize}x${actualSize}px`);
        });
      });

      console.log('\nAndroid Icons:');
      iconSizes.android.forEach(icon => {
        console.log(`   - ${icon.folder}/ic_launcher.png: ${icon.size}x${icon.size}px`);
      });

      console.log('\nGeneral Assets:');
      iconSizes.general.forEach(icon => {
        console.log(`   - ${icon.name}.png: ${icon.size}x${icon.size}px`);
      });

      console.log('\nSplash Screens:');
      splashSizes.ios.forEach(splash => {
        console.log(`   - ${splash.name}.png: ${splash.width}x${splash.height}px`);
      });

      return;
    }

    const assetsDir = path.join(__dirname, '..', 'assets');
    const sourceSvg = path.join(assetsDir, 'icon.svg');

    // Check source files
    if (!fs.existsSync(sourceSvg)) {
      console.log('❌ Source icon.svg not found in assets folder');
      return;
    }

    console.log('✅ Source SVG found');
    console.log('📁 Output directory:', assetsDir);
    console.log('\nGenerating icons...\n');

    // Generate general icons
    for (const icon of iconSizes.general) {
      const outputPath = path.join(assetsDir, `${icon.name}.png`);
      await sharp(sourceSvg).resize(icon.size, icon.size).png().toFile(outputPath);
      console.log(`   ✓ ${icon.name}.png (${icon.size}x${icon.size})`);
    }

    // Generate App Store icons
    const appStoreDir = path.join(assetsDir, 'app-store');
    if (!fs.existsSync(appStoreDir)) {
      fs.mkdirSync(appStoreDir, { recursive: true });
    }

    for (const icon of iconSizes.appStore) {
      const outputPath = path.join(appStoreDir, `${icon.name}.png`);
      await sharp(sourceSvg).resize(icon.size, icon.size).png().toFile(outputPath);
      console.log(`   ✓ app-store/${icon.name}.png (${icon.size}x${icon.size})`);
    }

    // Generate Play Store icons
    const playStoreDir = path.join(assetsDir, 'play-store');
    if (!fs.existsSync(playStoreDir)) {
      fs.mkdirSync(playStoreDir, { recursive: true });
    }

    for (const icon of iconSizes.playStore) {
      const outputPath = path.join(playStoreDir, `${icon.name}.png`);
      const width = icon.width || icon.size;
      const height = icon.height || icon.size;
      await sharp(sourceSvg)
        .resize(width, height, { fit: 'contain', background: { r: 59, g: 130, b: 246, alpha: 1 } })
        .png()
        .toFile(outputPath);
      console.log(`   ✓ play-store/${icon.name}.png (${width}x${height})`);
    }

    console.log('\n✅ Icon generation complete!');
    console.log('\n📱 Next steps:');
    console.log('   1. Run "npx expo prebuild" to generate native projects');
    console.log('   2. Icons will be automatically included in builds');
    console.log('   3. Upload store icons manually to App Store Connect / Play Console');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
  }
}

generateIcons();
