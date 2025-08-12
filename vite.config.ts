import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica esplicitamente le variabili d'ambiente
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('Vite mode:', mode);
  console.log('VITE_APP_MODE:', env.VITE_APP_MODE);
  console.log('VITE_DEV_TEST_EMAIL:', env.VITE_DEV_TEST_EMAIL);
  console.log('VITE_DEV_TEST_PASSWORD:', env.VITE_DEV_TEST_PASSWORD ? 'PRESENTE' : 'MISSING');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'process.env.VITE_APP_MODE': JSON.stringify(env.VITE_APP_MODE),
      'import.meta.env.VITE_APP_MODE': JSON.stringify(env.VITE_APP_MODE),
      'import.meta.env.VITE_DEV_TEST_EMAIL': JSON.stringify(env.VITE_DEV_TEST_EMAIL),
      'import.meta.env.VITE_DEV_TEST_PASSWORD': JSON.stringify(env.VITE_DEV_TEST_PASSWORD),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
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
