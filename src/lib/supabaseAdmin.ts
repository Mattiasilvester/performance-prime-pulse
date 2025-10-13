// ⚠️ DEPRECATO - Usare /api/admin-operations invece
// Questo file non dovrebbe più essere usato per operazioni admin

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Client admin temporaneo per compatibilità con codice esistente
// TODO: Migrare tutto a API serverless
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'supabase.admin.auth.token'
    }
  });
}

export { supabaseAdmin };

// Funzioni admin che chiamano l'API serverless
export async function deleteUser(userId: string) {
  // Ottieni il token di sessione corrente
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  // Chiama API serverless
  const response = await fetch('/api/admin-operations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      action: 'delete_user',
      payload: { userId }
    })
  });

  if (!response.ok) {
    throw new Error('Admin operation failed');
  }

  return response.json();
}

export async function updateUserMetadata(userId: string, metadata: any) {
  // Ottieni il token di sessione corrente
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  // Chiama API serverless
  const response = await fetch('/api/admin-operations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      action: 'update_user_metadata',
      payload: { userId, metadata }
    })
  });

  if (!response.ok) {
    throw new Error('Admin operation failed');
  }

  return response.json();
}