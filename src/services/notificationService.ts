// src/services/notificationService.ts

import { supabase } from '@/integrations/supabase/client';
import type { ProfessionalNotification } from '@/hooks/usePartnerNotifications';

interface CreateNotificationParams {
  professionalId: string;
  type: ProfessionalNotification['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Crea una notifica per un professionista
 * Verifica le preferenze utente prima di creare la notifica
 */
export async function createNotification({
  professionalId,
  type,
  title,
  message,
  data = {}
}: CreateNotificationParams): Promise<void> {
  try {
    console.log('[CREATE NOTIFICATION] Inizio creazione notifica:', { professionalId, type, title });
    
    // Verifica se il professionista vuole ricevere questo tipo di notifica
    const shouldCreate = await shouldCreateNotification(professionalId, type);
    
    console.log('[CREATE NOTIFICATION] Should create:', shouldCreate);
    
    if (!shouldCreate) {
      // L'utente ha disabilitato questo tipo di notifica
      console.log('[CREATE NOTIFICATION] Notifica disabilitata dalle preferenze utente');
      return;
    }

    // Crea la notifica
    const { data: insertedData, error } = await supabase
      .from('professional_notifications')
      .insert({
        professional_id: professionalId,
        type,
        title,
        message,
        data,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      console.error('[CREATE NOTIFICATION] Errore creazione notifica:', error);
      console.error('[CREATE NOTIFICATION] Dettagli errore:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[CREATE NOTIFICATION] Notifica creata con successo:', insertedData?.id);

    // Invia notifica push (non blocca se fallisce)
    if (insertedData?.id) {
      sendPushNotificationAsync(professionalId, insertedData.id).catch((pushError) => {
        console.error('[CREATE NOTIFICATION] Errore invio push (non bloccante):', pushError);
        // Non bloccare il flusso se push fallisce
      });
    }
  } catch (err: any) {
    console.error('[CREATE NOTIFICATION] Errore in createNotification:', err);
    console.error('[CREATE NOTIFICATION] Stack trace:', err instanceof Error ? err.stack : 'N/A');
    // Non lanciare errore per non bloccare il flusso principale
    // Le notifiche sono un feature aggiuntivo
  }
}

/**
 * Invia notifica push in modo asincrono (non blocca)
 */
async function sendPushNotificationAsync(professionalId: string, notificationId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('[PUSH] Nessuna sessione, skip push');
      return;
    }

    // Chiama Edge Function per inviare push
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        professionalId,
        notificationId
      }
    });

    if (error) {
      console.error('[PUSH] Errore chiamata Edge Function:', error);
      return;
    }

    console.log('[PUSH] Push inviate con successo:', data);
  } catch (error) {
    console.error('[PUSH] Errore invio push:', error);
    // Non lanciare errore, push è opzionale
  }
}

/**
 * Verifica se il professionista vuole ricevere questo tipo di notifica
 * basandosi sulle preferenze in professional_settings
 */
async function shouldCreateNotification(
  professionalId: string,
  type: ProfessionalNotification['type']
): Promise<boolean> {
  try {
    console.log('[SHOULD CREATE] Verifica preferenze per:', { professionalId, type });
    
    // Carica le preferenze notifiche del professionista
    const { data: settings, error } = await supabase
      .from('professional_settings')
      .select('notify_new_booking, notify_booking_cancelled, notify_booking_reminder, notify_reviews')
      .eq('professional_id', professionalId)
      .maybeSingle();

    if (error) {
      console.log('[SHOULD CREATE] Errore query settings:', error);
      // Se non ci sono preferenze, crea la notifica (default: abilitato)
      return true;
    }

    if (!settings) {
      console.log('[SHOULD CREATE] Nessuna preferenza trovata, default: abilitato');
      // Se non ci sono preferenze, crea la notifica (default: abilitato)
      return true;
    }

    console.log('[SHOULD CREATE] Preferenze trovate:', settings);

    // Mappa tipo notifica a colonna preferenza
    const preferenceValue = getPreferenceValue(settings, type);
    
    console.log('[SHOULD CREATE] Valore preferenza per', type, ':', preferenceValue);
    
    // Se la preferenza non esiste o è undefined, default: abilitato
    if (preferenceValue === undefined || preferenceValue === null) {
      console.log('[SHOULD CREATE] Preferenza non definita, default: abilitato');
      return true;
    }

    const result = preferenceValue === true;
    console.log('[SHOULD CREATE] Risultato finale:', result);
    return result;
  } catch (err) {
    // In caso di errore, crea la notifica (fail-safe)
    console.error('[SHOULD CREATE] Errore verifica preferenze notifiche:', err);
    return true;
  }
}

