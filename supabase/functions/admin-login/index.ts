/**
 * Edge Function: admin-login
 * Verifica email + password SuperAdmin leggendo profiles con Service Role (bypass RLS).
 * Il client non può leggere profiles senza sessione Auth; questa EF risolve il problema.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Server config missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!adminPassword || adminPassword.length < 8) {
      return new Response(
        JSON.stringify({ valid: false, error: 'ADMIN_PASSWORD not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email) {
      return new Response(
        JSON.stringify({ valid: false, error: 'email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id, email, role, first_name, last_name, created_at')
      .ilike('email', email);

    if (error) {
      return new Response(
        JSON.stringify({ valid: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const profile = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!profile || profile.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Account non autorizzato' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Password non valida' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        profile: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          first_name: profile.first_name,
          last_name: profile.last_name,
          created_at: profile.created_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-login]', e);
    return new Response(
      JSON.stringify({ valid: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
