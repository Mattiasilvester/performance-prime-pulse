// Edge Function per gestire webhook Stripe
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
// NOTA: Import dinamico di Stripe per evitare crash all'avvio (top-level import causa 404)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verifica webhook signature
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Missing Stripe environment variables');
    }

    // Import dinamico invece di top-level import
    const { default: Stripe } = await import('https://esm.sh/stripe@17.4.0');
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[STRIPE] Errore verifica webhook signature:', err);
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log(`[STRIPE] Webhook ricevuto: ${event.type}`);

    // 2. Inizializza Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Gestisci eventi
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseAdmin, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabaseAdmin, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabaseAdmin, invoice);
        break;
      }

      default:
        console.log(`[STRIPE] Evento non gestito: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[STRIPE] Errore in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

// Helper: Gestisce aggiornamento subscription
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
) {
  console.log(`[STRIPE] Aggiornamento subscription: ${subscription.id}`);

  const updateData: any = {
    status: mapStripeStatus(subscription.status),
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  };

  // Aggiorna payment method se presente
  if (subscription.default_payment_method) {
    const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
    if (typeof paymentMethod === 'object' && paymentMethod.card) {
      updateData.payment_method_id = paymentMethod.id;
      updateData.card_last4 = paymentMethod.card.last4;
      updateData.card_brand = paymentMethod.card.brand;
      updateData.card_exp_month = paymentMethod.card.exp_month;
      updateData.card_exp_year = paymentMethod.card.exp_year;
    }
  }

  const { error } = await supabase
    .from('professional_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[STRIPE] Errore aggiornamento subscription:', error);
    throw error;
  }

  console.log(`[STRIPE] Subscription ${subscription.id} aggiornata`);

  // Notifica se cancel_at_period_end è diventato true (cancellazione programmata)
  // Verifica se prima era false e ora è true (nuova cancellazione programmata)
  if (subscription.cancel_at_period_end === true) {
    // Recupera subscription aggiornata dal database per avere la data formattata correttamente
    // (usa la stessa logica del frontend per evitare discrepanze di timezone)
    const { data: updatedSub, error: fetchError } = await supabase
      .from('professional_subscriptions')
      .select('current_period_end')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    // Formatta data per notifica usando la stessa logica del frontend
    let formattedDate = 'fine periodo corrente';
    if (updatedSub?.current_period_end) {
      // Usa la data ISO dal database (stessa logica del frontend)
      const date = new Date(updatedSub.current_period_end);
      formattedDate = date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    await sendSubscriptionNotification(
      supabaseAdmin,
      subscription.id,
      'subscription_cancellation_scheduled',
      'Abbonamento in cancellazione',
      `Il tuo abbonamento Prime Business verrà cancellato il ${formattedDate}. Continuerai ad avere accesso fino a quella data.`
    );
  }
}

// Helper: Gestisce creazione subscription
async function handleSubscriptionCreated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
) {
  console.log(`[STRIPE] Creazione subscription: ${subscription.id}`);

  // Trova professional_id dalla subscription
  const { data: subData, error: subError } = await supabase
    .from('professional_subscriptions')
    .select('professional_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (subError || !subData) {
    console.error('[STRIPE] Subscription non trovata nel database:', subscription.id);
    return;
  }

  // Invia notifica creazione abbonamento
  await sendSubscriptionNotification(
    supabase,
    subscription.id,
    'subscription_created',
    'Abbonamento attivato',
    'Il tuo abbonamento Prime Business è stato attivato con successo! Benvenuto nella community PrimePro.'
  );
}

// Helper: Gestisce cancellazione subscription
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
) {
  console.log(`[STRIPE] Cancellazione subscription: ${subscription.id}`);

  // Recupera professional_id e cancellation_reason prima di aggiornare
  const { data: subData, error: fetchError } = await supabase
    .from('professional_subscriptions')
    .select('professional_id, cancellation_reason')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (fetchError || !subData) {
    console.error('[STRIPE] Subscription non trovata per cancellazione:', subscription.id);
    return;
  }

  const { error } = await supabase
    .from('professional_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[STRIPE] Errore cancellazione subscription:', error);
    throw error;
  }

  console.log(`[STRIPE] Subscription ${subscription.id} cancellata`);

  // Invia notifica cancellazione
  await sendSubscriptionNotification(
    supabase,
    subscription.id,
    'subscription_cancelled',
    'Abbonamento cancellato',
    'Il tuo abbonamento Prime Business è stato cancellato. Grazie per aver utilizzato PrimePro!'
  );
}

// Helper: Gestisce invoice pagata
async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
) {
  console.log(`[STRIPE] Invoice pagata: ${invoice.id}`);

  if (!invoice.subscription || typeof invoice.subscription !== 'string') {
    console.log('[STRIPE] Invoice senza subscription, skip');
    return;
  }

  // Recupera subscription_id dal database
  const { data: subscription, error: subError } = await supabase
    .from('professional_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription)
    .maybeSingle();

  if (subError || !subscription) {
    console.error('[STRIPE] Subscription non trovata per invoice:', invoice.subscription);
    return;
  }

  // Crea o aggiorna invoice nel database
  const invoiceData = {
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: typeof invoice.payment_intent === 'string' 
      ? invoice.payment_intent 
      : invoice.payment_intent?.id || null,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status || 'paid',
    invoice_pdf_url: invoice.invoice_pdf || null,
    hosted_invoice_url: invoice.hosted_invoice_url || null,
    invoice_date: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    paid_at: new Date().toISOString(),
  };

  const { error: invoiceError } = await supabase
    .from('subscription_invoices')
    .upsert(invoiceData, {
      onConflict: 'stripe_invoice_id',
    });

  if (invoiceError) {
    console.error('[STRIPE] Errore creazione invoice:', invoiceError);
    throw invoiceError;
  }

  console.log(`[STRIPE] Invoice ${invoice.id} salvata`);
}

// Helper: Gestisce invoice payment failed
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
) {
  console.log(`[STRIPE] Invoice payment failed: ${invoice.id}`);

  if (!invoice.subscription || typeof invoice.subscription !== 'string') {
    return;
  }

  // Aggiorna status subscription a past_due
  const { error } = await supabase
    .from('professional_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('stripe_subscription_id', invoice.subscription);

  if (error) {
    console.error('[STRIPE] Errore aggiornamento subscription past_due:', error);
    throw error;
  }

  console.log(`[STRIPE] Subscription ${invoice.subscription} aggiornata a past_due`);

  // Invia notifica pagamento fallito
  await sendSubscriptionNotification(
    supabase,
    invoice.subscription,
    'subscription_payment_failed',
    'Pagamento fallito',
    `Il pagamento dell'abbonamento Prime Business è fallito. Aggiorna il metodo di pagamento per continuare a usare PrimePro.`
  );
}

