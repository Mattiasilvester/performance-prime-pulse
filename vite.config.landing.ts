import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
    open: '/landing.html'  // ← QUESTO È CRITICO
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'landing.html')
      }
    }
  },
  define: {
    'import.meta.env.VITE_APP_MODE': '"landing"'
  }
}); 