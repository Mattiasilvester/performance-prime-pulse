// Servizio per creare e gestire notifiche programmate
import { supabase } from '@/integrations/supabase/client';
import { ProfessionalNotification } from '@/hooks/usePartnerNotifications';

export interface ScheduledNotification {
  id?: string;
  professional_id: string;
  type: ProfessionalNotification['type'] | 'custom';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  scheduled_for: Date | string; // Data/ora in cui inviare
  status?: 'pending' | 'sent' | 'cancelled' | 'failed';
  created_at?: string;
  updated_at?: string;
}

/**
 * Crea una notifica programmata
 */
export async function createScheduledNotification(
  notification: ScheduledNotification
): Promise<ScheduledNotification> {
  try {
    // Verifica che scheduled_for sia nel futuro
    const scheduledDate = new Date(notification.scheduled_for);
    const now = new Date();
    
    if (scheduledDate <= now) {
      throw new Error('La data programmata deve essere nel futuro');
    }

    // Converti Date a ISO string se necessario
    const scheduledForISO = scheduledDate instanceof Date 
      ? scheduledDate.toISOString() 
      : notification.scheduled_for;

    const { data, error } = await supabase
      .from('scheduled_notifications')
      .insert({
        professional_id: notification.professional_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        scheduled_for: scheduledForISO,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[ScheduledNotification] Errore creazione:', error);
      throw error;
    }

    console.log('[ScheduledNotification] Notifica programmata creata:', data);
    return data as ScheduledNotification;
  } catch (error) {
    console.error('[ScheduledNotification] Errore:', error);
    throw error;
  }
}

/**
 * Ottieni tutte le notifiche programmate per un professionista
 */
export async function getScheduledNotifications(
  professionalId: string,
  status?: 'pending' | 'sent' | 'cancelled' | 'failed'
): Promise<ScheduledNotification[]> {
  try {
    let query = supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('professional_id', professionalId)
      .order('scheduled_for', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ScheduledNotification] Errore fetch:', error);
      throw error;
    }

    return (data || []) as ScheduledNotification[];
  } catch (error) {
    console.error('[ScheduledNotification] Errore:', error);
    throw error;
  }
}

/**
 * Ottieni promemoria in attesa (status pending, scheduled_for nel futuro)
 */
export async function getUpcomingScheduledNotifications(
  professionalId: string
): Promise<ScheduledNotification[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('status', 'pending')
      .gt('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('[ScheduledNotification] Errore getUpcoming:', error);
      throw error;
    }
    return (data || []) as ScheduledNotification[];
  } catch (error) {
    console.error('[ScheduledNotification] Errore:', error);
    throw error;
  }
}

/**
 * Aggiorna una notifica programmata
 */
export async function updateScheduledNotification(
  id: string,
  payload: { title?: string; message?: string; scheduled_for?: Date | string }
): Promise<ScheduledNotification> {
  try {
    const body: Record<string, unknown> = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.message !== undefined) body.message = payload.message;
    if (payload.scheduled_for !== undefined) {
      body.scheduled_for = payload.scheduled_for instanceof Date
        ? payload.scheduled_for.toISOString()
        : payload.scheduled_for;
    }
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .update(body)
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data as ScheduledNotification;
  } catch (error) {
    console.error('[ScheduledNotification] Errore update:', error);
    throw error;
  }
}

/**
 * Elimina una notifica programmata (rimozione fisica)
 */
export async function removeScheduledNotification(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('[ScheduledNotification] Errore remove:', error);
    throw error;
  }
}

/**
 * Cancella una notifica programmata (soft: status → cancelled)
 */
export async function cancelScheduledNotification(
  scheduledNotificationId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({ status: 'cancelled' })
      .eq('id', scheduledNotificationId)
      .eq('status', 'pending'); // Solo se ancora pending

    if (error) {
      console.error('[ScheduledNotification] Errore cancellazione:', error);
      throw error;
    }

    console.log('[ScheduledNotification] Notifica programmata cancellata:', scheduledNotificationId);
  } catch (error) {
    console.error('[ScheduledNotification] Errore:', error);
    throw error;
  }
}

/**
 * Helper: Crea notifica programmata per domani alle 10:00
 */
export async function scheduleNotificationForTomorrow(
  professionalId: string,
  title: string,
  message: string,
  hour: number = 10,
  minute: number = 0
): Promise<ScheduledNotification> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);

  return createScheduledNotification({
    professional_id: professionalId,
    type: 'custom',
    title,
    message,
    scheduled_for: tomorrow
  });
}

/**
 * Helper: Crea notifica programmata per un numero specifico di ore/minuti da ora
 */
export async function scheduleNotificationIn(
  professionalId: string,
  title: string,
  message: string,
  hours: number,
  minutes: number = 0
): Promise<ScheduledNotification> {
  const scheduledDate = new Date();
  scheduledDate.setHours(scheduledDate.getHours() + hours);
  scheduledDate.setMinutes(scheduledDate.getMinutes() + minutes);
  scheduledDate.setSeconds(0, 0);

  return createScheduledNotification({
    professional_id: professionalId,
    type: 'custom',
    title,
    message,
    scheduled_for: scheduledDate
  });
}
