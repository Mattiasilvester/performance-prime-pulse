import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from "lovable-tagger"
import { visualizer } from 'rollup-plugin-visualizer'

// NOTE: In produzione, servire index.html con Cache-Control: no-cache.
// Gli asset hashed possono avere Cache-Control: public, max-age=31536000, immutable.

export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";

  return {
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    !isDev && visualizer({
      filename: 'bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap'
    }),
    isDev && {
      name: "dev-no-store",
      configureServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
          // Imposta no-store su tutte le risposte in DEV
          res.setHeader("Cache-Control", "no-store");
          next();
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: false, // Permetti a Vercel Dev di usare una porta diversa
    // Configurazione per token grandi (70KB+)
    maxHttpHeaderSize: 200000, // 200KB per header
    // Proxy ottimizzato per token grandi
    proxy: {
      '/api/supabase-proxy': {
        target: 'https://kfxoyucatvvcgmqalxsg.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supabase-proxy/, ''),
        // Configurazione per token grandi
        timeout: 30000,
        proxyTimeout: 30000,
        // Aumenta limite headers per evitare 431
        headers: {
          'Connection': 'keep-alive',
          'Content-Type': 'application/json'
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Configurazione per token grandi (70KB+)
            proxyReq.setHeader('Connection', 'keep-alive');
            
            // Copia headers essenziali per evitare 431
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers.apikey) {
              proxyReq.setHeader('apikey', req.headers.apikey);
            }
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            // MANTIENI i cookie per autenticazione
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            
            // Rimuovi solo headers non critici per ridurre dimensione
            proxyReq.removeHeader('x-forwarded-for');
            proxyReq.removeHeader('x-forwarded-proto');
            proxyReq.removeHeader('x-forwarded-host');
            proxyReq.removeHeader('x-real-ip');
          });
        }
      },
      // Proxy per API OpenAI in sviluppo locale (quando NON si usa vercel dev)
      '/api/ai-chat': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 60000, // 60 secondi per risposte lunghe
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // TEMPORANEAMENTE DISABILITATO PER DEBUG
        drop_debugger: true,
      }
    },
    sourcemap: false, // Disabilita in prod per ridurre size
    chunkSizeWarningLimit: 1000, // Aumenta limite per evitare warning
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['framer-motion', 'sonner', 'lucide-react'],
          'vendor-charts': ['recharts'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  }
};
});
