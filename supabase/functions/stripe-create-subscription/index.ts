// Edge Function per creare abbonamento Stripe dopo trial
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
    console.log('[STRIPE SUBSCRIPTION] Function called');

    // 1. Verifica Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[STRIPE SUBSCRIPTION] No auth header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Import dinamico Supabase
    console.log('[STRIPE SUBSCRIPTION] Importing Supabase...');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[STRIPE SUBSCRIPTION] Supabase client created');

    // 3. Verifica JWT e ottieni user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[STRIPE SUBSCRIPTION] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid user token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE SUBSCRIPTION] User authenticated:', user.id);

    // 4. Recupera professional
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      console.log('[STRIPE SUBSCRIPTION] Professional not found:', profError?.message);
      return new Response(
        JSON.stringify({ error: 'Professional not found', details: profError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE SUBSCRIPTION] Professional found:', professional.id);

    // 5. Recupera subscription e verifica stato
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('*')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError || !subscription) {
      console.log('[STRIPE SUBSCRIPTION] Subscription not found:', subError?.message);
      return new Response(
        JSON.stringify({ error: 'Subscription not found', details: subError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE SUBSCRIPTION] Subscription found:', subscription.id);

    // 6. Verifica che abbia un customer_id
    if (!subscription.stripe_customer_id) {
      console.log('[STRIPE SUBSCRIPTION] No customer_id found');
      return new Response(
        JSON.stringify({ error: 'Stripe customer not found. Please add a payment method first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE SUBSCRIPTION] Customer ID:', subscription.stripe_customer_id);

    // 7. Verifica che non abbia già un abbonamento attivo
    if (subscription.stripe_subscription_id && subscription.status === 'active') {
      console.log('[STRIPE SUBSCRIPTION] Subscription already active:', subscription.stripe_subscription_id);
      return new Response(
        JSON.stringify({ 
          error: 'Subscription already active',
          subscription_id: subscription.stripe_subscription_id,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Import Stripe
    console.log('[STRIPE SUBSCRIPTION] Importing Stripe...');
    const { default: Stripe } = await import('https://esm.sh/stripe@17.4.0');
    
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripePriceId = Deno.env.get('STRIPE_PRICE_BUSINESS');
    
    if (!stripeSecretKey || !stripePriceId) {
      throw new Error('Missing Stripe environment variables');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('[STRIPE SUBSCRIPTION] Stripe client created');

    // 9. Verifica payment_method_id (opzionale per test - Stripe può usare default payment method)
    // NOTA: Per produzione, questo check dovrebbe essere obbligatorio
    // Per ora lo rendiamo opzionale per permettere test senza carta aggiunta
    let paymentMethodId = subscription.payment_method_id;
    if (!paymentMethodId) {
      console.log('[STRIPE SUBSCRIPTION] No payment_method_id, Stripe userà default payment method del customer');
      // Recupera payment methods del customer per vedere se ne ha uno di default
      const paymentMethods = await stripe.paymentMethods.list({
        customer: subscription.stripe_customer_id,
        type: 'card',
      });
      
      if (paymentMethods.data.length > 0) {
        paymentMethodId = paymentMethods.data[0].id;
        console.log('[STRIPE SUBSCRIPTION] Found payment method:', paymentMethodId);
      } else {
        console.log('[STRIPE SUBSCRIPTION] No payment methods found, subscription sarà incomplete');
      }
    } else {
      console.log('[STRIPE SUBSCRIPTION] Payment method ID:', paymentMethodId);
    }

    // 10. Crea subscription Stripe
    console.log('[STRIPE SUBSCRIPTION] Creating subscription...');
    const subscriptionParams: any = {
      customer: subscription.stripe_customer_id,
      items: [
        {
          price: stripePriceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    };

    // Aggiungi trial period di 3 mesi se non specificato
    if (!subscription.trial_end) {
      const trialEnd = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 giorni
      subscriptionParams.trial_end = trialEnd;
      console.log('[STRIPE SUBSCRIPTION] Adding 3-month trial period');
    }

    // Se abbiamo un payment_method_id, usalo come default
    if (paymentMethodId) {
      subscriptionParams.default_payment_method = paymentMethodId;
    }

    const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);
    console.log('[STRIPE SUBSCRIPTION] Subscription created:', stripeSubscription.id);

    // 11. Aggiorna database
    console.log('[STRIPE SUBSCRIPTION] Updating database...');
    const { error: updateError } = await supabase
      .from('professional_subscriptions')
      .update({
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: stripePriceId,
        status: stripeSubscription.status === 'active' ? 'active' : 'incomplete',
        current_period_start: stripeSubscription.current_period_start
          ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
          : null,
        current_period_end: stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null,
        trial_end: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000).toISOString()
          : null,
      })
      .eq('professional_id', professional.id);

    if (updateError) {
      console.error('[STRIPE SUBSCRIPTION] Error updating subscription:', updateError);
      throw updateError;
    }
    console.log('[STRIPE SUBSCRIPTION] Database updated');

    // 12. Se subscription è incomplete, restituisci client_secret per completare pagamento
    const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

    console.log('[STRIPE SUBSCRIPTION] Success! Status:', stripeSubscription.status);
    
    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: stripeSubscription.id,
        status: stripeSubscription.status,
        client_secret: paymentIntent?.client_secret || null,
        requires_action: stripeSubscription.status === 'incomplete',
        trial_end: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000).toISOString()
          : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STRIPE SUBSCRIPTION] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
