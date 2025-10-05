import { createClient } from '@supabase/supabase-js';

// Usa URL diretto in dev, proxy in produzione
const supabaseUrl = import.meta.env.PROD 
  ? '/api/supabase-proxy'  // Produzione: proxy Vercel
  : 'https://kfxoyucatvvcgmqalxsg.supabase.co';  // Dev: URL diretto Supabase

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
