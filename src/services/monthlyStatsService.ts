import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonthlyStats {
  month: string;
  year: number;
  total_workouts: number;
  total_hours: number;
  user_id: string;
  created_at: string;
}

// Controlla se è il primo giorno del mese e genera report
export const checkMonthlyReset = async (userId: string) => {
  const now = new Date();
  const isFirstDay = now.getDate() === 1;
  
  if (!isFirstDay) return;

  try {
    // Ottieni statistiche del mese precedente
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const monthKey = `${previousMonth.getFullYear()}-${(previousMonth.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const { data: currentStats, error: statsError } = await supabase
      .from('user_workout_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError || !currentStats) return;

    // Salva le statistiche mensili
    const { error: saveError } = await supabase
      .from('monthly_workout_stats')
      .upsert({
        user_id: userId,
        month: monthKey,
        year: previousMonth.getFullYear(),
        total_workouts: currentStats.total_workouts,
        total_hours: currentStats.total_hours,
        created_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Errore salvataggio stats mensili:', saveError);
      return;
    }

    // Reset statistiche correnti
    const { error: resetError } = await supabase
      .from('user_workout_stats')
      .update({
        total_workouts: 0,
        total_hours: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (resetError) {
      console.error('Errore reset statistiche:', resetError);
      return;
    }

    // Mostra notifica di riepilogo
    const monthName = previousMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    
    toast.success(
      `🎉 Riepilogo ${monthName}:\n` +
      `💪 ${currentStats.total_workouts} allenamenti completati\n` +
      `⏰ ${currentStats.total_hours} ore di attività\n` +
      `🔥 Statistiche resettate per il nuovo mese!`,
      { duration: 8000 }
    );

    // Aggiungi notifica persistente
    await addMonthlyNotification(userId, monthName, currentStats.total_workouts, currentStats.total_hours);

  } catch (error) {
    console.error('Errore controllo mensile:', error);
  }
};

// Aggiungi notifica per il riepilogo mensile
const addMonthlyNotification = async (userId: string, monthName: string, workouts: number, hours: number) => {
  // Qui potresti salvare la notifica in una tabella dedicata se necessario
  // Per ora utilizziamo solo il toast
  console.log(`Notifica mensile per utente ${userId}: ${monthName} - ${workouts} allenamenti, ${hours} ore`);
};

// Ottieni statistiche mensili dell'utente
export const getMonthlyStats = async (userId: string, year?: number) => {
  const currentYear = year || new Date().getFullYear();
  
  const { data, error } = await supabase
    .from('monthly_workout_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('year', currentYear)
    .order('month', { ascending: true });

  if (error) {
    console.error('Errore recupero stats mensili:', error);
    return [];
  }

  return data || [];
};