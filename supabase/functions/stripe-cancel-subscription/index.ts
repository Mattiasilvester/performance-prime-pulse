// Edge Function per cancellare abbonamento Stripe
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
    console.log('[STRIPE CANCEL] Function called');

    // 1. Verifica Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[STRIPE CANCEL] No auth header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse body
    const body = await req.json();
    const cancelImmediately = body.cancel_immediately === true;
    const cancellationReason = body.cancellation_reason || null; // Motivo cancellazione (obbligatorio)

    // 3. Import dinamico Supabase
    console.log('[STRIPE CANCEL] Importing Supabase...');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[STRIPE CANCEL] Supabase client created');

    // 4. Verifica JWT e ottieni user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[STRIPE CANCEL] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid user token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE CANCEL] User authenticated:', user.id);

    // 5. Recupera professional
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      console.log('[STRIPE CANCEL] Professional not found:', profError?.message);
      return new Response(
        JSON.stringify({ error: 'Professional not found', details: profError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE CANCEL] Professional found:', professional.id);

    // 6. Recupera subscription
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('*')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError || !subscription) {
      console.log('[STRIPE CANCEL] Subscription not found:', subError?.message);
      return new Response(
        JSON.stringify({ error: 'Subscription not found', details: subError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscription.stripe_subscription_id) {
      console.log('[STRIPE CANCEL] No Stripe subscription ID found');
      return new Response(
        JSON.stringify({ error: 'No Stripe subscription found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE CANCEL] Subscription found:', subscription.stripe_subscription_id);

    // 7. Import Stripe
    console.log('[STRIPE CANCEL] Importing Stripe...');
    const { default: Stripe } = await import('https://esm.sh/stripe@17.4.0');
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('[STRIPE CANCEL] Stripe client created');

    // 8. Cancella subscription Stripe
    console.log('[STRIPE CANCEL] Cancelling subscription...', {
      subscriptionId: subscription.stripe_subscription_id,
      cancelImmediately,
    });

    let cancelledSubscription: Stripe.Subscription;
    
    if (cancelImmediately) {
      // Cancella immediatamente
      cancelledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      console.log('[STRIPE CANCEL] Subscription cancelled immediately');
    } else {
      // Cancella alla fine del periodo corrente
      cancelledSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      console.log('[STRIPE CANCEL] Subscription will be cancelled at period end');
    }

    // 9. Aggiorna database
    console.log('[STRIPE CANCEL] Updating database...');
    const updateData: any = {
      cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
      cancellation_reason: cancellationReason, // Salva motivo cancellazione
    };

    // Aggiorna anche current_period_end se disponibile (per coerenza)
    if (cancelledSubscription.current_period_end) {
      updateData.current_period_end = new Date(cancelledSubscription.current_period_end * 1000).toISOString();
    }

    if (cancelImmediately) {
      updateData.status = 'canceled';
      updateData.canceled_at = new Date().toISOString();
    } else {
      // Mantieni status attivo ma segna che verrà cancellata
      updateData.status = cancelledSubscription.status === 'active' ? 'active' : cancelledSubscription.status;
    }

    const { error: updateError } = await supabase
      .from('professional_subscriptions')
      .update(updateData)
      .eq('professional_id', professional.id);

    if (updateError) {
      console.error('[STRIPE CANCEL] Error updating subscription:', updateError);
      throw updateError;
    }
    console.log('[STRIPE CANCEL] Database updated');

    // 10. Recupera subscription aggiornata dal database per avere la data formattata correttamente
    const { data: updatedSubscription, error: fetchError } = await supabase
      .from('professional_subscriptions')
      .select('current_period_end')
      .eq('professional_id', professional.id)
      .maybeSingle();

    // Formatta data per notifica usando la stessa logica del frontend
    let formattedDate = 'fine periodo corrente';
    if (updatedSubscription?.current_period_end) {
      // Usa la data ISO dal database (stessa logica del frontend)
      const date = new Date(updatedSubscription.current_period_end);
      formattedDate = date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    // 11. Crea notifica cancellazione (non blocca se fallisce)
    try {
      const { error: notifError } = await supabase
        .from('professional_notifications')
        .insert({
          professional_id: professional.id,
          type: 'custom',
          title: cancelImmediately ? 'Abbonamento cancellato' : 'Abbonamento in cancellazione',
          message: cancelImmediately
            ? 'Il tuo abbonamento Prime Business è stato cancellato immediatamente. Grazie per aver utilizzato PrimePro!'
            : `Il tuo abbonamento Prime Business verrà cancellato il ${formattedDate}. Continuerai ad avere accesso fino a quella data.`,
          data: {
            notification_type: cancelImmediately ? 'subscription_cancelled' : 'subscription_cancellation_scheduled',
            stripe_subscription_id: cancelledSubscription.id,
            cancellation_reason: cancellationReason || null,
          },
          is_read: false,
        });

      if (notifError) {
        console.error('[STRIPE CANCEL] Errore creazione notifica (non bloccante):', notifError);
      } else {
        console.log('[STRIPE CANCEL] Notifica cancellazione inviata');
      }
    } catch (notifErr) {
      console.error('[STRIPE CANCEL] Errore invio notifica (non bloccante):', notifErr);
      // Non bloccare il flusso principale
    }

    // 11. Risposta successo
    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
        canceled_at: cancelledSubscription.canceled_at
          ? new Date(cancelledSubscription.canceled_at * 1000).toISOString()
          : null,
        current_period_end: cancelledSubscription.current_period_end
          ? new Date(cancelledSubscription.current_period_end * 1000).toISOString()
          : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STRIPE CANCEL] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
