
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
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
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
                    ? "text-blue-600"
                    : "text-slate-400"
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
