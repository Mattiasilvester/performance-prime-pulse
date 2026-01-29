// Edge Function per cancellare subscription PayPal
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Funzione per ottenere access token PayPal
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')!;
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
  const mode = Deno.env.get('PAYPAL_MODE') || 'sandbox';
  
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${data.error_description || 'Unknown error'}`);
  }

  return data.access_token;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚫 [paypal-cancel-subscription] Inizio...');

    const { reason } = await req.json();

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

    // Recupera professional
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      throw new Error('Professional non trovato');
    }

    // Recupera subscription PayPal
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('paypal_subscription_id, payment_provider')
      .eq('professional_id', professional.id)
      .maybeSingle();

    if (subError || !subscription) {
      throw new Error('Nessuna subscription trovata');
    }

    if (subscription.payment_provider !== 'paypal') {
      throw new Error('Questa subscription non è PayPal');
    }

    if (!subscription.paypal_subscription_id) {
      throw new Error('ID subscription PayPal non trovato');
    }

    console.log('💳 PayPal Subscription ID:', subscription.paypal_subscription_id);

    // Ottieni access token PayPal
    const accessToken = await getPayPalAccessToken();
    
    const mode = Deno.env.get('PAYPAL_MODE') || 'sandbox';
    const baseUrl = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';

    // Cancella subscription su PayPal
    const cancelResponse = await fetch(
      `${baseUrl}/v1/billing/subscriptions/${subscription.paypal_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason: reason || 'Cancellation requested by user',
        }),
      }
    );

    if (!cancelResponse.ok && cancelResponse.status !== 204) {
      const errorData = await cancelResponse.json();
      throw new Error(`PayPal cancel failed: ${errorData.message || 'Unknown error'}`);
    }

    console.log('✅ Subscription cancellata su PayPal');

    // Aggiorna DB locale
    const { error: updateError } = await supabase
      .from('professional_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', professional.id);

    if (updateError) {
      console.error('⚠️ Errore aggiornamento DB:', updateError);
    }

    // Crea notifica
    await supabase.from('professional_notifications').insert({
      professional_id: professional.id,
      type: 'subscription',
      title: 'Abbonamento PayPal cancellato',
      message: 'Il tuo abbonamento Prime Business è stato cancellato.',
      is_read: false,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription cancellata' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ [paypal-cancel-subscription] Errore:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
