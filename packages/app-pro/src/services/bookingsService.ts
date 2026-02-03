// src/services/bookingsService.ts

import { supabase } from '@pp/shared';

/**
 * Auto-completa gli appuntamenti passati con stato 'confirmed'
 * Chiamare questa funzione quando si carica la lista appuntamenti
 * 
 * @param professionalId - ID del professionista (opzionale, se non fornito aggiorna tutti)
 * @returns Numero di appuntamenti auto-completati
 */
export const autoCompletePastBookings = async (professionalId?: string): Promise<number> => {
  console.log('🔄 [AUTO-COMPLETE] Inizio auto-completamento appuntamenti passati', { professionalId });
  
  try {
    // Prima prova a chiamare la funzione SQL (più efficiente)
    console.log('🔄 [AUTO-COMPLETE] Tentativo chiamata funzione SQL...', { professionalId });
    const { data, error } = await supabase.rpc('auto_complete_past_bookings', {
      p_professional_id: professionalId || null
    });
    
    if (error) {
      console.warn('⚠️ [AUTO-COMPLETE] Errore chiamata funzione SQL, uso fallback frontend:', error);
      // Fallback: usa la versione frontend
      return await autoCompletePastBookingsFallback(professionalId);
    }
    
    const count = data || 0;
    console.log(`✅ [AUTO-COMPLETE] Funzione SQL completata: ${count} appuntamenti aggiornati`);
    return count;
  } catch (error) {
    console.error('❌ [AUTO-COMPLETE] Errore auto-completamento appuntamenti:', error);
    // Fallback: usa la versione frontend
    return await autoCompletePastBookingsFallback(professionalId);
  }
};

/**
 * Fallback: auto-completa gli appuntamenti passati lato frontend
 * Usato se la funzione SQL non è disponibile
 */
const autoCompletePastBookingsFallback = async (professionalId?: string): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    console.log('🔄 [AUTO-COMPLETE] Fallback frontend - Data oggi:', today, 'ProfessionalId:', professionalId);
    
    let query = supabase
      .from('bookings')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'confirmed')
      .lt('booking_date', today);
    
    // Se professionalId è fornito, filtra per professionista
    if (professionalId) {
      query = query.eq('professional_id', professionalId);
    }
    
    const { data, error } = await query.select('id');

    if (error) {
      console.error('❌ [AUTO-COMPLETE] Errore auto-completamento appuntamenti (fallback):', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`✅ [AUTO-COMPLETE] Fallback completato: ${count} appuntamenti aggiornati`);
    return count;
  } catch (error) {
    console.error('❌ [AUTO-COMPLETE] Errore generale auto-completamento:', error);
    return 0;
  }
};
