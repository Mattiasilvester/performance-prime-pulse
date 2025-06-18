
import { Home, Dumbbell, Calendar, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveSection = 'dashboard' | 'workouts' | 'schedule' | 'ai-coach' | 'profile';

interface NavigationProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
}

const navigationItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
  { id: 'workouts' as const, label: 'Allenamenti', icon: Dumbbell },
  { id: 'schedule' as const, label: 'Agenda', icon: Calendar },
  { id: 'ai-coach' as const, label: 'AI Coach', icon: Bot },
  { id: 'profile' as const, label: 'Profilo', icon: User },
];

export const Navigation = ({ activeSection, onSectionChange }: NavigationProps) => {
  return (
    <nav className="lg:w-64">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-black rounded-2xl shadow-lg border-2 border-pp-gold p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 font-medium",
                  isActive
                    ? "bg-pp-gold text-black shadow-lg shadow-pp-gold/25"
                    : "text-pp-gold hover:bg-pp-gold/10 hover:text-pp-gold"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t-2 border-pp-gold shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "text-pp-gold"
                    : "text-pp-gold/60 hover:text-pp-gold"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
