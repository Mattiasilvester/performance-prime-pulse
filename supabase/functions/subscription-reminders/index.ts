// Edge Function per inviare notifiche proattive abbonamento
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendTransactional } from '../_shared/resend.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔔 [subscription-reminders] Inizio controllo notifiche...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const todayStr = today.toISOString().split('T')[0];
    const in3DaysStr = in3Days.toISOString().split('T')[0];
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    console.log(`📅 Oggi: ${todayStr}, Tra 3 giorni: ${in3DaysStr}, Mese corrente: ${currentMonth}/${currentYear}`);

    const notifications: Array<{
      professional_id: string;
      type: string;
      title: string;
      message: string;
      reminder_key: string;
    }> = [];

    // ========================================
    // 1. TRIAL IN SCADENZA
    // ========================================
    
    // Trial che scade tra oggi e 3 giorni
    const { data: trialSubscriptions, error: trialError } = await supabase
      .from('professional_subscriptions')
      .select('id, professional_id, trial_end')
      .eq('status', 'trialing')
      .gte('trial_end', todayStr)
      .lte('trial_end', in3DaysStr);

    if (trialError) {
      console.error('❌ Errore query trial:', trialError);
    } else {
      console.log(`🔍 Trial in scadenza trovati: ${trialSubscriptions?.length || 0}`);

      for (const sub of trialSubscriptions || []) {
        if (!sub.trial_end) continue;

        const trialEnd = new Date(sub.trial_end);
        trialEnd.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((trialEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Usa solo la parte data (YYYY-MM-DD) per reminder_key, non l'intera ISO string
        const trialEndDateStr = trialEnd.toISOString().split('T')[0];

        if (daysRemaining === 3) {
          notifications.push({
            professional_id: sub.professional_id,
            type: 'custom', // Usa 'custom' per notifiche subscription (coerente con stripe-webhook)
            title: 'Il tuo periodo di prova scade tra 3 giorni',
            message: 'Aggiungi un metodo di pagamento per continuare a usare PrimePro senza interruzioni.',
            reminder_key: `trial_3d_${trialEndDateStr}`,
          });
        } else if (daysRemaining === 0) {
          notifications.push({
            professional_id: sub.professional_id,
            type: 'custom', // Usa 'custom' per notifiche subscription (coerente con stripe-webhook)
            title: 'Il tuo periodo di prova scade oggi!',
            message: 'Aggiungi subito un metodo di pagamento per non perdere l\'accesso alle funzionalità premium.',
            reminder_key: `trial_today_${trialEndDateStr}`,
          });
        }
      }
    }

    // ========================================
    // 2. PAGAMENTO IN SCADENZA
    // ========================================
    
    // Subscription attive con pagamento tra oggi e 3 giorni
    const { data: paymentSubscriptions, error: paymentError } = await supabase
      .from('professional_subscriptions')
      .select('id, professional_id, current_period_end, price_cents')
      .eq('status', 'active')
      .gte('current_period_end', todayStr)
      .lte('current_period_end', in3DaysStr);

    if (paymentError) {
      console.error('❌ Errore query pagamenti:', paymentError);
    } else {
      console.log(`🔍 Pagamenti in scadenza trovati: ${paymentSubscriptions?.length || 0}`);

      for (const sub of paymentSubscriptions || []) {
        if (!sub.current_period_end) continue;

        const periodEnd = new Date(sub.current_period_end);
        periodEnd.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const priceCents = sub.price_cents || 5000; // Default €50 se non specificato
        const priceFormatted = `€${(priceCents / 100).toFixed(2).replace('.', ',')}`;
        
        // Usa solo la parte data (YYYY-MM-DD) per reminder_key, non l'intera ISO string
        const periodEndDateStr = periodEnd.toISOString().split('T')[0];

        if (daysRemaining === 3) {
          notifications.push({
            professional_id: sub.professional_id,
            type: 'custom', // Usa 'custom' per notifiche subscription (coerente con stripe-webhook)
            title: 'Prossimo pagamento tra 3 giorni',
            message: `Il rinnovo del tuo abbonamento Prime Business (${priceFormatted}) è previsto tra 3 giorni.`,
            reminder_key: `payment_3d_${periodEndDateStr}`,
          });
        } else if (daysRemaining === 0) {
          notifications.push({
            professional_id: sub.professional_id,
            type: 'custom', // Usa 'custom' per notifiche subscription (coerente con stripe-webhook)
            title: 'Pagamento abbonamento oggi',
            message: `Il rinnovo del tuo abbonamento Prime Business (${priceFormatted}) è previsto oggi.`,
            reminder_key: `payment_today_${periodEndDateStr}`,
          });
        }
      }
    }

    // ========================================
    // 3. CARTA IN SCADENZA
    // ========================================
    
    // Carte che scadono questo mese
    const { data: cardSubscriptions, error: cardError } = await supabase
      .from('professional_subscriptions')
      .select('id, professional_id, card_exp_month, card_exp_year, card_last4, card_brand')
      .in('status', ['trialing', 'active'])
      .eq('card_exp_month', currentMonth)
      .eq('card_exp_year', currentYear)
      .not('card_last4', 'is', null);

    if (cardError) {
      console.error('❌ Errore query carte:', cardError);
    } else {
      console.log(`🔍 Carte in scadenza questo mese: ${cardSubscriptions?.length || 0}`);

      for (const sub of cardSubscriptions || []) {
        if (!sub.card_last4 || !sub.card_exp_month || !sub.card_exp_year) continue;

        const cardBrand = sub.card_brand 
          ? sub.card_brand.charAt(0).toUpperCase() + sub.card_brand.slice(1) 
          : 'Carta';
        
        notifications.push({
          professional_id: sub.professional_id,
          type: 'custom', // Usa 'custom' per notifiche subscription (coerente con stripe-webhook)
          title: 'La tua carta sta per scadere',
          message: `La tua ${cardBrand} •••• ${sub.card_last4} scade questo mese. Aggiorna il metodo di pagamento per evitare interruzioni.`,
          reminder_key: `card_exp_${sub.professional_id}_${currentMonth}_${currentYear}`,
        });
      }
    }

    // ========================================
    // 4. EMAIL TRIAL: recupera email professionisti (solo per reminder trial)
    // ========================================
    const trialNotifs = notifications.filter((n) =>
      n.reminder_key.startsWith('trial_3d_') || n.reminder_key.startsWith('trial_today_')
    );
    const trialProfIds = [...new Set(trialNotifs.map((n) => n.professional_id))];
    let emailByProfId: Record<string, string> = {};
    if (trialProfIds.length > 0) {
      const { data: profs } = await supabase
        .from('professionals')
        .select('id, email')
        .in('id', trialProfIds);
      if (profs) {
        emailByProfId = Object.fromEntries(profs.map((p) => [p.id, p.email]).filter(([, e]) => e));
      }
    }

    // ========================================
    // 5. INSERIMENTO NOTIFICHE (con deduplicazione) + invio email trial
    // ========================================
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    let emailsSent = 0;

    for (const notif of notifications) {
      try {
        // Verifica se notifica già esiste (deduplicazione usando data JSONB)
        const { data: existingNotifications } = await supabase
          .from('professional_notifications')
          .select('id, data')
          .eq('professional_id', notif.professional_id)
          .eq('type', notif.type)
          .order('created_at', { ascending: false })
          .limit(100);

        const existing = existingNotifications?.find(
          (n) => n.data && (n.data as any).reminder_key === notif.reminder_key
        );

        if (existing) {
          console.log(`⏭️ Notifica già esistente: ${notif.reminder_key} per professional ${notif.professional_id}`);
          skipped++;
          continue;
        }

        // Crea notifica
        const { error: insertError } = await supabase
          .from('professional_notifications')
          .insert({
            professional_id: notif.professional_id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            data: { 
              reminder_key: notif.reminder_key,
              notification_type: 'subscription_reminder',
            },
            is_read: false,
          });

        if (insertError) {
          console.error(`❌ Errore creazione notifica per ${notif.professional_id}:`, insertError);
          errors++;
        } else {
          console.log(`✅ Notifica creata: ${notif.title} per professional ${notif.professional_id}`);
          created++;

          // Email reminder trial (3 giorni prima + giorno stesso) via Resend
          const isTrialReminder =
            notif.reminder_key.startsWith('trial_3d_') || notif.reminder_key.startsWith('trial_today_');
          const toEmail = emailByProfId[notif.professional_id];
          if (isTrialReminder && toEmail) {
            const emailResult = await sendTransactional({
              to: toEmail,
              subject: notif.title,
              text: `${notif.title}\n\n${notif.message}\n\nAccedi alla dashboard per aggiungere un metodo di pagamento: https://app.primepro.it/partner/dashboard/abbonamento\n\nIl team PrimePro`,
            });
            if (emailResult.ok) {
              emailsSent++;
              console.log(`📧 Email trial reminder inviata a ${toEmail}`);
            } else if (!emailResult.skipped) {
              console.warn(`⚠️ Email trial non inviata:`, emailResult.error);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Errore processing notifica per ${notif.professional_id}:`, err);
        errors++;
      }
    }

    const result = {
      success: true,
      summary: {
        total_checked: notifications.length,
        created,
        skipped,
        errors,
        emails_sent: emailsSent,
        date: todayStr,
      },
    };

    console.log('🔔 [subscription-reminders] Completato:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [subscription-reminders] Errore:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
