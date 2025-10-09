// api/admin-operations.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Service role key letta da environment server-side (sicura!)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client admin (SOLO server-side)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Valida che la richiesta venga da un admin
async function validateAdmin(authHeader: string | undefined): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  
  // Verifica token
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    return false;
  }

  // Controlla se è admin
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  return profile?.is_admin === true;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Valida admin
    const isAdmin = await validateAdmin(req.headers.authorization);
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    const { action, payload } = req.body;

    // Router operazioni admin
    switch (action) {
      case 'delete_user':
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
          payload.userId
        );
        return res.status(200).json({ success: !deleteError, error: deleteError });

      case 'update_user_metadata':
        const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          payload.userId,
          { user_metadata: payload.metadata }
        );
        return res.status(200).json({ success: !updateError, data, error: updateError });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error: any) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}


