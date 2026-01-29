// Edge Function per listare payment methods Stripe
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
    console.log('💳 [stripe-list-payment-methods] Inizio...');

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
      console.log('⚠️ Nessun professional trovato');
      return new Response(
        JSON.stringify({ success: true, payment_methods: [], default_payment_method: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Recupera subscription per ottenere stripe_customer_id
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('stripe_customer_id')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError || !subscription?.stripe_customer_id) {
      console.log('⚠️ Nessun customer Stripe trovato');
      return new Response(
        JSON.stringify({ success: true, payment_methods: [], default_payment_method: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const customerId = subscription.stripe_customer_id;
    console.log('🔑 Stripe Customer ID:', customerId);

    // Recupera customer per default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method || null;

    console.log('📌 Default Payment Method:', defaultPaymentMethodId);

    // Lista payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    console.log(`💳 Trovate ${paymentMethods.data.length} carte`);

    // Formatta risposta
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      card_brand: pm.card?.brand || 'unknown',
      card_last4: pm.card?.last4 || '****',
      card_exp_month: pm.card?.exp_month || 0,
      card_exp_year: pm.card?.exp_year || 0,
      is_default: pm.id === defaultPaymentMethodId,
      created: pm.created,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        payment_methods: formattedMethods,
        default_payment_method: defaultPaymentMethodId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ [stripe-list-payment-methods] Errore:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
