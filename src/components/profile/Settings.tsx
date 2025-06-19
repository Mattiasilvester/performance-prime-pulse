
import { Bell, Lock, Globe, HelpCircle, LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Informazioni personali', action: 'edit-profile' },
      { icon: Lock, label: 'Password e sicurezza', action: 'security' },
      { icon: Bell, label: 'Notifiche', action: 'notifications' },
    ],
  },
  {
    title: 'Preferenze',
    items: [
      { icon: Globe, label: 'Lingua e regione', action: 'language' },
      { icon: Shield, label: 'Privacy', action: 'privacy' },
    ],
  },
  {
    title: 'Supporto',
    items: [
      { icon: HelpCircle, label: 'Centro assistenza', action: 'help' },
    ],
  },
];

export const Settings = () => {
  return (
    <div className="bg-black rounded-2xl shadow-sm border border-[#EEBA2B] p-6">
      <h3 className="text-xl font-semibold text-[#EEBA2B] mb-6">Impostazioni</h3>

      <div className="space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h4 className="text-sm font-medium text-[#EEBA2B] mb-3 uppercase tracking-wide">
              {section.title}
            </h4>
            <div className="space-y-2">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-[#CCCCCC] hover:bg-opacity-20 focus:bg-[#CCCCCC] focus:bg-opacity-20 focus:outline-none transition-colors text-left"
                  >
                    <Icon className="h-5 w-5 text-white" />
                    <span className="font-medium text-white">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-200">
          <Button variant="destructive" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Disconnetti
          </Button>
        </div>
      </div>
    </div>
  );
};
