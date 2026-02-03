// packages/shared/src/services/bookingsService.ts

import { supabase } from './supabaseClient';

/**
 * Auto-completa gli appuntamenti passati con stato 'confirmed'
 * Chiamare questa funzione quando si carica la lista appuntamenti
 *
 * @param professionalId - ID del professionista (opzionale, se non fornito aggiorna tutti)
 * @returns Numero di appuntamenti auto-completati
 */
export const autoCompletePastBookings = async (professionalId?: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('auto_complete_past_bookings', {
      p_professional_id: professionalId ?? undefined
    });

    if (error) {
      return await autoCompletePastBookingsFallback(professionalId);
    }

    return data ?? 0;
  } catch {
    return await autoCompletePastBookingsFallback(professionalId);
  }
};

const autoCompletePastBookingsFallback = async (professionalId?: string): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'confirmed')
      .lt('booking_date', today);

    if (professionalId) {
      query = query.eq('professional_id', professionalId);
    }

    const { data, error } = await query.select('id');

    if (error) {
      return 0;
    }

    return data?.length ?? 0;
  } catch {
    return 0;
  }
};
