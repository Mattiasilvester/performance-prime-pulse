// Edge Function per impostare default payment method Stripe
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
    console.log('📌 [stripe-set-default-payment-method] Inizio...');

    const body = await req.json();
    console.log('📦 Body ricevuto:', JSON.stringify(body));
    
    const { payment_method_id } = body;

    if (!payment_method_id) {
      console.error('❌ payment_method_id mancante nel body');
      throw new Error('payment_method_id richiesto');
    }

    console.log('💳 Payment Method ID:', payment_method_id);

    // Import dinamico
    const { default: Stripe } = await import('https://esm.sh/stripe@17.4.0');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifica autenticazione
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header mancante');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Utente non autenticato');
    }

    console.log('👤 User ID:', user.id);

    // Recupera professional
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      throw new Error('Professional non trovato');
    }

    // Recupera subscription
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError) {
      console.error('❌ Errore query subscription:', subError);
      throw new Error(`Errore database: ${subError.message}`);
    }

    if (!subscription) {
      console.error('❌ Nessuna subscription trovata per professional_id:', professional.id);
      throw new Error('Nessuna subscription trovata. Aggiungi prima una carta.');
    }

    if (!subscription.stripe_customer_id) {
      console.error('❌ Nessun stripe_customer_id nella subscription');
      throw new Error('Customer Stripe non trovato. Aggiungi prima una carta.');
    }

    const customerId = subscription.stripe_customer_id;
    console.log('🔑 Stripe Customer ID:', customerId);

    // Verifica che il payment method appartenga al customer e associalo se necessario
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
      console.log('💳 Payment Method recuperato:', {
        id: paymentMethod.id,
        customer: paymentMethod.customer,
        type: paymentMethod.type,
      });

      // Se il payment method non è associato al customer, associalo
      if (!paymentMethod.customer) {
        console.log('🔗 Payment method non associato al customer, associazione in corso...');
        await stripe.paymentMethods.attach(payment_method_id, {
          customer: customerId,
        });
        console.log('✅ Payment method associato al customer');
      } else if (paymentMethod.customer !== customerId) {
        throw new Error('Il payment method appartiene a un altro customer');
      }
    } catch (pmError: any) {
      console.error('❌ Errore verifica/associazione payment method:', pmError);
      if (pmError.type === 'StripeInvalidRequestError' && pmError.code === 'resource_missing') {
        throw new Error('Payment method non trovato o non valido');
      }
      if (pmError.type === 'StripeInvalidRequestError' && pmError.message?.includes('already been attached')) {
        // Payment method già associato, continua
        console.log('ℹ️ Payment method già associato al customer');
      } else {
        throw pmError;
      }
    }

    // Aggiorna default payment method sul customer
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: payment_method_id,
        },
      });
      console.log('✅ Default payment method aggiornato sul customer');
    } catch (updateError: any) {
      console.error('❌ Errore aggiornamento customer:', updateError);
      throw new Error(`Errore Stripe: ${updateError.message || 'Impossibile aggiornare payment method'}`);
    }

    // Se c'è una subscription attiva, aggiorna anche quella
    if (subscription.stripe_subscription_id) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          default_payment_method: payment_method_id,
        });
        console.log('✅ Default payment method aggiornato sulla subscription');
      } catch (subError: any) {
        console.error('⚠️ Errore aggiornamento subscription (non bloccante):', subError);
        // Non bloccare se la subscription non esiste o ha problemi
      }
    }

    // Recupera i dettagli della carta per aggiornare il DB locale
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

    // Aggiorna DB locale
    const { error: updateError } = await supabase
      .from('professional_subscriptions')
      .update({
        card_last4: paymentMethod.card?.last4,
        card_brand: paymentMethod.card?.brand,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', professional.id);

    if (updateError) {
      console.error('⚠️ Errore aggiornamento DB locale:', updateError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Default payment method aggiornato' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ [stripe-set-default-payment-method] Errore:', error);
    const errorMessage = error?.message || 'Errore sconosciuto';
    const statusCode = error?.statusCode || 400;
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error?.stack || undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: statusCode }
    );
  }
});
