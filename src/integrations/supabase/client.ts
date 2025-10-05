import { createClient } from '@supabase/supabase-js';

// PROXY SEMPRE ATTIVO (sia dev che prod)
const supabaseUrl = '/api/supabase-proxy';
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
