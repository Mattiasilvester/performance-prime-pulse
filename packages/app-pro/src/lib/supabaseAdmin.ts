import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required');
}

/**
 * Client Supabase con Service Role Key per operazioni admin (bypass RLS).
 * Configurare VITE_SUPABASE_SERVICE_ROLE_KEY in .env
 */
const supabaseAdmin =
  serviceRoleKey &&
  typeof serviceRoleKey === 'string' &&
  serviceRoleKey.length > 0
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

export default supabaseAdmin;
