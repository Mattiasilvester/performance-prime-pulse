import { supabase } from '@pp/shared';
import type { 
  BlockedPeriod, 
  CreateBlockedPeriodData, 
  UpdateBlockedPeriodData,
  BlockedPeriodFilters 
} from '@/types/blocked-periods';

/**
 * Converte Date in stringa YYYY-MM-DD senza problemi di timezone
 */
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Service per gestione periodi bloccati
 */
export const blockedPeriodsService = {
  
  /**
   * Ottieni tutti i blocchi di un professionista
   */
  async getByProfessional(professionalId: string): Promise<BlockedPeriod[]> {
    const { data, error } = await supabase
      .from('professional_blocked_periods')
      .select('*')
      .eq('professional_id', professionalId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Ottieni blocchi in un range di date
   */
  async getInDateRange(
    professionalId: string, 
    startDate: string, 
    endDate: string
  ): Promise<BlockedPeriod[]> {
    const { data, error } = await supabase
      .from('professional_blocked_periods')
      .select('*')
      .eq('professional_id', professionalId)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Verifica se una data specifica è bloccata
   */
  async isDateBlocked(professionalId: string, date: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('professional_blocked_periods')
      .select('id')
      .eq('professional_id', professionalId)
      .lte('start_date', date)
      .gte('end_date', date)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  },

  /**
   * Ottieni tutte le date bloccate in un range (espanse)
   */
  async getBlockedDatesInRange(
    professionalId: string,
    startDate: string,
    endDate: string
  ): Promise<string[]> {
    const blocks = await this.getInDateRange(professionalId, startDate, endDate);
    
    const blockedDates: Set<string> = new Set();
    
    blocks.forEach(block => {
      // Parsing sicuro: aggiungi 'T00:00:00' per evitare problemi timezone
      const start = new Date(block.start_date + 'T00:00:00');
      const end = new Date(block.end_date + 'T00:00:00');
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateToString(d);
        if (dateStr >= startDate && dateStr <= endDate) {
          blockedDates.add(dateStr);
        }
      }
    });
    
    return Array.from(blockedDates).sort();
  },

  /**
   * Crea un nuovo blocco
   */
  async create(data: CreateBlockedPeriodData): Promise<BlockedPeriod> {
    const { data: created, error } = await supabase
      .from('professional_blocked_periods')
      .insert({
        professional_id: data.professional_id,
        start_date: data.start_date,
        end_date: data.end_date,
        block_type: data.block_type,
        reason: data.reason || null,
      })
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  /**
   * Blocca un singolo giorno
   */
  async blockDay(
    professionalId: string, 
    date: string, 
    reason?: string
  ): Promise<BlockedPeriod> {
    return this.create({
      professional_id: professionalId,
      start_date: date,
      end_date: date,
      block_type: 'day',
      reason,
    });
  },

  /**
   * Blocca una settimana intera (da Lunedì a Domenica)
   */
  async blockWeek(
    professionalId: string, 
    weekStartDate: string, // Deve essere un Lunedì
    reason?: string
  ): Promise<BlockedPeriod> {
    // Calcola la Domenica della settimana
    // Parsing sicuro: aggiungi 'T00:00:00' per evitare problemi timezone
    const monday = new Date(weekStartDate + 'T00:00:00');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return this.create({
      professional_id: professionalId,
      start_date: weekStartDate,
      end_date: formatDateToString(sunday),
      block_type: 'week',
      reason,
    });
  },

  /**
   * Aggiorna un blocco esistente
   */
  async update(id: string, data: UpdateBlockedPeriodData): Promise<BlockedPeriod> {
    const { data: updated, error } = await supabase
      .from('professional_blocked_periods')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Elimina un blocco
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('professional_blocked_periods')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Elimina tutti i blocchi di un professionista (opzionale, per reset)
   */
  async deleteAllByProfessional(professionalId: string): Promise<void> {
    const { error } = await supabase
      .from('professional_blocked_periods')
      .delete()
      .eq('professional_id', professionalId);

    if (error) throw error;
  },
};
