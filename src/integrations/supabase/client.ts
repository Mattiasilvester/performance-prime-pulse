// Client ufficiale Supabase per Performance Prime - SINGLETON PATTERN
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env, validateEnv } from '@/config/env';

// Valida le variabili d'ambiente
validateEnv();

// Singleton pattern per evitare istanze multiple
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

// Funzione per ottenere l'istanza singleton
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log('🔧 Creating new Supabase client instance');
    
    // Pulisci localStorage da sessioni corrotte prima di creare il client
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleaned ${keysToRemove.length} corrupted auth keys`);
    } catch (error) {
      console.warn('Storage cleanup failed:', error);
    }

    // Usa proxy in produzione per evitare CORS
    const supabaseUrl = env.IS_DEV 
      ? env.SUPABASE_URL!
      : '/api/supabase-proxy';

    supabaseInstance = createClient<Database>(supabaseUrl, env.SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: (key: string) => {
            try {
              return localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value);
            } catch {
              // Ignore storage errors
            }
          },
          removeItem: (key: string) => {
            try {
              localStorage.removeItem(key);
            } catch {
              // Ignore storage errors
            }
          },
        },
      },
    });
  }
  return supabaseInstance;
};

// Export dell'istanza singleton
export const supabase = getSupabaseClient();

// 🔍 Health Check (solo in sviluppo)
if (env.IS_DEV) {
  supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error(
          'Verifica che VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano corretti nel file .env'
        );
      } else {
      }
    })
    .catch((err) => {
      console.warn('⚠️ Errore imprevisto durante health check Supabase:', err);
    });
}
