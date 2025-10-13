
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WeeklyData {
  name: string;
  workouts: number;
}

export const WeeklyProgress = () => {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [totalWeeklyWorkouts, setTotalWeeklyWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calcola l'inizio della settimana (lunedì)
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // Array dei giorni della settimana
        const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
        const weeklyData: WeeklyData[] = weekDays.map(name => ({ name, workouts: 0 }));

        // Query per ottenere i workout della settimana
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const { data: workouts } = await supabase
          .from('custom_workouts')
          .select('scheduled_date')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
          .lte('scheduled_date', endOfWeek.toISOString().split('T')[0]);

        // Conta i workout per giorno
        workouts?.forEach(workout => {
          const workoutDate = new Date(workout.scheduled_date);
          const dayIndex = (workoutDate.getDay() + 6) % 7; // Converte domenica=0 a lunedì=0
          if (dayIndex >= 0 && dayIndex < 7) {
            weeklyData[dayIndex].workouts++;
          }
        });

        setData(weeklyData);
        setTotalWeeklyWorkouts(workouts?.length || 0);
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
      loadWeeklyData();
    };

    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    
    return () => {
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
    };
  }, []);
  return (
    <div className="bg-black rounded-2xl p-6 shadow-lg border-2 border-pp-gold">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-pp-gold">Progressi Settimanali</h3>
        <span className="text-sm text-white">Questa settimana</span>
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
