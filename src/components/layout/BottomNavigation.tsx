import { Home, Dumbbell, Calendar, Bot, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export const BottomNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/app' },
    { id: 'workouts', label: 'Allenamento', icon: Dumbbell, path: '/workouts' },
    { id: 'schedule', label: 'Appuntamenti', icon: Calendar, path: '/schedule' },
    { id: 'ai-coach', label: 'Coach AI', icon: Bot, path: '/ai-coach' },
    { id: 'profile', label: 'Profilo', icon: User, path: '/profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t-2 border-pp-gold shadow-lg z-50">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "text-pp-gold"
                  : "text-pp-gold/60 hover:text-pp-gold"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}; 