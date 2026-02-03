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

export interface CreateOverrideInput {
  override_date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export const availabilityOverrideService = {
  async blockSlots(
    professionalId: string,
    data: CreateOverrideInput
  ): Promise<AvailabilityOverride> {
    const { data: row, error } = await supabase
      .from('availability_overrides')
      .insert({
        professional_id: professionalId,
        override_date: data.override_date,
        start_time: data.start_time,
        end_time: data.end_time,
        is_blocked: true,
        reason: data.reason ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row as AvailabilityOverride;
  },

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

  async removeBlock(blockId: string): Promise<void> {
    const { error } = await supabase
      .from('availability_overrides')
      .delete()
      .eq('id', blockId);
    if (error) throw error;
  },

  async blockFullDay(
    professionalId: string,
    date: string,
    reason?: string
  ): Promise<AvailabilityOverride> {
    return this.blockSlots(professionalId, {
      override_date: date,
      start_time: '00:00',
      end_time: '23:59',
      reason: reason ?? 'Giornata bloccata',
    });
  },

  async getUpcoming(
    professionalId: string,
    fromDate: string
  ): Promise<AvailabilityOverride[]> {
    const { data, error } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('is_blocked', true)
      .gte('override_date', fromDate)
      .order('override_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as AvailabilityOverride[];
  },
};
