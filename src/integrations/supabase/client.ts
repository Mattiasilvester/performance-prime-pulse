import { createClient } from '@supabase/supabase-js';

// URL diretto Supabase per test locale
const SUPABASE_DIRECT_URL = 'https://kfxoyucatvvcgmqalxsg.supabase.co';

// Determina supabaseUrl in base all'ambiente
let supabaseUrl: string;
if (import.meta.env.PROD) {
  // Nel build di produzione
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Se il build di produzione è servito localmente (es. python http.server)
    supabaseUrl = SUPABASE_DIRECT_URL; // Usa l'URL diretto
  } else {
    // Se il build di produzione è deployato (es. su Vercel)
    // Costruisci URL assoluto per il proxy Vercel
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    supabaseUrl = `${protocol}//${hostname}/api/supabase-proxy`;
  }
} else {
  // In sviluppo (npm run dev)
  supabaseUrl = 'http://localhost:8080/api/supabase-proxy'; // Usa il proxy Vite
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY mancante');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Pulisci sessioni corrotte per evitare 431
    storage: {
      getItem: (key: string) => {
        try {
          const item = localStorage.getItem(key);
          // Se l'item è troppo grande, rimuovilo
          if (item && item.length > 10000) {
            localStorage.removeItem(key);
            return null;
          }
          return item;
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          // Se il valore è troppo grande, non salvarlo
          if (value && value.length > 10000) {
            console.warn('Token troppo grande, rimuovendo:', key);
            localStorage.removeItem(key);
            return;
          }
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
      }
    }
  }
});
