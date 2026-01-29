// Edge Function per creare subscription PayPal
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
    console.log('💰 [paypal-create-subscription] Inizio...');

    const { subscription_id, plan_id } = await req.json();

    if (!subscription_id) {
      throw new Error('subscription_id PayPal richiesto');
    }

    // Import dinamico
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

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
    console.log('💳 PayPal Subscription ID:', subscription_id);

    // Recupera professional
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      throw new Error('Professional non trovato');
    }

    // Verifica se esiste già una subscription
    const { data: existingSub } = await supabase
      .from('professional_subscriptions')
      .select('id')
      .eq('professional_id', professional.id)
      .maybeSingle();

    // Trial 3 mesi come da piano PayPal: allo scadere PayPal addebita in automatico
    const trialDays = 90;
    const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const subscriptionData = {
      professional_id: professional.id,
      paypal_subscription_id: subscription_id,
      paypal_plan_id: plan_id || Deno.env.get('PAYPAL_PLAN_ID'),
      payment_provider: 'paypal',
      plan: 'business',
      status: 'trialing', // 3 mesi gratis, poi PayPal passa a active e addebita
      price_cents: 5000, // €50,00
      currency: 'EUR',
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString(), // 3 mesi
      current_period_start: new Date().toISOString(),
      current_period_end: trialEnd.toISOString(), // fine periodo = fine trial
      cancel_at_period_end: false,
      canceled_at: null,
      cancellation_reason: null,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingSub) {
      // Aggiorna subscription esistente
      const { data, error } = await supabase
        .from('professional_subscriptions')
        .update(subscriptionData)
        .eq('professional_id', professional.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('✅ Subscription aggiornata a PayPal');
    } else {
      // Crea nuova subscription
      const { data, error } = await supabase
        .from('professional_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('✅ Nuova subscription PayPal creata');
    }

    // Crea notifica
    await supabase.from('professional_notifications').insert({
      professional_id: professional.id,
      type: 'subscription',
      title: 'Abbonamento PayPal attivato',
      message: 'Il tuo abbonamento Prime Business è ora attivo con PayPal.',
      is_read: false,
    });

    return new Response(
      JSON.stringify({ success: true, subscription: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ [paypal-create-subscription] Errore:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
