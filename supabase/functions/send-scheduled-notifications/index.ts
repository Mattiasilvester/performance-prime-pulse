/**
 * Edge Function: send-scheduled-notifications
 * Eseguita dal cron ogni 5 minuti. Legge promemoria scaduti da scheduled_notifications,
 * inserisce una riga in professional_notifications (Realtime → suono + notifica in-app),
 * aggiorna status a 'sent' e sent_at.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('[send-scheduled-notifications] Errore fetch:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'Nessun promemoria in scadenza' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const notification of pendingNotifications) {
      try {
        const notifType = notification.type && typeof notification.type === 'string'
          ? notification.type
          : 'custom';

        const { error: insertError } = await supabase.from('professional_notifications').insert({
          professional_id: notification.professional_id,
          type: notifType,
          title: notification.title,
          message: notification.message,
          data: notification.data ?? {},
          is_read: false,
        });

        if (insertError) {
          console.error(`[send-scheduled-notifications] Insert error ${notification.id}:`, insertError);
          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'failed',
              error_message: insertError.message,
              updated_at: now,
            })
            .eq('id', notification.id);
          errors++;
          continue;
        }

        const { error: updateError } = await supabase
          .from('scheduled_notifications')
          .update({
            status: 'sent',
            sent_at: now,
            updated_at: now,
          })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`[send-scheduled-notifications] Update error ${notification.id}:`, updateError);
          errors++;
        } else {
          processed++;
        }
      } catch (err) {
        console.error(`[send-scheduled-notifications] Processing ${notification.id}:`, err);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        processed,
        errors,
        total: pendingNotifications.length,
        message: `Processati ${processed}/${pendingNotifications.length} promemoria`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-scheduled-notifications] Errore generico:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
