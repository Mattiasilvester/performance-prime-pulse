// Edge Function per aggiornare payment method nel database (bypassa RLS)
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('💳 [stripe-update-payment-method] Inizio...');

    const { professional_id, payment_method_id, stripe_customer_id, card_last4, card_brand, card_exp_month, card_exp_year } = await req.json();

    if (!professional_id || !payment_method_id) {
      throw new Error('professional_id e payment_method_id sono obbligatori');
    }

    // Import dinamico
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifica autenticazione utente (ma usa Service Role per DB)
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
    console.log('💳 Professional ID:', professional_id);
    console.log('💳 Payment Method ID:', payment_method_id);

    // Verifica che il professional appartenga all'utente
    const { data: professional, error: profError } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', professional_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (profError || !professional) {
      throw new Error('Professional non trovato o non autorizzato');
    }

    // Verifica se esiste già una subscription
    const { data: existingSubscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('id')
      .eq('professional_id', professional_id)
      .maybeSingle();

    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    // Prepara dati da aggiornare
    const updateData: any = {
      payment_method_id,
      updated_at: new Date().toISOString(),
    };

    if (stripe_customer_id) {
      updateData.stripe_customer_id = stripe_customer_id;
    }
    if (card_last4) {
      updateData.card_last4 = card_last4;
    }
    if (card_brand) {
      updateData.card_brand = card_brand;
    }
    if (card_exp_month) {
      updateData.card_exp_month = card_exp_month;
    }
    if (card_exp_year) {
      updateData.card_exp_year = card_exp_year;
    }

    console.log('💾 Dati da salvare:', updateData);

    let result;

    if (existingSubscription) {
      // Aggiorna record esistente
      console.log('🔄 Aggiornamento record esistente...');
      const { data, error } = await supabase
        .from('professional_subscriptions')
        .update(updateData)
        .eq('professional_id', professional_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore aggiornamento:', error);
        throw error;
      }
      result = data;
      console.log('✅ Subscription aggiornata');
    } else {
      // Crea nuovo record
      console.log('➕ Creazione nuovo record...');
      const { data, error } = await supabase
        .from('professional_subscriptions')
        .insert({
          professional_id,
          ...updateData,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Errore inserimento:', error);
        throw error;
      }
      result = data;
      console.log('✅ Nuova subscription creata');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ [stripe-update-payment-method] Errore:', error);
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
