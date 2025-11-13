// Edge Function per validare secret key admin lato server
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Valida secret key contro valore server-side (senza autenticazione richiesta)
    // Questo è sicuro perché:
    // 1. La secret key è comunque necessaria per il login completo
    // 2. La validazione non dà accesso a nulla, solo dice se la secret è valida
    // 3. Il login completo richiede ancora email, password E secret key corretti
    const { secretKey } = await req.json();
    const serverSecret = Deno.env.get('ADMIN_SECRET_KEY') ?? '';

    const isValid = secretKey === serverSecret;

    return new Response(
      JSON.stringify({ valid: isValid }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in admin-auth-validate:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

