// Edge Function per rimuovere (detach) payment method Stripe
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
    console.log('🗑️ [stripe-detach-payment-method] Inizio...');

    const { payment_method_id } = await req.json();

    if (!payment_method_id) {
      throw new Error('payment_method_id richiesto');
    }

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

    // Recupera subscription per verificare ownership
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('stripe_customer_id')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError || !subscription?.stripe_customer_id) {
      throw new Error('Nessuna subscription trovata');
    }

    const customerId = subscription.stripe_customer_id;

    // Verifica che il payment method appartenga al customer
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
    
    if (paymentMethod.customer !== customerId) {
      throw new Error('Payment method non appartiene a questo utente');
    }

    // Verifica che non sia l'unico payment method
    const allMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (allMethods.data.length <= 1) {
      throw new Error('Non puoi rimuovere l\'unica carta salvata. Aggiungi prima un\'altra carta.');
    }

    // Verifica che non sia il default
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;

    if (payment_method_id === defaultPaymentMethodId) {
      throw new Error('Non puoi rimuovere la carta predefinita. Imposta prima un\'altra carta come predefinita.');
    }

    // Rimuovi (detach) il payment method
    await stripe.paymentMethods.detach(payment_method_id);

    console.log('✅ Payment method rimosso:', payment_method_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Carta rimossa con successo' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ [stripe-detach-payment-method] Errore:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
