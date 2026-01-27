// Funzione di test incrementale per isolare problema import Stripe
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const steps: string[] = [];
  
  try {
    steps.push('1. Function started');
    
    // STEP 2: Test import Stripe
    steps.push('2. Attempting Stripe import...');
    
    const stripeModule = await import('https://esm.sh/stripe@17.4.0');
    steps.push('3. Stripe module imported');
    
    const Stripe = stripeModule.default;
    steps.push('4. Stripe default exported');
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'STRIPE_SECRET_KEY not found', steps }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    steps.push('5. Stripe key found');
    
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });
    steps.push('6. Stripe client created');
    
    // Test semplice: lista customers (limit 1)
    const customers = await stripe.customers.list({ limit: 1 });
    steps.push('7. Stripe API call successful');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        steps,
        customersCount: customers.data.length,
        message: 'Stripe is working!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        steps,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
