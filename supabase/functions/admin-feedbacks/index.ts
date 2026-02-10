/**
 * Edge Function: admin-feedbacks
 * Lista, approva, rimuovi approvazione ed elimina feedback landing (tabella landing_feedbacks).
 * Usa Service Role per bypassare RLS (i feedback in attesa non sono visibili al client).
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') ?? 'all'; // all | pending | approved
    const countOnly = url.searchParams.get('countOnly') === 'true';

    if (req.method === 'GET') {
      if (countOnly) {
        let countQuery = supabase
          .from('landing_feedbacks')
          .select('*', { count: 'exact', head: true });
        if (filter === 'pending') countQuery = countQuery.eq('is_approved', false);
        if (filter === 'approved') countQuery = countQuery.eq('is_approved', true);
        const { count, error } = await countQuery;
        if (error) throw error;
        return new Response(JSON.stringify({ count: count ?? 0 }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let query = supabase
        .from('landing_feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      if (filter === 'pending') query = query.eq('is_approved', false);
      if (filter === 'approved') query = query.eq('is_approved', true);

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify(data ?? []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({})) as { action: string; id?: string };
      const { action, id } = body;
      if (!id || typeof id !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Missing or invalid id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'approve') {
        const { error } = await supabase
          .from('landing_feedbacks')
          .update({ is_approved: true })
          .eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'unapprove') {
        const { error } = await supabase
          .from('landing_feedbacks')
          .update({ is_approved: false })
          .eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete') {
        const { error } = await supabase
          .from('landing_feedbacks')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action. Use approve, unapprove or delete.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[admin-feedbacks]', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
