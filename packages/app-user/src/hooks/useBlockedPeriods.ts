import { useState, useEffect, useCallback } from 'react';
import { blockedPeriodsService } from '@/services/blockedPeriodsService';
import type { BlockedPeriod } from '@/types/blocked-periods';

/**
 * Converte Date in stringa YYYY-MM-DD senza problemi di timezone
 */
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface UseBlockedPeriodsOptions {
  professionalId: string | null;
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
}

interface UseBlockedPeriodsReturn {
  blocks: BlockedPeriod[];
  blockedDates: string[];
  loading: boolean;
  error: Error | null;
  isDateBlocked: (date: string | Date) => boolean;
  refetch: () => Promise<void>;
}

export const useBlockedPeriods = ({
  professionalId,
  startDate,
  endDate,
  autoFetch = true,
}: UseBlockedPeriodsOptions): UseBlockedPeriodsReturn => {
  const [blocks, setBlocks] = useState<BlockedPeriod[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBlocks = useCallback(async () => {
    if (!professionalId) {
      setBlocks([]);
      setBlockedDates([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (startDate && endDate) {
        // Fetch blocchi in range specifico
        const [blocksData, datesData] = await Promise.all([
          blockedPeriodsService.getInDateRange(professionalId, startDate, endDate),
          blockedPeriodsService.getBlockedDatesInRange(professionalId, startDate, endDate),
        ]);
        setBlocks(blocksData);
        setBlockedDates(datesData);
      } else {
        // Fetch tutti i blocchi
        const blocksData = await blockedPeriodsService.getByProfessional(professionalId);
        setBlocks(blocksData);
        
        // Espandi le date
        const dates: string[] = [];
        blocksData.forEach(block => {
          // Parsing sicuro: aggiungi 'T00:00:00' per evitare problemi timezone
          const start = new Date(block.start_date + 'T00:00:00');
          const end = new Date(block.end_date + 'T00:00:00');
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(formatDateToString(d));
          }
        });
        setBlockedDates([...new Set(dates)].sort());
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Errore sconosciuto'));
      console.error('Errore fetch blocchi:', err);
    } finally {
      setLoading(false);
    }
  }, [professionalId, startDate, endDate]);

  useEffect(() => {
    if (autoFetch) {
      fetchBlocks();
    }
  }, [fetchBlocks, autoFetch]);

  const isDateBlocked = useCallback((date: string | Date): boolean => {
    const dateStr = typeof date === 'string' ? date : formatDateToString(date);
    return blockedDates.includes(dateStr);
  }, [blockedDates]);

  return {
    blocks,
    blockedDates,
    loading,
    error,
    isDateBlocked,
    refetch: fetchBlocks,
  };
};
