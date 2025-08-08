import { Play, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { NewObjectiveCard } from '@/components/profile/NewObjectiveCard';

const QuickActions = () => {
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    checkTodayWorkout();
  }, []);

  const checkTodayWorkout = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Errore nel controllo workout di oggi:', error);
        return;
      }

      if (workouts && workouts.length > 0) {
        setTodayWorkout(workouts[0]);
      }
    } catch (error) {
      console.error('Errore nel controllo workout di oggi:', error);
    }
  };

  const handleStartWorkout = async () => {
    if (!user) {
      toast.error('Devi essere loggato per iniziare un allenamento');
      return;
    }

    setIsLoading(true);
    try {
      if (todayWorkout) {
        // Se c'è già un workout per oggi, vai alla pagina allenamenti
        navigate('/workouts');
        toast.success('Vai al tuo allenamento di oggi');
      } else {
        // Se non c'è un workout per oggi, vai alla creazione
        navigate('/workouts');
        toast.success('Crea il tuo allenamento di oggi');
      }
    } catch (error) {
      console.error('Errore nell\'avvio allenamento:', error);
      toast.error('Errore nell\'avvio dell\'allenamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewObjectiveClick = () => {
    setIsObjectiveModalOpen(true);
  };

  const handleObjectiveModalClose = () => {
    setIsObjectiveModalOpen(false);
  };

  // RIMOSSO: Timer e Note dalle azioni rapide
  // Ora le azioni sono focalizzate sulle funzioni essenziali
  const actions = [
    {
      label: 'Inizia Allenamento',
      description: todayWorkout ? 'Workout di oggi' : 'Crea nuovo workout',
      icon: Play,
      color: 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: handleStartWorkout,
      disabled: isLoading,
      accessible: true,
    },
    {
      label: 'Prenota Sessione',
      description: 'Con un professionista',
      icon: Calendar,
      color: 'bg-gradient-to-r from-[#c89116] to-black hover:from-black hover:to-[#c89116] border-2 border-[#c89116]',
      textColor: 'text-white',
      accessible: false,
    },
  ];

  return (
    <>
      <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl p-6 shadow-lg">

        <h3 className="text-lg font-semibold text-pp-gold mb-4">Azioni Rapide</h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            
            if (action.accessible) {
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
            } else {
              return (
                <div key={action.label} className="relative">
                  <Button
                    disabled
                    className={`${action.color} ${action.textColor} h-auto p-4 flex flex-col items-center space-y-2 opacity-50`}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium text-sm">{action.label}</p>
                      <p className="text-xs opacity-90">{action.description}</p>
                    </div>
                  </Button>
                  
                  {/* Overlay individuale per azioni bloccate */}
                  <div className="absolute inset-0 bg-gray-600/40 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-xs text-gray-200">Prossimamente</p>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Modal per nuovo obiettivo */}
      {isObjectiveModalOpen && (
        <NewObjectiveCard onClose={handleObjectiveModalClose} />
      )}
    </>
  );
};

export default QuickActions;
