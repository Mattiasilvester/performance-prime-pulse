import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLanding = process.env.VITE_APP_MODE === 'landing';
  
  console.log('Vite mode:', mode);
  console.log('VITE_APP_MODE:', process.env.VITE_APP_MODE);
  console.log('Is Landing:', isLanding);
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'process.env.VITE_APP_MODE': JSON.stringify(process.env.VITE_APP_MODE),
      'import.meta.env.VITE_APP_MODE': JSON.stringify(process.env.VITE_APP_MODE),
    },
    server: {
      host: "::",
      port: 8081,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      }
    },
  }
})
