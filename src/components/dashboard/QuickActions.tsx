
import { Play, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const QuickActions = () => {
  const navigate = useNavigate();
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkTodayWorkout();

    // Listener per gli aggiornamenti in tempo reale
    const channel = supabase
      .channel('workout-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'custom_workouts'
        },
        () => {
          // Ricontrolla quando ci sono cambiamenti nella tabella
          checkTodayWorkout();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkTodayWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('custom_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .eq('completed', false) // Escludi allenamenti completati
        .maybeSingle();

      if (data && !error) {
        setTodayWorkout(data);
      } else {
        setTodayWorkout(null);
      }
    } catch (error) {
      console.log('No workout found for today');
      setTodayWorkout(null);
    }
  };

  const handleStartWorkout = async () => {
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

  const actions = [
    {
      label: 'Inizia Allenamento',
      description: 'Workout di oggi',
      icon: Play,
      color: 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: handleStartWorkout,
      disabled: isLoading,
    },
    {
      label: 'Prenota Sessione',
      description: 'Con un professionista',
      icon: Calendar,
      color: 'bg-gradient-to-r from-[#c89116] to-black hover:from-black hover:to-[#c89116] border-2 border-[#c89116]',
      textColor: 'text-white',
    },
    {
      label: 'Chat AI Coach',
      description: 'Chiedi consiglio',
      icon: MessageSquare,
      color: 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116]',
      textColor: 'text-white',
    },
    {
      label: 'Nuovo Obiettivo',
      description: 'Sfida te stesso',
      icon: Plus,
      color: 'bg-gradient-to-r from-[#c89116] to-black hover:from-black hover:to-[#c89116] border-2 border-[#c89116]',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl p-6 shadow-lg border-2 border-[#c89116]">
      <h3 className="text-lg font-semibold text-pp-gold mb-4">Azioni Rapide</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`${action.color} ${action.textColor} h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-all duration-200`}
            >
              <Icon className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs opacity-90">{action.description}</p>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export { QuickActions };
