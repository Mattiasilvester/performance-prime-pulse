import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'it.performanceprime.pro',
  appName: 'PrimePro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#FFFFFF',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1000,
      backgroundColor: '#FFFFFF',
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
