import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Calendar, Crown, User } from 'lucide-react';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'workouts',
      label: 'Allenamento',
      icon: Dumbbell,
      path: '/workouts'
    },
    {
      id: 'schedule',
      label: 'Appuntamenti',
      icon: Calendar,
      path: '/schedule'
    },
    {
      id: 'subscriptions',
      label: 'Abbonamenti',
      icon: Crown,
      path: '/subscriptions'
    },
    {
      id: 'profile',
      label: 'Profilo',
      icon: User,
      path: '/profile'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 backdrop-blur-lg bg-black/30 border-t border-white/10 z-50">
      {/* Barra di navigazione */}
      <div className="pb-safe h-20">
        <div className="flex justify-around items-center py-1 px-2 sm:py-2 sm:px-4">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-1 px-1 sm:py-2 sm:px-3 rounded-lg transition-colors min-w-0 flex-1 ${
                  active 
                    ? 'text-pp-gold' 
                    : 'text-gray-400 hover:text-pp-gold/80'
                }`}
              >
                <IconComponent 
                  size={20} 
                  className={`mb-0.5 sm:mb-1 ${active ? 'text-pp-gold' : 'text-gray-400'}`}
                />
                <span className={`text-[10px] sm:text-xs font-medium leading-tight text-center ${
                  active ? 'text-pp-gold' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { BottomNavigation };
export default BottomNavigation;