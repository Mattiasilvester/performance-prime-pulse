
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';

interface WeeklyData {
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

        // Query per ottenere TUTTI i workout (completati e non) per debug
        const { data: workouts, error } = await supabase
          .from('custom_workouts')
          .select('scheduled_date, completed_at, title, workout_type, completed')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100); // Aumentato a 100 per trovare tutti i workout

        if (error) {
          console.error('📊 [ERROR] WeeklyProgress: Errore query workout:', error);
          return;
        }

        console.log('📊 [DEBUG] WeeklyProgress: Query TUTTI i workout (completati e non):', {
          totalWorkoutsFound: workouts?.length || 0,
          userId: user.id,
          workouts: workouts?.slice(0, 10) // Mostra i primi 10 per debug
        });

        // Filtra solo i completati per il grafico
        const completedWorkouts = workouts?.filter(workout => workout.completed === true) || [];
        
        console.log('📊 [DEBUG] WeeklyProgress: Workout completati filtrati:', {
          completedWorkoutsFound: completedWorkouts.length,
          allWorkoutsFound: workouts?.length || 0
        });

        // Debug dettagliato di tutti i workout
        workouts?.forEach((workout, index) => {
          console.log(`📊 [DEBUG] Workout ${index + 1}:`, {
            title: workout.title,
            type: workout.workout_type,
            scheduled_date: workout.scheduled_date,
            completed_at: workout.completed_at,
            completed: workout.completed
          });
        });

        // Conta i workout per giorno della settimana corrente
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        console.log('📊 [DEBUG] Settimana corrente:', {
          startOfWeek: startOfWeek.toISOString().split('T')[0],
          endOfWeek: endOfWeek.toISOString().split('T')[0]
        });

        completedWorkouts.forEach((workout, index) => {
          const workoutDate = new Date(workout.scheduled_date);
          
          console.log(`📊 [DEBUG] Analizzando workout completato ${index + 1}:`, {
            title: workout.title,
            scheduled_date: workout.scheduled_date,
            workoutDate: workoutDate.toISOString().split('T')[0],
            isInWeek: workoutDate >= startOfWeek && workoutDate <= endOfWeek,
            dayOfWeek: workoutDate.getDay(),
            dayName: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][workoutDate.getDay()]
          });
          
          // Controlla se il workout è nella settimana corrente
          if (workoutDate >= startOfWeek && workoutDate <= endOfWeek) {
            const dayIndex = (workoutDate.getDay() + 6) % 7; // Converte domenica=0 a lunedì=0
            if (dayIndex >= 0 && dayIndex < 7) {
              weeklyData[dayIndex].workouts++;
              console.log(`✅ [DEBUG] Workout aggiunto al giorno ${weeklyData[dayIndex].name}:`, workoutDate.toISOString().split('T')[0]);
            }
          } else {
            console.log(`❌ [DEBUG] Workout NON aggiunto - fuori settimana:`, workoutDate.toISOString().split('T')[0]);
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

  const handleManualRefresh = () => {
    console.log('🔄 [DEBUG] WeeklyProgress: Refresh manuale richiesto');
    setRefreshKey(prev => prev + 1);
    setLoading(true);
  };

  return (
    <div className="bg-black rounded-2xl p-6 shadow-lg border-2 border-pp-gold">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-pp-gold">Progressi Settimanali</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white">Questa settimana</span>
          <button 
            onClick={handleManualRefresh}
            className="p-1 text-pp-gold hover:text-white transition-colors"
            title="Aggiorna dati"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#EEBA2B', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis 
              tick={{ fill: '#EEBA2B', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <Bar 
              dataKey="workouts" 
              fill="#EEBA2B" 
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-pp-gold/80">
          <span className="font-semibold text-pp-gold">
            {loading ? '...' : totalWeeklyWorkouts} allenamenti
          </span> completati questa settimana
        </p>
      </div>
    </div>
  );
};
