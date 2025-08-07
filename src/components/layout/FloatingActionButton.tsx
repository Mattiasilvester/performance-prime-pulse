import { useState } from 'react';
import { Plus, Clock, BookOpen, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const quickActions = [
    {
      id: 'timer',
      label: 'Timer',
      icon: Clock,
      path: '/timer',
      color: 'bg-brand-primary hover:bg-brand-primary/80'
    },
    {
      id: 'notes',
      label: 'Note',
      icon: BookOpen,
      path: '/notes',
      color: 'bg-interactive-primary hover:bg-interactive-primary/80'
    },
    {
      id: 'subscriptions',
      label: 'Abbonamenti',
      icon: CreditCard,
      path: '/subscriptions',
      color: 'bg-surface-secondary hover:bg-surface-secondary/80'
    },
  ];

  const handleActionClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="lg:hidden fixed bottom-20 right-4 z-50">
      {/* Quick Actions */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                onClick={() => handleActionClick(action.path)}
                className={`${action.color} text-background shadow-lg w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110`}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen 
            ? 'bg-interactive-danger hover:bg-interactive-danger/80' 
            : 'bg-brand-primary hover:bg-brand-primary/80'
        } text-background shadow-lg w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
};
