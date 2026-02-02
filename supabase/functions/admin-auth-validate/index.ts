/**
 * Edge Function: admin-auth-validate
 * Verifica la Secret Key per il login SuperAdmin.
 * Restituisce { valid: true } se secretKey coincide con ADMIN_SECRET_KEY (env).
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const expected = Deno.env.get('ADMIN_SECRET_KEY');
    if (!expected || expected.length < 8) {
      return new Response(
        JSON.stringify({ valid: false, error: 'ADMIN_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { secretKey?: string };
    const provided = typeof body.secretKey === 'string' ? body.secretKey.trim() : '';

    const valid = provided.length > 0 && provided === expected;

    return new Response(JSON.stringify({ valid }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[admin-auth-validate]', e);
    return new Response(
      JSON.stringify({ valid: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
