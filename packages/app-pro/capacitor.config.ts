import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'it.performanceprime.pro',
  appName: 'PrimePro',
  webDir: 'dist',
  server: {
    // In produzione, usa il server locale (file://)
    // Per dev, puoi usare: url: 'http://localhost:5174'
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#000000',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
  },
};

export default config;
