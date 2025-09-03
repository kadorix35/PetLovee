const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web platformu için react-native-maps'i devre dışı bırak
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Web build için react-native-maps'i ignore et
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Web platformu için native modülleri mock'la
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': require.resolve('./src/utils/mockMaps.js'),
};

module.exports = config;
