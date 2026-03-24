import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Proximity',
  slug: 'proximity',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'proximity',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.proximity.app',
    infoPlist: {
      NSBluetoothAlwaysUsageDescription:
        'Proximity uses Bluetooth to discover people near you at events.',
      NSBluetoothPeripheralUsageDescription:
        'Proximity uses Bluetooth to let others discover you at events.',
      UIBackgroundModes: ['bluetooth-central', 'bluetooth-peripheral'],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FF6B6B',
    },
    package: 'com.proximity.app',
    permissions: [
      'BLUETOOTH',
      'BLUETOOTH_ADMIN',
      'BLUETOOTH_SCAN',
      'BLUETOOTH_ADVERTISE',
      'BLUETOOTH_CONNECT',
      'ACCESS_FINE_LOCATION',
    ],
  },
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    apiUrl: process.env.API_URL ?? 'http://localhost:3000',
    wsUrl: process.env.WS_URL ?? 'ws://localhost:3000',
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});