// Helper: Invia notifica per eventi subscription
async function sendSubscriptionNotification(
  supabase: ReturnType<typeof createClient>,
  stripeSubscriptionId: string,
  notificationType: string,
  title: string,
  message: string,
) {
  try {
    // Recupera professional_id dalla subscription
    const { data: subscription, error: subError } = await supabase
      .from('professional_subscriptions')
      .select('professional_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();

    if (subError || !subscription) {
      console.error('[STRIPE NOTIFICATION] Subscription non trovata:', stripeSubscriptionId);
      return;
    }

    // Crea notifica nel database (tipo 'custom' per notifiche subscription)
    const { error: notifError } = await supabase
      .from('professional_notifications')
      .insert({
        professional_id: subscription.professional_id,
        type: 'custom', // Usa tipo 'custom' per notifiche subscription
        title,
        message,
        data: {
          notification_type: notificationType,
          stripe_subscription_id: stripeSubscriptionId,
        },
        is_read: false,
      });

    if (notifError) {
      console.error('[STRIPE NOTIFICATION] Errore creazione notifica:', notifError);
      // Non bloccare il flusso se la notifica fallisce
    } else {
      console.log(`[STRIPE NOTIFICATION] Notifica ${notificationType} creata per professional ${subscription.professional_id}`);
    }
  } catch (err) {
    console.error('[STRIPE NOTIFICATION] Errore invio notifica:', err);
    // Non bloccare il flusso principale
  }
}

// Helper: Mappa status Stripe a status database
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'trialing': 'trialing',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'incomplete': 'incomplete',
    'incomplete_expired': 'unpaid',
    'unpaid': 'unpaid',
  };

  return statusMap[stripeStatus] || 'incomplete';
}
