import { createClient } from '@supabase/supabase-js';

console.log('🔍 VITE ENV DEBUG:');
console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('- SERVICE_KEY exists:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// FALLBACK hardcoded se variabili d'ambiente non funzionano
const FALLBACK_CONFIG = {
  url: 'https://kfxoyucatvvcgmqalxsg.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeG95dWNhdHZ2Y2dtcWFseHNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI0NzY1OSwiZXhwIjoyMDY1ODIzNjU5fQ.uUYhj86MjOS2y4P0XS1okWYZNqRp2iZ0rO4TE1INh3E'
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_CONFIG.url;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || FALLBACK_CONFIG.serviceKey;

console.log('🎯 FINAL CONFIG:');
console.log('- URL:', supabaseUrl);
console.log('- Service Key (first 20 chars):', supabaseServiceKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  throw new Error('Missing Supabase URL or Service Role Key');
}

// Client ADMIN con Service Role per bypassare RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ SupabaseAdmin client initialized with Service Role Key');