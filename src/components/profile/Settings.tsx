
import { Bell, Lock, Globe, HelpCircle, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Informazioni personali', action: '/settings/personal-info' },
      { icon: Lock, label: 'Password e sicurezza', action: '/settings/security' },
      { icon: Bell, label: 'Notifiche', action: '/settings/notifications' },
    ],
  },
  {
    title: 'Preferenze',
    items: [
      { icon: Globe, label: 'Lingua e regione', action: '/settings/language' },
      { icon: Shield, label: 'Privacy', action: '/settings/privacy' },
    ],
  },
  {
    title: 'Supporto',
    items: [
      { icon: HelpCircle, label: 'Centro assistenza', action: '/settings/help' },
    ],
  },
];

export const Settings = () => {
  const navigate = useNavigate();

  // Restore scroll position when returning to settings
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('settingsScrollPosition');
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
        sessionStorage.removeItem('settingsScrollPosition');
      }, 100);
    }
  }, []);

  const handleSettingClick = (action: string) => {
    // Save current scroll position before navigating
    sessionStorage.setItem('settingsScrollPosition', window.scrollY.toString());
    navigate(action);
  };

  return (
    <div className="bg-surface-primary rounded-2xl shadow-sm border-2 border-brand-primary p-6 relative">
      <h3 className="text-xl font-semibold text-brand-primary mb-6">Impostazioni</h3>

      <div className="space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h4 className="text-sm font-medium text-brand-primary mb-3 uppercase tracking-wide">
              {section.title}
            </h4>
            <div className="space-y-2">
              {settingsSections[sectionIndex].items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    onClick={() => handleSettingClick(item.action)}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-surface-secondary hover:bg-opacity-80 focus:bg-surface-secondary focus:bg-opacity-80 focus:outline-none transition-colors text-left group"
                  >
                    <Icon className="h-5 w-5 text-text-primary group-hover:text-brand-primary transition-colors" />
                    <span className="font-medium text-text-primary group-hover:text-brand-primary transition-colors">{item.label}</span>
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
