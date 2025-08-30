// QuickActions Component
// Bottoni quick-action per PrimeBot

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  Target, 
  Heart, 
  Clock,
  BookOpen,
  Settings
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: string;
  color: string;
}

interface QuickActionsProps {
  onActionSelect: (action: string) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionSelect,
  disabled = false
}) => {
  const quickActions: QuickAction[] = [
    {
      id: 'workout',
      label: 'Nuovo Allenamento',
      icon: <Dumbbell size={16} />,
      action: 'Crea un nuovo allenamento personalizzato',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'schedule',
      label: 'Pianifica',
      icon: <Calendar size={16} />,
      action: 'Pianifica il mio prossimo allenamento',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'progress',
      label: 'Progressi',
      icon: <TrendingUp size={16} />,
      action: 'Mostrami i miei progressi',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'goals',
      label: 'Obiettivi',
      icon: <Target size={16} />,
      action: 'Gestisci i miei obiettivi',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'nutrition',
      label: 'Nutrizione',
      icon: <Heart size={16} />,
      action: 'Consigli nutrizionali',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'timer',
      label: 'Timer',
      icon: <Clock size={16} />,
      action: 'Avvia un timer per l\'allenamento',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      id: 'tips',
      label: 'Consigli',
      icon: <BookOpen size={16} />,
      action: 'Dammi consigli per migliorare',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      id: 'settings',
      label: 'Impostazioni',
      icon: <Settings size={16} />,
      action: 'Modifica le mie preferenze',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    if (!disabled) {
      onActionSelect(action.action);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Azioni Rapide
        </h3>
        <p className="text-xs text-gray-500">
          Clicca per chiedere a PrimeBot
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            onClick={() => handleActionClick(action)}
            disabled={disabled}
            className={`h-auto p-3 flex flex-col items-center gap-2 text-white ${action.color} hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex-shrink-0">
              {action.icon}
            </div>
            <span className="text-xs font-medium text-center leading-tight">
              {action.label}
            </span>
          </Button>
        ))}
      </div>

      {/* Contextual Tips */}
      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#EEBA2B] to-[#FFD700] rounded-full flex items-center justify-center">
            <Target size={12} className="text-gray-800" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-600">
              <strong>Suggerimento:</strong> Puoi anche scrivere liberamente per chiedere consigli personalizzati, 
              programmare allenamenti o ricevere motivazione!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