/**
 * Mappa tipo notifica a valore preferenza in professional_settings
 */
function getPreferenceValue(
  settings: any,
  type: ProfessionalNotification['type']
): boolean | undefined {
  switch (type) {
    case 'new_booking':
    case 'booking_confirmed':
      return settings.notify_new_booking;
    case 'booking_cancelled':
      return settings.notify_booking_cancelled;
    case 'booking_reminder':
      return settings.notify_booking_reminder;
    case 'new_review':
    case 'review_response':
      // notify_reviews ora ha default true nel DB (dopo migrazione 20250123_fix_notify_reviews_default.sql)
      return settings.notify_reviews;
    case 'new_client':
    case 'new_project':
      // Per ora non c'è una preferenza specifica, default: abilitato
      return true;
    default:
      return true;
  }
}

/**
 * Crea notifica per nuova prenotazione
 */
export async function notifyNewBooking(
  professionalId: string,
  bookingData: {
    id: string;
    clientName: string;
    bookingDate: string;
    bookingTime: string;
    serviceName?: string;
  }
): Promise<void> {
  const date = new Date(bookingData.bookingDate);
  const formattedDate = date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  await createNotification({
    professionalId,
    type: 'new_booking',
    title: 'Nuova prenotazione',
    message: `${bookingData.clientName} ha prenotato per il ${formattedDate} alle ${bookingData.bookingTime}${bookingData.serviceName ? ` - ${bookingData.serviceName}` : ''}`,
    data: {
      booking_id: bookingData.id,
      client_name: bookingData.clientName,
      booking_date: bookingData.bookingDate,
      booking_time: bookingData.bookingTime,
      service_name: bookingData.serviceName
    }
  });
}

/**
 * Crea notifica per prenotazione confermata
 */
export async function notifyBookingConfirmed(
  professionalId: string,
  bookingData: {
    id: string;
    clientName: string;
    bookingDate: string;
    bookingTime: string;
  }
): Promise<void> {
  const date = new Date(bookingData.bookingDate);
  const formattedDate = date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long'
  });

  await createNotification({
    professionalId,
    type: 'booking_confirmed',
    title: 'Prenotazione confermata',
    message: `La prenotazione con ${bookingData.clientName} per il ${formattedDate} alle ${bookingData.bookingTime} è stata confermata`,
    data: {
      booking_id: bookingData.id,
      client_name: bookingData.clientName,
      booking_date: bookingData.bookingDate,
      booking_time: bookingData.bookingTime
    }
  });
}

/**
 * Crea notifica per prenotazione cancellata
 */
export async function notifyBookingCancelled(
  professionalId: string,
  bookingData: {
    id: string;
    clientName: string;
    bookingDate: string;
    bookingTime: string;
    reason?: string;
  }
): Promise<void> {
  const date = new Date(bookingData.bookingDate);
  const formattedDate = date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long'
  });

  await createNotification({
    professionalId,
    type: 'booking_cancelled',
    title: 'Prenotazione cancellata',
    message: `La prenotazione con ${bookingData.clientName} per il ${formattedDate} alle ${bookingData.bookingTime} è stata cancellata${bookingData.reason ? `: ${bookingData.reason}` : ''}`,
    data: {
      booking_id: bookingData.id,
      client_name: bookingData.clientName,
      booking_date: bookingData.bookingDate,
      booking_time: bookingData.bookingTime,
      reason: bookingData.reason
    }
  });
}

