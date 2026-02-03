/**
 * App-user: solo lettura slot bloccati per la pagina prenotazione professionista.
 * Le funzioni di scrittura (blockSlots, removeBlock, etc.) sono solo in app-pro.
 */
import { supabase } from '@pp/shared';

export interface AvailabilityOverride {
  id: string;
  professional_id: string;
  override_date: string;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  reason: string | null;
  created_at: string;
}

export const availabilityOverrideService = {
  async getBlockedSlots(
    professionalId: string,
    fromDate: string,
    toDate: string
  ): Promise<AvailabilityOverride[]> {
    const { data, error } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('is_blocked', true)
      .gte('override_date', fromDate)
      .lte('override_date', toDate)
      .order('override_date', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data ?? []) as AvailabilityOverride[];
  },
};
