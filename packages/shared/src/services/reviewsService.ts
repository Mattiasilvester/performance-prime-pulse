// packages/shared/src/services/reviewsService.ts

import { supabase } from './supabaseClient';

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
  is_visible: boolean | null;
  is_verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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

export async function getReviewsByProfessional(
  professionalId: string,
  onlyVisible: boolean = true
): Promise<Review[]> {
  try {
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('professional_id', professionalId);

    if (onlyVisible) {
      query = query.eq('is_visible', true);
    }

    const { data: reviewsData, error: reviewsError } = await query
      .order('created_at', { ascending: false });

    if (reviewsError) {
      throw reviewsError;
    }

    if (!reviewsData || reviewsData.length === 0) {
      return [];
    }

    const userIds = [...new Set(reviewsData.map((r: { user_id: string }) => r.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name')
      .in('id', userIds);

    if (profilesError) {
      // Continua senza dati utente
    }

    const profilesMap = new Map((profilesData || []).map((p: { id: string }) => [p.id, p]));
    const reviewsWithUsers = reviewsData.map((review) => ({
      ...review,
      user: profilesMap.get(review.user_id) ?? undefined,
    }));

    return reviewsWithUsers as Review[];
  } catch {
    return [];
  }
}

// ============================================
// CREATE REVIEW
// ============================================

export async function createReview(reviewData: CreateReviewData): Promise<Review | null> {
  try {
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
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Errore createReview:', error);
    throw error;
  }
}

// ============================================
// UPDATE REVIEW
// ============================================

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

export async function deleteReview(reviewId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
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

export async function getAvailableBookingsForReview(
  userId: string,
  professionalId: string
): Promise<Array<{ id: string; booking_date: string; booking_time: string; service_name?: string }>> {
  try {
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
      return [];
    }

    if (!completedBookings || completedBookings.length === 0) {
      return [];
    }

    const bookingIds = completedBookings.map(b => b.id);
    const { data: existingReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('booking_id')
      .eq('user_id', userId)
      .eq('professional_id', professionalId)
      .in('booking_id', bookingIds);

    if (reviewsError) {
      // Continua comunque
    }

    const reviewedBookingIds = new Set((existingReviews || []).map(r => r.booking_id));
    return completedBookings
      .filter(b => !reviewedBookingIds.has(b.id))
      .map(b => ({
        id: b.id,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        service_name: (b.service as { name?: string } | null)?.name ?? undefined,
      }));
  } catch {
    return [];
  }
}

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
      return false;
    }

    return (data || []).length > 0;
  } catch {
    return false;
  }
}

// ============================================
// RESPOND TO REVIEW (PROFESSIONISTA)
// ============================================

export async function respondToReview(
  reviewId: string,
  responseData: ReviewResponseData
): Promise<Review | null> {
  try {
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
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Errore respondToReview:', error);
    return null;
  }
}
