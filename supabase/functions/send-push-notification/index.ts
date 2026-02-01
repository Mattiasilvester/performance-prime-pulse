/**
 * Edge Function per inviare push notification.
 * Struttura base: autenticazione utente, validazione body, log richiesta.
 * L'invio reale (FCM, OneSignal, ecc.) va aggiunto in seguito.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization Bearer richiesto' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utente non autenticato' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Metodo POST richiesto' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: { professionalId?: string; notificationId?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body JSON non valido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const professionalId = typeof body?.professionalId === 'string' ? body.professionalId.trim() : '';
    const notificationId = typeof body?.notificationId === 'string' ? body.notificationId.trim() : '';

    if (!professionalId || !notificationId) {
      return new Response(
        JSON.stringify({ error: 'Body deve contenere professionalId e notificationId (stringhe non vuote)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[send-push-notification] professionalId:', professionalId, 'notificationId:', notificationId, 'user:', user.id);

    // Placeholder: invio push reale da integrare (FCM, OneSignal, ecc.)
    return new Response(
      JSON.stringify({ ok: true, message: 'Push not yet implemented' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-push-notification] Errore:', err);
    return new Response(
      JSON.stringify({ error: 'Errore interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
