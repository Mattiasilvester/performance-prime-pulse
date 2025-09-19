
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';

export const StartTodayButton = () => {
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkTodayWorkout();
  }, []);

  const checkTodayWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('User not authenticated, skipping workout check');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('custom_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .single();

      if (data && !error) {
        setTodayWorkout(data);
      }
    } catch (error) {
      console.error('Error checking today workout:', error);
    }
  };

  const handleStartToday = async () => {
    setIsLoading(true);
    
    if (todayWorkout) {
      // Se esiste un allenamento per oggi, vai direttamente alla schermata di esecuzione
      navigate('/workouts', { state: { startCustomWorkout: todayWorkout.id } });
    } else {
      // Altrimenti vai al calendario con il popup aperto
      navigate('/schedule', { state: { openWorkoutModal: true } });
    }
    
    setIsLoading(false);
  };

  return (
    <Button
      onClick={handleStartToday}
      disabled={isLoading}
      className="w-full bg-[#c89116] hover:bg-[#c89116]/80 text-black font-bold py-4 text-lg border-2 border-[#c89116] rounded-xl"
    >
      <Calendar className="h-6 w-6 mr-2" />
      {todayWorkout ? 'Inizia allenamento di oggi' : 'Crea allenamento di oggi'}
    </Button>
  );
};
