
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AppointmentCalendarProps {
  onDateSelect: (date: Date) => void;
  onWorkoutSelect?: (workout: any) => void;
  refreshTrigger?: number;
}

export const AppointmentCalendar = ({ onDateSelect, onWorkoutSelect, refreshTrigger }: AppointmentCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<any[]>([]);
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
    loadWorkouts();
  }, [currentDate, refreshTrigger]);

  const loadWorkouts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('custom_workouts')
        .select('*')
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
    <div className="calendar-panel">
      <div className="flex items-center justify-between mb-6">
        <h3 className="calendar-panel__title">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')} className="bg-black/50 border-white/20 text-white hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')} className="bg-black/50 border-white/20 text-white hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <button 
            className="calendar-panel__new-button"
            onClick={() => onDateSelect(new Date())}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuovo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium calendar-panel__weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
        ))}
        {days.map(day => (
          <div
            key={day}
            onClick={() => handleDayClick(day)}
            className={`p-2 text-center text-sm rounded-lg cursor-pointer transition-colors relative calendar-panel__day ${
              isToday(day)
                ? 'bg-[#c89116] text-black font-bold border-2 border-[#c89116] shadow-lg'
                : hasWorkout(day)
                ? 'bg-white/20 font-semibold hover:bg-white/30'
                : 'hover:bg-white/10'
            }`}
          >
            {day}
            {hasWorkout(day) && !isToday(day) && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
            )}
            {hasWorkout(day) && isToday(day) && (
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-black" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
