module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@contexts': './src/contexts',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@types': './src/types',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@config': './src/config',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};

