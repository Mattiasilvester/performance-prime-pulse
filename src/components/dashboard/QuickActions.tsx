
import { Play, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  {
    label: 'Inizia Allenamento',
    description: 'Workout di oggi',
    icon: Play,
    color: 'bg-blue-600 hover:bg-blue-700',
    textColor: 'text-white',
  },
  {
    label: 'Prenota Sessione',
    description: 'Con un professionista',
    icon: Calendar,
    color: 'bg-orange-500 hover:bg-orange-600',
    textColor: 'text-white',
  },
  {
    label: 'Chat AI Coach',
    description: 'Chiedi consiglio',
    icon: MessageSquare,
    color: 'bg-purple-600 hover:bg-purple-700',
    textColor: 'text-white',
  },
  {
    label: 'Nuovo Obiettivo',
    description: 'Sfida te stesso',
    icon: Plus,
    color: 'bg-slate-600 hover:bg-slate-700',
    textColor: 'text-white',
  },
];

export const QuickActions = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Azioni Rapide</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              className={`${action.color} ${action.textColor} h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-transform duration-200`}
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
