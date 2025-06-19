
import { Play, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();

  const handleStartWorkout = () => {
    navigate('/schedule', { state: { openWorkoutModal: true } });
  };

  const actions = [
    {
      label: 'Inizia Allenamento',
      description: 'Workout di oggi',
      icon: Play,
      color: 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: handleStartWorkout,
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
