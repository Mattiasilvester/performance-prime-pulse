import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@pp/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5173,
    maxHttpHeaderSize: 200000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'sonner', 'lucide-react'],
        },
      },
    },
  },
});
