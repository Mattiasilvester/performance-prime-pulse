
import { Bell, Lock, Globe, HelpCircle, User, Shield } from 'lucide-react';

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
    <div className="bg-black rounded-2xl shadow-sm border border-gray-500 p-6 relative">
      {/* Overlay per le impostazioni */}
      <div className="absolute inset-0 bg-gray-500/40 backdrop-blur-[1px] rounded-2xl border-2 border-gray-500 z-10 flex flex-col items-center justify-center text-white text-center p-6">
        <Lock className="h-10 w-10 text-white mb-3" />
        <h3 className="text-lg font-bold mb-2">Funzionalità in arrivo</h3>
        <p className="text-sm opacity-90">Le impostazioni saranno disponibili presto!</p>
      </div>

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
      </div>
    </div>
  );
};
