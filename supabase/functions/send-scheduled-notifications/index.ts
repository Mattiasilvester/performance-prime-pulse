// Edge Function per inviare notifiche programmate
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crea client Supabase con service role (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[SCHEDULED-NOTIFICATIONS] Inizio controllo notifiche programmate...');

    const now = new Date();
    const nowISO = now.toISOString();

    // 1. Trova tutte le notifiche programmate da inviare
    // Cerca notifiche con scheduled_for <= now e status = 'pending'
    // Tolleranza: invia notifiche fino a 5 minuti dopo l'orario programmato
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    const { data: scheduledNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', fiveMinutesFromNow) // Invia se scheduled_for è entro 5 minuti da ora
      .gte('scheduled_for', fiveMinutesAgo) // Ma non più vecchie di 5 minuti
      .order('scheduled_for', { ascending: true });

    if (fetchError) {
      console.error('[SCHEDULED-NOTIFICATIONS] Errore fetch notifiche programmate:', fetchError);
      throw fetchError;
    }

    if (!scheduledNotifications || scheduledNotifications.length === 0) {
      console.log('[SCHEDULED-NOTIFICATIONS] Nessuna notifica programmata da inviare');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nessuna notifica da processare',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[SCHEDULED-NOTIFICATIONS] Trovate ${scheduledNotifications.length} notifiche da inviare`);

    let sentCount = 0;
    let failedCount = 0;

    // 2. Per ogni notifica programmata, crea la notifica effettiva
    for (const scheduled of scheduledNotifications) {
      try {
        console.log(`[SCHEDULED-NOTIFICATIONS] Invio notifica programmata: ${scheduled.id}`);

        // Crea la notifica effettiva in professional_notifications
        const { data: createdNotification, error: createError } = await supabase
          .from('professional_notifications')
          .insert({
            professional_id: scheduled.professional_id,
            type: scheduled.type,
            title: scheduled.title,
            message: scheduled.message,
            data: scheduled.data,
            is_read: false
          })
          .select()
          .single();

        if (createError) {
          console.error(`[SCHEDULED-NOTIFICATIONS] Errore creazione notifica per ${scheduled.id}:`, createError);
          
          // Marca come fallita
          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'failed',
              error_message: createError.message,
              updated_at: nowISO
            })
            .eq('id', scheduled.id);

          failedCount++;
          continue;
        }

        // Marca come inviata
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'sent',
            sent_at: nowISO,
            updated_at: nowISO
          })
          .eq('id', scheduled.id);

        console.log(`[SCHEDULED-NOTIFICATIONS] Notifica ${scheduled.id} inviata con successo`);
        sentCount++;

        // Chiama Edge Function per inviare push notification (se abilitata)
        // Non blocca se fallisce
        try {
          const pushResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-push-notification`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                professionalId: scheduled.professional_id,
                notificationId: createdNotification.id
              })
            }
          );

          if (!pushResponse.ok) {
            console.warn(`[SCHEDULED-NOTIFICATIONS] Push notification fallita per ${scheduled.id}`);
          }
        } catch (pushError) {
          console.warn(`[SCHEDULED-NOTIFICATIONS] Errore push notification (non bloccante):`, pushError);
        }

      } catch (error: any) {
        console.error(`[SCHEDULED-NOTIFICATIONS] Errore processamento notifica ${scheduled.id}:`, error);
        
        // Marca come fallita
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: error.message || 'Errore sconosciuto',
            updated_at: nowISO
          })
          .eq('id', scheduled.id);

        failedCount++;
      }
    }

    console.log(`[SCHEDULED-NOTIFICATIONS] Processamento completato: ${sentCount} inviate, ${failedCount} fallite`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: scheduledNotifications.length,
        sent: sentCount,
        failed: failedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[SCHEDULED-NOTIFICATIONS] Errore generale:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Errore sconosciuto' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
