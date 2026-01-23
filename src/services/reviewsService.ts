// src/services/reviewsService.ts

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface Review {
  id: string;
  professional_id: string;
  user_id: string;
  booking_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  response_at: string | null;
  is_visible: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
  };
}

export interface CreateReviewData {
  professional_id: string;
  user_id: string;
  booking_id?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string | null;
  comment?: string | null;
}

export interface ReviewResponseData {
  response: string;
}

// ============================================
// FETCH REVIEWS BY PROFESSIONAL
// ============================================

/**
 * Ottiene tutte le recensioni per un professionista (per dashboard professionista)
 * @param professionalId - ID del professionista
 * @param onlyVisible - Se true, mostra solo recensioni visibili (default: false per dashboard)
 * @returns Array di recensioni con dati utente
 */
export async function getReviewsByProfessional(
  professionalId: string,
  onlyVisible: boolean = true
): Promise<Review[]> {
  try {
    // Build query base
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('professional_id', professionalId);

    // Applica filtro is_visible solo se richiesto
    if (onlyVisible) {
      query = query.eq('is_visible', true);
    }

    // Esegui query
    const { data: reviewsData, error: reviewsError } = await query
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error('Errore fetch recensioni:', reviewsError);
      throw reviewsError;
    }

    if (!reviewsData || reviewsData.length === 0) {
      return [];
    }

    // Fetch profili per ogni recensione
    const userIds = [...new Set(reviewsData.map((r: any) => r.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.warn('Errore fetch profili per recensioni:', profilesError);
      // Continua comunque senza dati utente
    }

    // Crea mappa profili
    const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

    // Combina recensioni con profili
    const reviewsWithUsers = reviewsData.map((review: any) => ({
      ...review,
      user: profilesMap.get(review.user_id) || null,
    }));

    return reviewsWithUsers;
  } catch (error) {
    console.error('Errore getReviewsByProfessional:', error);
    return [];
  }
}

// ============================================
// CREATE REVIEW
// ============================================

/**
 * Crea una nuova recensione
 * @param reviewData - Dati recensione
 * @returns Recensione creata o null
 */
export async function createReview(reviewData: CreateReviewData): Promise<Review | null> {
  try {
    // Verifica se il booking esiste e è completato (per is_verified)
    let isVerified = false;
    if (reviewData.booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', reviewData.booking_id)
        .single();
      
      isVerified = booking?.status === 'completed';
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        professional_id: reviewData.professional_id,
        user_id: reviewData.user_id,
        booking_id: reviewData.booking_id || null,
        rating: reviewData.rating,
        title: reviewData.title || null,
        comment: reviewData.comment || null,
        is_visible: true,
        is_verified: isVerified,
      })
      .select()
      .single();

    if (error) {
      console.error('Errore creazione recensione:', error);
      throw error;
    }

    // Crea notifica per nuova recensione (in background, non blocca il flusso)
    if (data) {
      try {
        console.log('[NOTIFICA RECENSIONE] Inizio creazione notifica per recensione:', data.id);
        console.log('[NOTIFICA RECENSIONE] Professional ID:', reviewData.professional_id);
        console.log('[NOTIFICA RECENSIONE] User ID:', reviewData.user_id);
        
        // Recupera nome cliente per la notifica
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', reviewData.user_id)
          .maybeSingle();

        if (profileError) {
          console.error('[NOTIFICA RECENSIONE] Errore recupero profilo:', profileError);
        }

        const clientName = profileData 
          ? `${profileData.first_name} ${profileData.last_name}`.trim()
          : 'Cliente';

        console.log('[NOTIFICA RECENSIONE] Nome cliente:', clientName);

        const { notifyNewReview } = await import('@/services/notificationService');
        await notifyNewReview(reviewData.professional_id, {
          id: data.id,
          clientName,
          rating: reviewData.rating,
          comment: reviewData.comment || undefined
        });
        
        console.log('[NOTIFICA RECENSIONE] Notifica creata con successo');
      } catch (notifErr) {
        // Non bloccare il flusso se la notifica fallisce
        console.error('[NOTIFICA RECENSIONE] Errore creazione notifica recensione:', notifErr);
        console.error('[NOTIFICA RECENSIONE] Stack trace:', notifErr instanceof Error ? notifErr.stack : 'N/A');
      }
    }

    return data;
  } catch (error) {
    console.error('Errore createReview:', error);
    throw error; // Rilancia per gestione errori nel componente
  }
}

// ============================================
// UPDATE REVIEW
// ============================================

