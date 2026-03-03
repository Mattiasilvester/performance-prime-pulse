import { Bell, Lock, Globe, HelpCircle, User, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const settingsItems = [
  { icon: User, label: 'Informazioni personali', action: '/settings/personal-info' },
  { icon: Lock, label: 'Password e sicurezza', action: '/settings/security' },
  { icon: Bell, label: 'Notifiche', action: '/settings/notifications' },
  { icon: Globe, label: 'Lingua e regione', action: '/settings/language' },
  { icon: Shield, label: 'Privacy', action: '/settings/privacy' },
  { icon: HelpCircle, label: 'Centro assistenza', action: '/settings/help' },
];

export const Settings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSettingClick = (action: string) => {
    sessionStorage.setItem('settingsScrollPosition', window.scrollY.toString());
    navigate(action);
  };

  const handleLogout = () => {
    signOut();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="bg-[#16161A] rounded-[14px] border border-[rgba(255,255,255,0.06)] overflow-hidden">
      <h3 className="text-base font-bold text-[#F0EDE8] px-4 pt-4 pb-2">Impostazioni</h3>
      <div className="divide-y divide-[rgba(255,255,255,0.06)]">
        {settingsItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSettingClick(item.action)}
              className="w-full flex items-center gap-3.5 py-3.5 px-4 text-left hover:bg-[#1E1E24]/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-[10px] bg-[#1E1E24] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#8A8A96]" />
              </div>
              <span className="flex-1 text-sm font-medium text-[#F0EDE8]">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-[#5C5C66] shrink-0" />
            </button>
          );
        })}
      </div>
      <div className="p-4 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-[14px] text-sm font-semibold text-[#EF4444] border border-[rgba(239,68,68,0.3)] transition-opacity hover:opacity-90"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          Esci
        </button>
      </div>
    </div>
  );
};
