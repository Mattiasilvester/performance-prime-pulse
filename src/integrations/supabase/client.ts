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
    detectSessionInUrl: true
  }
});
