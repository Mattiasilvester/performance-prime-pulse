
import { lazy, Suspense, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
// import { RefreshCw } from 'lucide-react'; // Rimosso - non più necessario

const WeeklyProgressChart = lazy(() => import('./WeeklyProgressChart'));

export interface WeeklyData {
  name: string;
  workouts: number;
}

export const WeeklyProgress = () => {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [totalWeeklyWorkouts, setTotalWeeklyWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calcola l'inizio della settimana corrente (lunedì)
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // Array dei giorni della settimana
        const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
        const weeklyData: WeeklyData[] = weekDays.map(name => ({ name, workouts: 0 }));

        // SOLUZIONE: Leggi da ENTRAMBE le tabelle per avere i dati completi
        
        // 1. Query da custom_workouts (workout dettagliati)
        const { data: workouts, error } = await supabase
          .from('custom_workouts')
          .select('scheduled_date, completed_at, title, workout_type, completed, user_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        // 2. Query da user_workout_stats (statistiche aggregate)
        const { data: userStats, error: statsError } = await supabase
          .from('user_workout_stats')
          .select('total_workouts, total_hours')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📊 [DEBUG] WeeklyProgress: Dati da custom_workouts:', {
          workoutsFound: workouts?.length || 0,
          workouts: workouts
        });

        console.log('📊 [DEBUG] WeeklyProgress: Dati da user_workout_stats:', {
          userStats,
          statsError
        });

        // Filtro client-side per il mio utente
        const myWorkouts = workouts?.filter(workout => workout.user_id === user.id) || [];

        if (error) {
          console.error('📊 [ERROR] WeeklyProgress: Errore query workout:', error);
          return;
        }

        console.log('📊 [DEBUG] WeeklyProgress: Query TUTTI i workout (TUTTI gli utenti):', {
          totalWorkoutsInDB: workouts?.length || 0,
          myUserId: user.id,
          workouts: workouts?.slice(0, 10) // Mostra i primi 10 per debug
        });

        console.log('📊 [DEBUG] WeeklyProgress: I MIEI workout filtrati:', {
          myWorkoutsFound: myWorkouts.length,
          totalWorkoutsInDB: workouts?.length || 0
        });

        // Filtra solo i completati per il grafico
        const completedWorkouts = myWorkouts.filter(workout => workout.completed === true);
        
        // VERIFICA DISCREPANZA: Se user_workout_stats ha più workout di custom_workouts
        const statsWorkouts = userStats?.total_workouts || 0;
        const customWorkouts = completedWorkouts.length;
        
        console.log('📊 [DEBUG] WeeklyProgress: Confronto dati:', {
          customWorkoutsFound: customWorkouts,
          statsWorkoutsFound: statsWorkouts,
          discrepancy: statsWorkouts - customWorkouts
        });

        if (statsWorkouts > customWorkouts) {
          console.log('⚠️ [DEBUG] WeeklyProgress: DISCREPANZA RILEVATA!');
          console.log(`⚠️ [DEBUG] user_workout_stats: ${statsWorkouts} workout`);
          console.log(`⚠️ [DEBUG] custom_workouts: ${customWorkouts} workout`);
          console.log(`⚠️ [DEBUG] Mancanti: ${statsWorkouts - customWorkouts} workout`);
        }
        
        console.log('📊 [DEBUG] WeeklyProgress: Workout completati filtrati:', {
          completedWorkoutsFound: completedWorkouts.length,
          allWorkoutsFound: workouts?.length || 0,
          statsWorkouts: statsWorkouts
        });

        // Debug dettagliato di tutti i workout nel database
        workouts?.forEach((workout, index) => {
          console.log(`📊 [DEBUG] Workout ${index + 1} (TUTTI):`, {
            title: workout.title,
            type: workout.workout_type,
            scheduled_date: workout.scheduled_date,
            completed_at: workout.completed_at,
            completed: workout.completed,
            user_id: workout.user_id,
            isMyWorkout: workout.user_id === user.id
          });
        });

        // QUERY SPECIALE: Conta tutti i workout completati nel database
        console.log('🔍 [DEBUG] Eseguo query speciale per contare TUTTI i workout completati...');
        
        const { data: allCompletedWorkouts, error: allCompletedError } = await supabase
          .from('custom_workouts')
          .select('id, title, user_id, completed_at, created_at')
          .eq('completed', true)
          .order('created_at', { ascending: false });

        if (!allCompletedError && allCompletedWorkouts) {
          console.log('🔍 [DEBUG] TUTTI I WORKOUT COMPLETATI NEL DATABASE:', {
            totalCompletedInDB: allCompletedWorkouts.length,
            myCompletedWorkouts: allCompletedWorkouts.filter(w => w.user_id === user.id).length,
            allWorkouts: allCompletedWorkouts.map(w => ({
              title: w.title,
              user_id: w.user_id,
              isMyWorkout: w.user_id === user.id,
              completed_at: w.completed_at,
              created_at: w.created_at
            }))
          });
        } else {
          console.error('❌ [ERROR] Errore query workout completati:', allCompletedError);
        }

        // Debug dettagliato dei MIEI workout
        myWorkouts.forEach((workout, index) => {
          console.log(`📊 [DEBUG] MIO Workout ${index + 1}:`, {
            title: workout.title,
            type: workout.workout_type,
            scheduled_date: workout.scheduled_date,
            completed_at: workout.completed_at,
            completed: workout.completed
          });
        });

        // MODIFICA: Mostra TUTTI i workout completati, non solo quelli della settimana corrente
        console.log('📊 [DEBUG] Analizzando TUTTI i workout completati per il grafico...');

        completedWorkouts.forEach((workout, index) => {
          const workoutDate = new Date(workout.scheduled_date);
          
          console.log(`📊 [DEBUG] Analizzando workout completato ${index + 1}:`, {
            title: workout.title,
            scheduled_date: workout.scheduled_date,
            workoutDate: workoutDate.toISOString().split('T')[0],
            dayOfWeek: workoutDate.getDay(),
            dayName: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][workoutDate.getDay()]
          });
          
          // Aggiungi TUTTI i workout completati al grafico, indipendentemente dalla settimana
          const dayIndex = (workoutDate.getDay() + 6) % 7; // Converte domenica=0 a lunedì=0
          if (dayIndex >= 0 && dayIndex < 7) {
            weeklyData[dayIndex].workouts++;
            console.log(`✅ [DEBUG] Workout aggiunto al giorno ${weeklyData[dayIndex].name}:`, workoutDate.toISOString().split('T')[0]);
          }
        });

        // Conta solo i workout della settimana corrente per il totale
        const weeklyWorkoutsCount = weeklyData.reduce((sum, day) => sum + day.workouts, 0);
        
        console.log('📊 [DEBUG] WeeklyProgress: Dati finali per grafico:', weeklyData);
        console.log('📊 [DEBUG] WeeklyProgress: Totale workout questa settimana:', weeklyWorkoutsCount);
        
        setData(weeklyData);
        setTotalWeeklyWorkouts(weeklyWorkoutsCount);
      } catch (error) {
        console.error('Error loading weekly data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeeklyData();

    // Ascolta l'evento di completamento workout per refresh automatico
    const handleWorkoutCompleted = () => {
      console.log('🔄 [DEBUG] WeeklyProgress: Workout completato, ricarico dati settimanali...');
      setRefreshKey(prev => prev + 1); // Forza re-render
      loadWeeklyData();
    };

    // Refresh automatico ogni 10 secondi per aggiornamento più frequente
    const refreshInterval = setInterval(() => {
      console.log('🔄 [DEBUG] WeeklyProgress: Refresh automatico dati...');
      setRefreshKey(prev => prev + 1); // Forza re-render
      loadWeeklyData();
    }, 10000);

    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    
    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
      clearInterval(refreshInterval);
    };
  }, [refreshKey]);

  // Funzione per refresh manuale rimossa - non più necessaria

  return (
    <div className="bg-[#16161A] rounded-[18px] p-5 border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#F0EDE8]">Progressi Settimanali</h3>
        <span className="text-[13px] text-[#8A8A96] cursor-pointer hover:text-[#F0EDE8] transition-colors">
          Dettagli →
        </span>
      </div>

      <div className="mt-4 max-h-[100px] h-[100px]" style={{ height: 100 }}>
        <Suspense fallback={<div className="h-full w-full rounded-lg bg-[#1E1E24] animate-pulse opacity-30" />}>
          <WeeklyProgressChart data={data} />
        </Suspense>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] mt-4 pt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" aria-hidden />
          <span className="text-[11px] text-[#8A8A96]">Completato</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EEBA2B]" aria-hidden />
          <span className="text-[11px] text-[#8A8A96]">Oggi</span>
        </div>
      </div>
    </div>
  );
};
