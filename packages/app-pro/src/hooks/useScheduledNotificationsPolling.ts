import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Polling ogni 30 secondi per i promemoria scaduti del professionista.
 * Se trova promemoria pending con scheduled_for <= now():
 * 1. Inserisce in professional_notifications (trigger Realtime → suono + notifica)
 * 2. Aggiorna scheduled_notifications → status = 'sent'
 *
 * Lavora in tandem con l'Edge Function cron (ogni 1 min).
 * Il primo che processa il promemoria lo segna come 'sent',
 * l'altro non lo trova più. Zero duplicati.
 */
export function useScheduledNotificationsPolling(professionalId: string | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!professionalId) return;

    const checkPendingReminders = async () => {
      try {
        const now = new Date().toISOString();

        const { data: pending, error: fetchError } = await supabase
          .from('scheduled_notifications')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('status', 'pending')
          .lte('scheduled_for', now)
          .order('scheduled_for', { ascending: true })
          .limit(10);

        if (fetchError || !pending || pending.length === 0) return;

        for (const notification of pending) {
          const { error: insertError } = await supabase
            .from('professional_notifications')
            .insert({
              professional_id: notification.professional_id,
              type: notification.type || 'custom',
              title: notification.title,
              message: notification.message,
              data: notification.data ?? {},
              is_read: false,
            });

          if (insertError) {
            console.error('Polling: errore inserimento notifica:', insertError);
            continue;
          }

          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'sent',
              sent_at: now,
              updated_at: now,
            })
            .eq('id', notification.id)
            .eq('status', 'pending');
        }
      } catch (err) {
        console.error('Polling scheduled notifications error:', err);
      }
    };

    checkPendingReminders();
    intervalRef.current = setInterval(checkPendingReminders, 30_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [professionalId]);
}
