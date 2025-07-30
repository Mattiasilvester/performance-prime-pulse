
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
  }, []);

  const maxWorkouts = Math.max(...data.map(d => d.workouts), 1);

  return (
    <div className="bg-black rounded-2xl p-6 shadow-lg border-2 border-pp-gold">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-pp-gold">Progressi Settimanali</h3>
        <span className="text-sm text-white">Questa settimana</span>
      </div>
      
      <div className="space-y-3">
        {data.map((day, index) => (
          <div key={day.name} className="flex items-center space-x-3">
            <div className="w-12 text-xs text-pp-gold font-medium">
              {day.name}
            </div>
            <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-pp-gold h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${(day.workouts / maxWorkouts) * 100}%`,
                  minWidth: day.workouts > 0 ? '8px' : '0px'
                }}
              />
            </div>
            <div className="w-8 text-xs text-pp-gold text-right">
              {day.workouts}
            </div>
          </div>
        ))}
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
