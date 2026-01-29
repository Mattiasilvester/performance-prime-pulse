// Crea subscription con trial 90 giorni al primo accesso a PrimePro (nessuna carta richiesta)
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
    console.log('🔄 [ensure-partner-subscription] Inizio...');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header mancante' }),
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

    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      return new Response(
        JSON.stringify({ error: 'Professionista non trovato' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existing } = await supabase
      .from('professional_subscriptions')
      .select('id, status, trial_end')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (existing) {
      console.log('✅ [ensure-partner-subscription] Subscription già presente:', existing.id);
      return new Response(
        JSON.stringify({ success: true, already_exists: true, subscription_id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const trialDays = 90;
    const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const now = new Date().toISOString();
    const trialEndStr = trialEnd.toISOString();

    const { data: inserted, error: insertError } = await supabase
      .from('professional_subscriptions')
      .insert({
        professional_id: professional.id,
        plan: 'business',
        status: 'trialing',
        price_cents: 5000,
        currency: 'EUR',
        trial_start: now,
        trial_end: trialEndStr,
        current_period_start: now,
        current_period_end: trialEndStr,
        cancel_at_period_end: false,
        updated_at: now,
      })
      .select('id, status, trial_start, trial_end')
      .single();

    if (insertError) {
      console.error('❌ [ensure-partner-subscription] Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Email di benvenuto (Resend) - non blocca la risposta
    const toEmail = user.email;
    if (toEmail) {
      const welcomeResult = await sendTransactional({
        to: toEmail,
        subject: 'Benvenuto su PrimePro',
        text: `Ciao,\n\nBenvenuto su PrimePro! Il tuo periodo di prova di 90 giorni è attivo. Esplora la dashboard per gestire clienti, appuntamenti e progetti.\n\nSe hai domande, rispondi a questa email.\n\nA presto,\nIl team PrimePro`,
      });
      if (welcomeResult.ok) {
        console.log('✅ [ensure-partner-subscription] Email benvenuto inviata a', toEmail);
      } else if (!welcomeResult.skipped) {
        console.warn('⚠️ [ensure-partner-subscription] Email benvenuto non inviata:', welcomeResult.error);
      }
    }

    console.log('✅ [ensure-partner-subscription] Creata subscription trial 90gg:', inserted.id);
    return new Response(
      JSON.stringify({ success: true, already_exists: false, subscription: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ [ensure-partner-subscription] Errore:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
