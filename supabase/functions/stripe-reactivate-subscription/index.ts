// Edge Function per riattivare abbonamento Stripe cancellato
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[STRIPE REACTIVATE] Function called');
    console.log('[STRIPE REACTIVATE] Method:', req.method);
    console.log('[STRIPE REACTIVATE] Headers:', Object.fromEntries(req.headers.entries()));

    // 1. Verifica Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[STRIPE REACTIVATE] No auth header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse body
    let body: any = {};
    try {
      const bodyText = await req.text();
      console.log('[STRIPE REACTIVATE] Raw body:', bodyText);
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.error('[STRIPE REACTIVATE] Errore parsing body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: parseError instanceof Error ? parseError.message : String(parseError) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[STRIPE REACTIVATE] Parsed body:', body);
    const subscriptionId = body.subscription_id;

    if (!subscriptionId) {
      console.error('[STRIPE REACTIVATE] Missing subscription_id in body:', body);
      return new Response(
        JSON.stringify({ error: 'Missing subscription_id', received_body: body }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Import dinamico Supabase
    console.log('[STRIPE REACTIVATE] Importing Supabase...');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[STRIPE REACTIVATE] Supabase client created');

    // 4. Verifica JWT e ottieni user
    const token = authHeader.replace('Bearer ', '');
    console.log('[STRIPE REACTIVATE] Token received (first 20 chars):', token.substring(0, 20));
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[STRIPE REACTIVATE] Auth error:', {
        error: authError,
        message: authError?.message,
        status: authError?.status,
      });
      return new Response(
        JSON.stringify({ error: 'Invalid user token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE REACTIVATE] User authenticated:', user.id, 'Email:', user.email);

    // 5. Trova professional associato all'utente
    console.log('[STRIPE REACTIVATE] Searching professional for user_id:', user.id);
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, email, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('[STRIPE REACTIVATE] Professional query result:', {
      professional: professional ? { id: professional.id, email: professional.email } : null,
      error: profError,
      errorMessage: profError?.message,
      errorCode: profError?.code,
    });

    if (profError) {
      console.error('[STRIPE REACTIVATE] Professional query error:', profError);
      return new Response(
        JSON.stringify({ 
          error: 'Professional query failed', 
          details: profError.message,
          code: profError.code,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!professional) {
      console.error('[STRIPE REACTIVATE] Professional not found for user_id:', user.id);
      // Verifica se esiste un professional con questo user_id (per debug)
      const { data: allProfs, error: debugError } = await supabase
        .from('professionals')
        .select('id, user_id, email')
        .limit(5);
      console.log('[STRIPE REACTIVATE] Debug - Sample professionals:', allProfs);
      
      return new Response(
        JSON.stringify({ 
          error: 'Professional not found',
          user_id: user.id,
          user_email: user.email,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE REACTIVATE] Professional found:', professional.id);

    // 6. Verifica che la subscription esista e appartenga al professional
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError || !subscription) {
      console.error('[STRIPE REACTIVATE] Subscription not found:', subError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found or does not belong to this professional' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Verifica che la subscription sia in stato cancellabile (cancel_at_period_end = true)
    if (!subscription.cancel_at_period_end) {
      return new Response(
        JSON.stringify({ error: 'Subscription is not scheduled for cancellation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[STRIPE REACTIVATE] Subscription found:', subscription.id);

    // 8. Import Stripe
    console.log('[STRIPE REACTIVATE] Importing Stripe...');
    const { default: Stripe } = await import('https://esm.sh/stripe@17.4.0');
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not found');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('[STRIPE REACTIVATE] Stripe client created');

    // 9. Riattiva subscription Stripe (rimuove cancel_at_period_end)
    console.log('[STRIPE REACTIVATE] Reactivating subscription...', {
      subscriptionId: subscription.stripe_subscription_id,
    });

    const reactivatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
    console.log('[STRIPE REACTIVATE] Subscription reactivated in Stripe');

    // 10. Aggiorna database
    console.log('[STRIPE REACTIVATE] Updating database...');
    const updateData: any = {
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
      // Opzionale: rimuovi cancellation_reason quando riattivi
      cancellation_reason: null,
    };

    // Aggiorna status se necessario
    if (reactivatedSubscription.status === 'active') {
      updateData.status = 'active';
    }

    const { error: updateError } = await supabase
      .from('professional_subscriptions')
      .update(updateData)
      .eq('professional_id', professional.id);

    if (updateError) {
      console.error('[STRIPE REACTIVATE] Error updating subscription:', updateError);
      throw updateError;
    }
    console.log('[STRIPE REACTIVATE] Database updated');

    // 11. Crea notifica riattivazione (non blocca se fallisce)
    try {
      const { error: notifError } = await supabase
        .from('professional_notifications')
        .insert({
          professional_id: professional.id,
          type: 'custom',
          title: 'Abbonamento riattivato',
          message: 'Il tuo abbonamento Prime Business è stato riattivato con successo! Continuerai ad avere accesso a tutti i servizi.',
          data: {
            notification_type: 'subscription_reactivated',
            stripe_subscription_id: reactivatedSubscription.id,
          },
          is_read: false,
        });

      if (notifError) {
        console.error('[STRIPE REACTIVATE] Errore creazione notifica (non bloccante):', notifError);
      } else {
        console.log('[STRIPE REACTIVATE] Notifica riattivazione inviata');
      }
    } catch (notifErr) {
      console.error('[STRIPE REACTIVATE] Errore invio notifica (non bloccante):', notifErr);
      // Non bloccare il flusso principale
    }

    // 12. Risposta successo
    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: reactivatedSubscription.id,
          status: reactivatedSubscription.status,
          cancel_at_period_end: reactivatedSubscription.cancel_at_period_end,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error: any) {
    console.error('[STRIPE REACTIVATE] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
