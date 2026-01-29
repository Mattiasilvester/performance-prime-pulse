// Edge Function per gestire webhook PayPal
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
    console.log('🔔 [paypal-webhook] Evento ricevuto');

    const body = await req.json();
    const eventType = body.event_type;

    console.log('📌 Event Type:', eventType);
    console.log('📦 Resource:', JSON.stringify(body.resource, null, 2));

    // Import dinamico
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resource = body.resource;
    const subscriptionId = resource.id || resource.billing_agreement_id;

    if (!subscriptionId) {
      console.log('⚠️ Nessun subscription ID trovato');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Trova subscription nel DB
    const { data: subscription } = await supabase
      .from('professional_subscriptions')
      .select('professional_id')
      .eq('paypal_subscription_id', subscriptionId)
      .maybeSingle();

    if (!subscription) {
      console.log('⚠️ Subscription non trovata nel DB:', subscriptionId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const professionalId = subscription.professional_id;

    // Gestisci eventi
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Non sovrascrivere status: se abbiamo trial (trialing) lo manteniamo;
        // quando scade il trial PayPal invia PAYMENT.SALE.COMPLETED e lì passiamo ad active
        console.log('✅ Subscription approvata (trial o attiva)');
        await supabase
          .from('professional_subscriptions')
          .update({ updated_at: new Date().toISOString() })
          .eq('paypal_subscription_id', subscriptionId);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        console.log('🚫 Subscription cancellata');
        await supabase
          .from('professional_subscriptions')
          .update({ 
            status: 'canceled', 
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString() 
          })
          .eq('paypal_subscription_id', subscriptionId);
        
        await supabase.from('professional_notifications').insert({
          professional_id: professionalId,
          type: 'subscription',
          title: 'Abbonamento cancellato',
          message: 'Il tuo abbonamento Prime Business PayPal è stato cancellato.',
          is_read: false,
        });
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        console.log('⏸️ Subscription sospesa');
        await supabase
          .from('professional_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('paypal_subscription_id', subscriptionId);
        
        await supabase.from('professional_notifications').insert({
          professional_id: professionalId,
          type: 'subscription',
          title: 'Pagamento in ritardo',
          message: 'Il pagamento del tuo abbonamento PayPal è in ritardo. Aggiorna il metodo di pagamento.',
          is_read: false,
        });
        break;

      case 'PAYMENT.SALE.COMPLETED':
        console.log('💰 Pagamento completato');
        
        // Crea fattura
        const amount = resource.amount?.total || '50.00';
        const amountCents = Math.round(parseFloat(amount) * 100);
        
        await supabase.from('subscription_invoices').insert({
          professional_id: professionalId,
          paypal_invoice_id: resource.id,
          amount_cents: amountCents,
          currency: resource.amount?.currency || 'EUR',
          status: 'paid',
          invoice_date: new Date().toISOString(),
          paid_at: new Date().toISOString(),
        });

        // Aggiorna periodo subscription
        await supabase
          .from('professional_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);

        await supabase.from('professional_notifications').insert({
          professional_id: professionalId,
          type: 'subscription',
          title: 'Pagamento ricevuto',
          message: `Abbiamo ricevuto il pagamento di €${(amountCents / 100).toFixed(2)} per il tuo abbonamento.`,
          is_read: false,
        });
        break;

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED':
        console.log('❌ Pagamento fallito/rimborsato');
        await supabase
          .from('professional_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('paypal_subscription_id', subscriptionId);
        
        await supabase.from('professional_notifications').insert({
          professional_id: professionalId,
          type: 'subscription',
          title: 'Problema pagamento',
          message: 'C\'è stato un problema con il pagamento PayPal. Verifica il tuo account.',
          is_read: false,
        });
        break;

      default:
        console.log('ℹ️ Evento non gestito:', eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [paypal-webhook] Errore:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
