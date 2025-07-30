import { Play, Calendar, MessageSquare, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Componente di test completamente pulito - NO SUPABASE - 29 Luglio 2025
const QuickActionsTest = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Inizia Allenamento',
      subtitle: 'Crea nuovo workout',
      icon: Play,
      color: 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: () => {
        console.log('Inizia Allenamento clicked - NO SUPABASE');
        // Naviga direttamente alla pagina workout senza usare Supabase
        navigate('/app/workouts');
      },
    },
    {
      title: 'Prenota Sessione',
      subtitle: 'Con un professionista',
      icon: Calendar,
      color: 'bg-gradient-to-r from-[#c89116] to-black hover:from-black hover:to-[#c89116] border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: () => {
        console.log('Prenota Sessione clicked - NO SUPABASE');
        navigate('/app/schedule');
      },
    },
    {
      title: 'Chat AI Coach',
      subtitle: 'Chiedi consiglio',
      icon: MessageSquare,
      color: 'bg-gradient-to-r from-black to-[#c89116] hover:from-[#c89116] hover:to-black border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: () => {
        console.log('Chat AI Coach clicked - NO SUPABASE');
        navigate('/app/ai-coach');
      },
    },
    {
      title: 'Nuovo Obiettivo',
      subtitle: 'Sfida te stesso',
      icon: Plus,
      color: 'bg-gradient-to-r from-[#c89116] to-black hover:from-black hover:to-[#c89116] border-2 border-[#c89116]',
      textColor: 'text-white',
      onClick: () => {
        console.log('Nuovo Obiettivo clicked - NO SUPABASE');
        navigate('/app/profile');
      },
    },
  ];

  return (
    <>
      {/* Container di test completamente pulito - NO SUPABASE - NO OVERLAY */}
      <div className="bg-gradient-to-br from-black to-[#c89116]/10 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-pp-gold mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={action.onClick}
                className={`${action.color} ${action.textColor} h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-all duration-200 rounded-lg`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-90">{action.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export { QuickActionsTest }; 