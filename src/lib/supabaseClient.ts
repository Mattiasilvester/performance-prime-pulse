import { createClient } from '@supabase/supabase-js';

// Usa proxy solo per REST API, non per realtime
const supabaseUrl = import.meta.env.PROD 
  ? '/api/supabase-proxy'  // Produzione: usa proxy Vercel
  : import.meta.env.VITE_SUPABASE_URL;  // Dev: usa URL diretto Supabase

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