/**
 * Aggiorna una recensione esistente
 * @param reviewId - ID recensione
 * @param updateData - Dati da aggiornare
 * @returns Recensione aggiornata o null
 */
export async function updateReview(
  reviewId: string,
  updateData: UpdateReviewData
): Promise<Review | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Errore aggiornamento recensione:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Errore updateReview:', error);
    return null;
  }
}

// ============================================
// DELETE REVIEW
// ============================================

/**
 * Elimina una recensione
 * @param reviewId - ID recensione
 * @returns true se eliminata con successo
 */
export async function deleteReview(reviewId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Errore eliminazione recensione:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Errore deleteReview:', error);
    return false;
  }
}

// ============================================
// CHECK IF USER CAN REVIEW
// ============================================

/**
 * Verifica se l'utente può lasciare una recensione per un professionista
 * @param userId - ID utente
 * @param professionalId - ID professionista
 * @returns Array di booking completati per cui l'utente può lasciare recensione
 */
export async function getAvailableBookingsForReview(
  userId: string,
  professionalId: string
): Promise<Array<{ id: string; booking_date: string; booking_time: string; service_name?: string }>> {
  try {
    // Fetch booking completati dell'utente con questo professionista
    const { data: completedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service:professional_services(name)
      `)
      .eq('user_id', userId)
      .eq('professional_id', professionalId)
      .eq('status', 'completed')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (bookingsError) {
      console.error('Errore fetch booking completati:', bookingsError);
      return [];
    }

    if (!completedBookings || completedBookings.length === 0) {
      return [];
    }

    // Fetch recensioni esistenti per questi booking
    const bookingIds = completedBookings.map(b => b.id);
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('user_id', userId)
      .eq('professional_id', professionalId)
      .in('booking_id', bookingIds);

    if (reviewsError) {
      console.warn('Errore fetch recensioni esistenti:', reviewsError);
      // Continua comunque
    }

    // Filtra booking per cui non esiste già una recensione
    const reviewedBookingIds = new Set((existingReviews || []).map(r => r.booking_id));
    const availableBookings = completedBookings
      .filter(b => !reviewedBookingIds.has(b.id))
      .map(b => ({
        id: b.id,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        service_name: (b.service as any)?.name || null,
      }));

    return availableBookings;
  } catch (error) {
    console.error('Errore getAvailableBookingsForReview:', error);
    return [];
  }
}

/**
 * Verifica se l'utente ha già lasciato una recensione per un professionista (senza booking specifico)
 * @param userId - ID utente
 * @param professionalId - ID professionista
 * @returns true se ha già lasciato una recensione senza booking_id
 */
export async function hasUserReviewedProfessional(
  userId: string,
  professionalId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('professional_id', professionalId)
      .is('booking_id', null)
      .limit(1);

    if (error) {
      console.error('Errore verifica recensione esistente:', error);
      return false;
    }

    return (data || []).length > 0;
  } catch (error) {
    console.error('Errore hasUserReviewedProfessional:', error);
    return false;
  }
}

// ============================================
// RESPOND TO REVIEW (PROFESSIONISTA)
// ============================================

/**
 * Risponde a una recensione (solo per professionisti)
 * @param reviewId - ID recensione
 * @param responseData - Dati risposta
 * @returns Recensione aggiornata o null
 */
export async function respondToReview(
  reviewId: string,
  responseData: ReviewResponseData
): Promise<Review | null> {
  try {
    // Recupera dati recensione prima di aggiornare
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('professional_id, user_id')
      .eq('id', reviewId)
      .single();

    const { data, error } = await supabase
      .from('reviews')
      .update({
        response: responseData.response,
        response_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('Errore risposta recensione:', error);
      throw error;
    }

    // Crea notifica per risposta a recensione (in background)
    if (data && reviewData) {
      try {
        // Recupera nome cliente per la notifica
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', reviewData.user_id)
          .maybeSingle();

        const clientName = profileData 
          ? `${profileData.first_name} ${profileData.last_name}`.trim()
          : 'Cliente';

        const { notifyReviewResponse } = await import('@/services/notificationService');
        await notifyReviewResponse(reviewData.professional_id, {
          id: reviewId,
          clientName
        });
      } catch (notifErr) {
        // Non bloccare il flusso se la notifica fallisce
        console.error('Errore creazione notifica risposta recensione:', notifErr);
      }
    }

    return data;
  } catch (error) {
    console.error('Errore respondToReview:', error);
    return null;
  }
}
