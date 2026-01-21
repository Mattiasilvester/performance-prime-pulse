// =============================================
// TIPI PER SISTEMA BLOCCO PERIODI
// =============================================

/**
 * Tipo di blocco
 * - 'day': Singolo giorno bloccato
 * - 'week': Settimana intera bloccata (da Lunedì a Domenica)
 */
export type BlockType = 'day' | 'week';

/**
 * Periodo bloccato dal professionista
 */
export interface BlockedPeriod {
  id: string;
  professional_id: string;
  start_date: string; // Format: 'YYYY-MM-DD'
  end_date: string;   // Format: 'YYYY-MM-DD'
  block_type: BlockType;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dati per creare un nuovo blocco
 */
export interface CreateBlockedPeriodData {
  professional_id: string;
  start_date: string; // Format: 'YYYY-MM-DD'
  end_date: string;   // Format: 'YYYY-MM-DD'
  block_type: BlockType;
  reason?: string;
}

/**
 * Dati per aggiornare un blocco esistente
 */
export interface UpdateBlockedPeriodData {
  start_date?: string;
  end_date?: string;
  reason?: string;
}

/**
 * Filtri per query blocchi
 */
export interface BlockedPeriodFilters {
  professional_id: string;
  start_date?: string; // Filtra blocchi che iniziano da questa data
  end_date?: string;   // Filtra blocchi che finiscono entro questa data
  block_type?: BlockType;
}

/**
 * Motivi predefiniti per il blocco (opzionale, per UI)
 */
export const BLOCK_REASONS = [
  { value: 'ferie', label: 'Ferie' },
  { value: 'malattia', label: 'Malattia' },
  { value: 'impegno_personale', label: 'Impegno personale' },
  { value: 'formazione', label: 'Formazione/Corso' },
  { value: 'festivita', label: 'Festività' },
  { value: 'altro', label: 'Altro' },
] as const;

export type BlockReasonValue = typeof BLOCK_REASONS[number]['value'];
