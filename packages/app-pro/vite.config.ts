import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

export default defineConfig({
  base: isCapacitor ? './' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pp/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      external: ['@capacitor/status-bar'],
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'sonner', 'lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
        },
      },
    },
  },
});
