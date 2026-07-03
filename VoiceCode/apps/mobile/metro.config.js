const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .cjs files
config.resolver.sourceExts.push('cjs');

// Add support for SVG if transformer is available
try {
  const svgTransformerPath = require.resolve('react-native-svg-transformer');
  config.transformer.babelTransformerPath = svgTransformerPath;
  config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
  config.resolver.sourceExts.push('svg');
} catch (e) {
  console.log('react-native-svg-transformer not installed, SVG files will be treated as assets');
}

module.exports = config;
