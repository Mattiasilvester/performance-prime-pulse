// Edge Function per inviare notifiche push quando arrivano nuove notifiche professionali
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// VAPID keys per Web Push (da configurare in Supabase Dashboard → Settings → Edge Functions → Secrets)
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:your-email@example.com';

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Invia una notifica push usando Web Push API
 * Usa fetch per chiamare il push service (FCM, Mozilla, ecc.)
 */
async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; message: string; data?: any }
): Promise<boolean> {
  try {
    // Per ora, usiamo un approccio semplificato
    // In produzione, dovresti usare una libreria web-push per Deno
    // o chiamare un servizio esterno che gestisce le push
    
    // Payload della notifica
    const notificationPayload = JSON.stringify({
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      icon: '/images/logo-pp-transparent.png',
      badge: '/images/logo-pp-transparent.png',
      tag: `notification-${payload.data?.notification_id || Date.now()}`,
      requireInteraction: false
    });

    // Invia la push notification
    // NOTA: Per una implementazione completa, serve crittografia VAPID
    // Per ora, questa è una struttura base che può essere estesa
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400' // 24 ore
      },
      body: notificationPayload
    });

    if (!response.ok) {
      console.error(`[PUSH] Errore invio push: ${response.status} ${response.statusText}`);
      return false;
    }

    console.log('[PUSH] Push notification inviata con successo');
    return true;
  } catch (error) {
    console.error('[PUSH] Errore invio push notification:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crea client Supabase con service role (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { notificationId, professionalId } = await req.json();

    if (!notificationId || !professionalId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'notificationId e professionalId sono richiesti' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[PUSH] Invio push per notifica:', { notificationId, professionalId });

    // 1. Carica i dettagli della notifica
    const { data: notification, error: notificationError } = await supabase
      .from('professional_notifications')
      .select('id, type, title, message, data')
      .eq('id', notificationId)
      .eq('professional_id', professionalId)
      .single();

    if (notificationError || !notification) {
      console.error('[PUSH] Errore caricamento notifica:', notificationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Notifica non trovata' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Carica tutte le subscription push attive per questo professionista
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('professional_id', professionalId)
      .eq('is_active', true);

    if (subscriptionsError) {
      console.error('[PUSH] Errore caricamento subscription:', subscriptionsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Errore caricamento subscription' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[PUSH] Nessuna subscription attiva per questo professionista');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nessuna subscription attiva',
          sent: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 3. Invia push a tutte le subscription
    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const pushSubscription: PushSubscription = {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth
      };

      const success = await sendPushNotification(pushSubscription, {
        title: notification.title,
        message: notification.message,
        data: {
          notification_id: notification.id,
          type: notification.type,
          ...notification.data
        }
      });

      if (success) {
        sentCount++;
        // Aggiorna last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('endpoint', sub.endpoint);
      } else {
        failedCount++;
        // Se fallisce più volte, marca come inattiva
        // (implementazione futura: tracking errori)
      }
    }

    console.log('[PUSH] Push inviate:', { sent: sentCount, failed: failedCount });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        failed: failedCount,
        total: subscriptions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[PUSH] Errore generale:', error);
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
