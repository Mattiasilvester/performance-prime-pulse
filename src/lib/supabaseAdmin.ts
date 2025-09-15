import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or Service Role Key in environment variables');
  console.error('URL:', supabaseUrl ? '✅' : '❌');
  console.error('Service Key:', supabaseServiceKey ? '✅' : '❌');
  throw new Error('Missing Supabase URL or Service Role Key in environment variables');
}

// Client ADMIN con Service Role per bypassare RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SupabaseAdmin client initialized with Service Role Key