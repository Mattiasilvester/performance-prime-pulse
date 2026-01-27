// Funzione MINIMA senza NESSUNA dipendenza esterna per test diagnostico
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Test 1: Funzione base funziona
    const timestamp = new Date().toISOString();
    
    // Test 2: Verifica environment variables
    const hasStripeKey = !!Deno.env.get('STRIPE_SECRET_KEY');
    const hasSupabaseUrl = !!Deno.env.get('SUPABASE_URL');
    const hasServiceKey = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Test 3: Verifica Authorization header
    const authHeader = req.headers.get('Authorization');
    const hasAuth = !!authHeader;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Edge Function is working!',
        timestamp,
        environment: {
          hasStripeKey,
          hasSupabaseUrl,
          hasServiceKey,
        },
        request: {
          hasAuthHeader: hasAuth,
          method: req.method,
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
