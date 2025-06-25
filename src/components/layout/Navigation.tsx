import { Home, Dumbbell, Calendar, Bot, User, CreditCard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export const Navigation = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navigationItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Home, path: '/' },
    { id: 'subscriptions', label: 'Abbonamenti', icon: CreditCard, path: '/subscriptions' },
    { id: 'workouts', label: t('navigation.workouts'), icon: Dumbbell, path: '/workouts' },
    { id: 'schedule', label: t('navigation.schedule'), icon: Calendar, path: '/schedule' },
    { id: 'ai-coach', label: t('navigation.aiCoach'), icon: Bot, path: '/ai-coach' },
    { id: 'profile', label: t('navigation.profile'), icon: User, path: '/profile' },
  ];

  return (
    <nav className="lg:w-64">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-black rounded-2xl shadow-lg border-2 border-pp-gold p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 font-medium",
                  isActive
                    ? "bg-pp-gold text-black shadow-lg shadow-pp-gold/25"
                    : "text-pp-gold hover:bg-pp-gold/10 hover:text-pp-gold"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
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
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
