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
    console.log('[STRIPE CHECKOUT] Function called');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
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
        JSON.stringify({ error: 'Invalid user token', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id, email, first_name, last_name, company_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      return new Response(
        JSON.stringify({ error: 'Professional not found', details: profError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: subRow, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('stripe_customer_id')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError) {
      console.error('[STRIPE CHECKOUT] Subscription lookup error:', subError);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripePriceId = Deno.env.get('STRIPE_PRICE_BUSINESS');
    if (!stripeSecretKey || !stripePriceId) {
      throw new Error('Missing Stripe environment variables');
    }

    const { default: Stripe } = await import('https://esm.sh/stripe@17.4.0');
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

    let customerId = subRow?.stripe_customer_id ?? null;

    if (!customerId) {
      const customerName =
        `${professional.first_name || ''} ${professional.last_name || ''}`.trim() ||
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
      await supabase
        .from('professional_subscriptions')
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('professional_id', professional.id);
      console.log('[STRIPE CHECKOUT] Customer created and saved:', customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        { price: stripePriceId, quantity: 1 },
      ],
      success_url: 'https://pro.performanceprime.it/partner/dashboard/abbonamento?checkout=success',
      cancel_url: 'https://pro.performanceprime.it/partner/dashboard/abbonamento?checkout=cancelled',
      metadata: { professional_id: professional.id },
      subscription_data: {
        metadata: { professional_id: professional.id },
      },
      locale: 'it',
      payment_method_types: ['card'],
    });

    if (!session.url) {
      throw new Error('Stripe did not return checkout URL');
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[STRIPE CHECKOUT] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
