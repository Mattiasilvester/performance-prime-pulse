import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'it.performanceprime.pro',
  appName: 'PrimePro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1000,
      backgroundColor: '#FFFFFF',
    },
  },
};

export default config;
