import { useState, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  FolderKanban,
  UserCircle,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/partner/dashboard' },
  { icon: Calendar, label: 'Calendario', path: '/partner/dashboard/calendario' },
  { icon: ClipboardList, label: 'Prenotazioni', path: '/partner/dashboard/prenotazioni' },
  { icon: Users, label: 'Clienti', path: '/partner/dashboard/clienti' },
  { icon: FolderKanban, label: 'Progetti', path: '/partner/dashboard/progetti' },
  { icon: UserCircle, label: 'Profilo', path: '/partner/dashboard/profilo' },
  { icon: Settings, label: 'Impostazioni', path: '/partner/dashboard/impostazioni' },
];

interface PartnerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export function PartnerSidebar({ isOpen, onClose, currentPath }: PartnerSidebarProps) {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  // Traccia il mount per evitare glitch visivi al caricamento
  // useLayoutEffect viene eseguito prima del paint
  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout effettuato');
      navigate('/partner/login');
    } catch (error) {
      toast.error('Errore durante il logout');
    }
  };

  return (
    <>
      {/* Overlay Mobile */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onClose}
            />
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        data-sidebar-open={isOpen ? 'true' : 'false'}
        data-partner-sidebar="true"
        className={`
          fixed top-0 left-0 h-full w-72 md:w-64
          bg-white border-r border-gray-200 z-50
          flex flex-col
          transform
          ${isMounted ? 'transition-transform duration-300 ease-in-out' : 'transition-none'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:!translate-x-0
          shadow-xl md:shadow-none
        `}
      >
        {/* Header Sidebar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold">
            <span className="text-black">Prime</span>
            <span className="text-[#EEBA2B]"> Pro</span>
          </h1>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || 
              (item.path !== '/partner/dashboard' && currentPath.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Chiudi sidebar su mobile quando si clicca un link
                  onClose();
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-[#EEBA2B]/25 text-gray-900 border-l-4 border-[#EEBA2B] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Esci</span>
          </button>
        </div>
      </aside>
    </>
  );
}

