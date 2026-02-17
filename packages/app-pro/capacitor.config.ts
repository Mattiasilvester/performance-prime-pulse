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
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#FFFFFF',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#FFFFFF',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFFFF',
      overlaysWebView: true,
    },
  },
};

export default config;
