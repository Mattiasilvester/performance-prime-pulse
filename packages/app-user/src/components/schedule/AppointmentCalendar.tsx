import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export interface ScheduleWorkoutItem {
  id: string;
  title?: string;
  workout_type?: string;
  scheduled_date?: string;
  total_duration?: number | null;
  completed?: boolean;
  completed_at?: string | null;
  created_at?: string;
  exercises?: unknown[];
}

interface AppointmentCalendarProps {
  onDateSelect: (date: Date) => void;
  onWorkoutSelect?: (workout: ScheduleWorkoutItem) => void;
  refreshTrigger?: number;
}

export const AppointmentCalendar = ({ onDateSelect, onWorkoutSelect, refreshTrigger }: AppointmentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<ScheduleWorkoutItem[]>([]);
  const navigate = useNavigate();
  
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => null);

  useEffect(() => {
    // Debounce loading per evitare chiamate multiple
    const timeoutId = setTimeout(() => {
      loadWorkouts();
    }, 100);

    return () => clearTimeout(timeoutId);
    // loadWorkouts is stable; including it would re-run on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, refreshTrigger]);

  const loadWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('custom_workouts')
        .select('id, title, workout_type, scheduled_date, total_duration, completed, completed_at, created_at')
        .eq('user_id', user.id)
        .gte('scheduled_date', startDate.toISOString().split('T')[0])
        .lte('scheduled_date', endDate.toISOString().split('T')[0]);

      if (data && !error) {
        setWorkouts(data);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const getWorkoutForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    return workouts.find(workout => workout.scheduled_date === dateStr);
  };

  const hasWorkout = (day: number) => {
    return !!getWorkoutForDay(day);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const handleDayClick = (day: number) => {
    const workout = getWorkoutForDay(day);
    if (workout && onWorkoutSelect) {
      // Se c'è un allenamento per questo giorno, mostra il popup dell'allenamento esistente
      onWorkoutSelect(workout);
    } else {
      // Altrimenti apri il popup per creare un nuovo allenamento
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      onDateSelect(selectedDate);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="max-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#F0EDE8]">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="text-[#8A8A96] hover:text-[#F0EDE8] p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="text-[#8A8A96] hover:text-[#F0EDE8] p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => onDateSelect(new Date())}
            className="text-[13px] text-[#8A8A96] hover:text-[#F0EDE8] flex items-center gap-1.5 py-2 px-2"
          >
            <Plus className="h-4 w-4" />
            Nuovo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="p-2 text-center text-[11px] font-semibold text-[#5C5C66] uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square rounded-[10px]" />
        ))}
        {days.map(day => (
            <div
              key={day}
              role="button"
              tabIndex={0}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(day); }}
              className={`aspect-square rounded-[10px] flex flex-col items-center justify-center cursor-pointer transition-colors relative ${
                isToday(day)
                  ? 'bg-[#EEBA2B] text-[#0A0A0C] font-bold'
                  : 'bg-transparent text-[#F0EDE8] font-medium hover:bg-white/5'
              } ${!isToday(day) && !hasWorkout(day) ? 'opacity-30' : ''}`}
            >
              <span className="text-[13px]">{day}</span>
              {hasWorkout(day) && !isToday(day) && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#10B981]" />
              )}
              {hasWorkout(day) && isToday(day) && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0A0A0C]" />
              )}
            </div>
        ))}
      </div>
    </div>
  );
};
