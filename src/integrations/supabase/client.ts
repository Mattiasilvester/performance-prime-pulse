import { createClient } from '@supabase/supabase-js';

// PROXY SEMPRE ATTIVO (sia dev che prod) per evitare CORS
const supabaseUrl = import.meta.env.PROD 
  ? '/api/supabase-proxy'  // Produzione: proxy Vercel
  : 'http://localhost:8080/api/supabase-proxy';  // Dev: proxy locale

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
