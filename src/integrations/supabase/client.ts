// Client ufficiale Supabase per Performance Prime
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env, validateEnv } from '@/config/env';

// Valida le variabili d'ambiente
validateEnv();

// Inizializza il client Supabase
export const supabase = createClient<Database>(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Migliore sicurezza in SPA
  },
});

// 🔍 Health Check (solo in sviluppo)
if (env.IS_DEV) {
  supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        console.warn('⚠️ Errore health check Supabase:', error.message);
        console.warn(
          'Verifica che VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano corretti nel file .env'
        );
      } else {
        console.log('✅ Connessione a Supabase riuscita');
      }
    })
    .catch((err) => {
      console.warn('⚠️ Errore imprevisto durante health check Supabase:', err);
    });
}
