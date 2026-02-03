
import { supabase } from '@pp/shared';

export interface ProgressData {
  date: string;
  workouts: number;
  hours: number;
}

export const fetchProgressStats = async (period: string): Promise<ProgressData[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Calcola la data di inizio basata sul periodo
    const now = new Date();
    let startDate: Date;
    
    console.log('🔍 [DEBUG] fetchProgressStats: Periodo selezionato:', period);
    console.log('🔍 [DEBUG] fetchProgressStats: Data corrente:', now.toISOString());
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01'); // Data molto indietro nel tempo
        break;
    }

    const startDateString = startDate.toISOString().split('T')[0];

    console.log('🔍 [DEBUG] fetchProgressStats: Data inizio calcolata:', startDateString);
    console.log('🔍 [DEBUG] fetchProgressStats: Filtro scheduled_date >=', startDateString);

    // Query per ottenere i workout completati nel periodo
    const { data: workouts, error } = await supabase
      .from('custom_workouts')
      .select('scheduled_date, total_duration, completed_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('scheduled_date', startDateString)
      .order('scheduled_date', { ascending: true });

    console.log('📊 [DEBUG] fetchProgressStats: Workouts trovati:', workouts);

    if (error) {
      console.error('Error fetching progress stats:', error);
      return [];
    }

    // Aggrega i dati per data
    const dataMap = new Map<string, { workouts: number; hours: number }>();
    
    workouts?.forEach(workout => {
      const date = workout.scheduled_date;
      const duration = workout.total_duration || 0;
      
      if (dataMap.has(date)) {
        const existing = dataMap.get(date)!;
        dataMap.set(date, {
          workouts: existing.workouts + 1,
          hours: existing.hours + (duration / 60) // Converti minuti in ore
        });
      } else {
        dataMap.set(date, {
          workouts: 1,
          hours: duration / 60
        });
      }
    });

    // Converte la mappa in array ordinato
    const result: ProgressData[] = Array.from(dataMap.entries())
      .map(([date, stats]) => ({
        date,
        workouts: stats.workouts,
        hours: stats.hours // Mantieni precisione completa, arrotonda solo alla fine
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log('📊 [DEBUG] fetchProgressStats: Risultato finale:', result);

    return result;
  } catch (error) {
    console.error('Error in fetchProgressStats:', error);
    return [];
  }
};
