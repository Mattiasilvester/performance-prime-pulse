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
    console.log('[STRIPE] Function called');

    // 1. Verifica Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[STRIPE] No auth header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Import dinamico Supabase
    console.log('[STRIPE] Importing Supabase...');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[STRIPE] Supabase client created');

    // 3. Verifica JWT e ottieni user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[STRIPE] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid user token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE] User authenticated:', user.id);

    // 4. Recupera professional
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, email, first_name, last_name, company_name')
      .eq('user_id', user.id)
      .single();

    if (profError || !professional) {
      console.log('[STRIPE] Professional not found:', profError?.message);
      return new Response(
        JSON.stringify({ error: 'Professional not found', details: profError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[STRIPE] Professional found:', professional.id);

    // 5. Import Stripe
    console.log('[STRIPE] Importing Stripe...');
    const { default: Stripe } = await import('https://esm.sh/stripe@17.4.0');
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('[STRIPE] Stripe client created');

    // 6. Verifica subscription esistente
    const { data: subscription } = await supabase
      .from('professional_subscriptions')
      .select('stripe_customer_id')
      .eq('professional_id', professional.id)
      .maybeSingle();

    let customerId = subscription?.stripe_customer_id;
    console.log('[STRIPE] Existing customer:', customerId || 'none');

    // 7. Crea customer Stripe se non esiste
    if (!customerId) {
      console.log('[STRIPE] Creating new customer...');
      // Costruisci nome completo da first_name + last_name (full_name non esiste nella tabella)
      const customerName = `${professional.first_name || ''} ${professional.last_name || ''}`.trim() || 
                          professional.company_name ||
                          undefined;
      
      const customer = await stripe.customers.create({
        email: professional.email || undefined,
        name: customerName,
        metadata: {
          professional_id: professional.id,
          company_name: professional.company_name || '',
        },
      });
      customerId = customer.id;
      console.log('[STRIPE] Customer created:', customerId);

      // Salva customer ID
      await supabase
        .from('professional_subscriptions')
        .update({ 
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('professional_id', professional.id);
      console.log('[STRIPE] Customer ID saved to DB');
    }

    // 8. Crea Setup Intent
    console.log('[STRIPE] Creating SetupIntent...');
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        professional_id: professional.id,
      },
    });
    console.log('[STRIPE] SetupIntent created:', setupIntent.id);

    // 9. Risposta successo
    return new Response(
      JSON.stringify({
        success: true,
        customer_id: customerId,
        setup_intent_client_secret: setupIntent.client_secret,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STRIPE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
