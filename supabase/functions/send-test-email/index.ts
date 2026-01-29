/**
 * Edge Function per inviare un'email di test (Resend).
 * Usa solo per verificare che Resend sia configurato correttamente.
 * Richiede Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY.
 */
import { sendTransactional } from '../_shared/resend.ts';

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
        JSON.stringify({ error: 'Authorization Bearer richiesto (usa SUPABASE_SERVICE_ROLE_KEY)' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const key = authHeader.replace('Bearer ', '');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey || key !== serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Non autorizzato' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let to = '';
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        to = (body?.to || '').trim();
      } catch {
        // ignore
      }
    }
    if (!to || !to.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Body JSON con "to" (email destinatario) richiesto. Es: {"to":"tua@email.com"}' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendTransactional({
      to,
      subject: 'PrimePro – Email di test Resend',
      text: 'Questa è un\'email di test da PrimePro. Resend è configurato correttamente.\n\nIl team PrimePro',
    });

    if (result.skipped) {
      return new Response(
        JSON.stringify({ ok: false, message: 'RESEND_API_KEY non impostata nelle secrets' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!result.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: 'Email di test inviata a ' + to }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-test-email]', err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
