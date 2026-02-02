/**
 * Edge Function: admin-users
 * Lista utenti (profiles) per SuperAdmin Utenti B2C. Usa Service Role (bypass RLS).
 * GET: ?limit=&offset=&search=&status= → { users, count, limit, offset }
 * PATCH/DELETE: 501 (da implementare se serve).
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.replace(/^\/functions\/v1\/admin-users\/?/, '').split('/').filter(Boolean);
  const userId = pathParts[0];

  if (req.method === 'PATCH' || req.method === 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'PATCH/DELETE non ancora implementati' }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server config missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '200', 10) || 200, 500);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10) || 0;
    const search = url.searchParams.get('search')?.trim() || '';
    const status = url.searchParams.get('status') || '';

    let query = supabase
      .from('profiles')
      .select('id, email, first_name, last_name, full_name, role, created_at, last_login', { count: 'exact' })
      .neq('role', 'super_admin')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }
    if (status === 'inactive') {
      query = query.eq('role', 'suspended');
    }

    const { data: rows, error, count: totalCount } = await query.range(offset, offset + limit - 1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const users = (rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      email: r.email,
      full_name: r.full_name ?? (r.first_name || r.last_name ? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() : r.email),
      name: r.full_name ?? (r.first_name || r.last_name ? `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() : r.email),
      role: r.role ?? 'user',
      is_active: (r.role as string) !== 'suspended',
      last_sign_in_at: r.last_login,
      last_login: r.last_login,
      created_at: r.created_at,
      total_workouts: 0,
      total_minutes: 0,
      user_workouts: 0,
      last_workout_date: null,
      subscription_status: null,
    }));

    return new Response(
      JSON.stringify({
        users,
        count: totalCount ?? users.length,
        limit,
        offset,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-users]', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