/**
 * Crea notifica per nuovo cliente
 */
export async function notifyNewClient(
  professionalId: string,
  clientData: {
    id: string;
    name: string;
    email?: string;
  }
): Promise<void> {
  await createNotification({
    professionalId,
    type: 'new_client',
    title: 'Nuovo cliente aggiunto',
    message: `${clientData.name} è stato aggiunto alla tua lista clienti${clientData.email ? ` (${clientData.email})` : ''}`,
    data: {
      client_id: clientData.id,
      client_name: clientData.name,
      client_email: clientData.email
    }
  });
}

/**
 * Crea notifica per nuovo progetto
 */
export async function notifyNewProject(
  professionalId: string,
  projectData: {
    id: string;
    name: string;
    clientName: string;
  }
): Promise<void> {
  await createNotification({
    professionalId,
    type: 'new_project',
    title: 'Nuovo progetto creato',
    message: `È stato creato il progetto "${projectData.name}" per ${projectData.clientName}`,
    data: {
      project_id: projectData.id,
      project_name: projectData.name,
      client_name: projectData.clientName
    }
  });
}

/**
 * Crea notifica per nuova recensione
 */
export async function notifyNewReview(
  professionalId: string,
  reviewData: {
    id: string;
    clientName: string;
    rating: number;
    comment?: string;
  }
): Promise<void> {
  await createNotification({
    professionalId,
    type: 'new_review',
    title: 'Nuova recensione ricevuta',
    message: `${reviewData.clientName} ha lasciato una recensione ${reviewData.rating}/5${reviewData.comment ? `: "${reviewData.comment.substring(0, 50)}${reviewData.comment.length > 50 ? '...' : ''}"` : ''}`,
    data: {
      review_id: reviewData.id,
      client_name: reviewData.clientName,
      rating: reviewData.rating,
      comment: reviewData.comment
    }
  });
}

/**
 * Crea notifica per risposta a recensione
 */
export async function notifyReviewResponse(
  professionalId: string,
  reviewData: {
    id: string;
    clientName: string;
  }
): Promise<void> {
  await createNotification({
    professionalId,
    type: 'review_response',
    title: 'Risposta a recensione',
    message: `Hai risposto alla recensione di ${reviewData.clientName}`,
    data: {
      review_id: reviewData.id,
      client_name: reviewData.clientName
    }
  });
}

/**
 * Crea notifica promemoria prenotazione
 */
export async function notifyBookingReminder(
  professionalId: string,
  bookingData: {
    id: string;
    clientName: string;
    bookingDate: string;
    bookingTime: string;
    hoursBefore: number;
  }
): Promise<string | null> {
  const date = new Date(bookingData.bookingDate);
  const formattedDate = date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long'
  });

  const hoursText = bookingData.hoursBefore >= 1 
    ? `${bookingData.hoursBefore} ${bookingData.hoursBefore === 1 ? 'ora' : 'ore'}`
    : `${Math.round(bookingData.hoursBefore * 60)} minuti`;

  try {
    const { data, error } = await supabase
      .from('professional_notifications')
      .insert({
        professional_id: professionalId,
        type: 'booking_reminder',
        title: 'Promemoria appuntamento',
        message: `Appuntamento con ${bookingData.clientName} tra ${hoursText} - ${formattedDate} alle ${bookingData.bookingTime}`,
        data: {
          booking_id: bookingData.id,
          client_name: bookingData.clientName,
          booking_date: bookingData.bookingDate,
          booking_time: bookingData.bookingTime,
          hours_before: bookingData.hoursBefore
        },
        is_read: false
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (err: any) {
    console.error('Errore creazione notifica promemoria:', err);
    return null;
  }
}
