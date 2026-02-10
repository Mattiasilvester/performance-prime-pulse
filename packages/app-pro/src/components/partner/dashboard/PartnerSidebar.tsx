import { useState, useLayoutEffect, useEffect } from 'react';
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
  X,
  ChevronDown,
  Briefcase,
  Star,
  Bell,
  Loader2,
  CreditCard,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePartnerNotifications } from '@/hooks/usePartnerNotifications';
import { NotificationItem } from '@/components/partner/notifications/NotificationItem';
import { NotificationGroup } from '@/components/partner/notifications/NotificationGroup';
import { groupNotifications, isNotificationGroup } from '@/utils/notificationGrouping';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Overview', path: '/partner/dashboard' },
  { icon: Calendar, label: 'Calendario', path: '/partner/dashboard/calendario' },
  { icon: ClipboardList, label: 'Prenotazioni', path: '/partner/dashboard/prenotazioni' },
  { icon: Briefcase, label: 'Servizi e Tariffe', path: '/partner/dashboard/servizi' },
  { icon: Receipt, label: 'Costi & Spese', path: '/partner/dashboard/costi-spese' },
  { icon: TrendingUp, label: 'Andamento e analytics', path: '/partner/dashboard/andamento' },
  { icon: Star, label: 'Recensioni', path: '/partner/dashboard/recensioni' },
  { icon: CreditCard, label: 'Abbonamento', path: '/partner/dashboard/abbonamento' },
];

interface PartnerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

export function PartnerSidebar({ isOpen, onClose, currentPath }: PartnerSidebarProps) {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);
  const [clientiExpanded, setClientiExpanded] = useState(false);
  
  // Hook notifiche
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = usePartnerNotifications();

  // Auto-espandi/collassa in base all'URL
  useEffect(() => {
    const isInClientiSection = currentPath.startsWith('/partner/dashboard/clienti');
    setClientiExpanded(isInClientiSection);
  }, [currentPath]);

  // Traccia il mount per evitare glitch visivi al caricamento
  // useLayoutEffect viene eseguito prima del paint
  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  // Handler click Clienti
  const handleClientiClick = () => {
    navigate('/partner/dashboard/clienti');
    // L'useEffect si occuperà di espandere il menu
    onClose(); // Chiudi sidebar su mobile
  };

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
        data-tour="sidebar-container"
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
          <button
            type="button"
            onClick={() => {
              navigate('/partner/dashboard');
              onClose();
            }}
            className="p-0 m-0 border-0 bg-transparent text-left min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 700 }}
          >
            <span className="text-black">Prime</span>
            <span className="text-[#EEBA2B]"> Pro</span>
          </button>
          <div className="flex items-center gap-2">
            {/* Bottone Notifiche */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative p-2.5 text-gray-700 hover:bg-[#EEBA2B]/10 hover:text-[#EEBA2B] transition-all duration-200 rounded-lg border border-gray-200 hover:border-[#EEBA2B]/30"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#EEBA2B] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px] shadow-md animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg z-[99999]" align="end">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="font-semibold text-gray-900">Notifiche</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await markAllAsRead();
                            toast.success('Tutte le notifiche sono state segnate come lette');
                          } catch (err) {
                            toast.error('Errore nel segnare le notifiche come lette');
                          }
                        }}
                        className="text-xs text-[#EEBA2B] hover:bg-[#EEBA2B]/10"
                      >
                        Segna tutte come lette
                      </Button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                    ) : notifications.length > 0 ? (
                      (() => {
                        // Raggruppa notifiche (notifiche dello stesso tipo entro 24h vengono raggruppate)
                        const grouped = groupNotifications(notifications, 24);
                        
                        return grouped.map((item) => {
                          if (isNotificationGroup(item)) {
                            // Renderizza gruppo
                            return (
                              <NotificationGroup
                                key={item.id}
                                group={item}
                                onMarkAsRead={async (id) => {
                                  try {
                                    await markAsRead(id);
                                  } catch (err) {
                                    toast.error('Errore nel segnare la notifica come letta');
                                  }
                                }}
                                onRemove={async (id) => {
                                  try {
                                    await removeNotification(id);
                                    toast.success('Notifica rimossa');
                                  } catch (err) {
                                    toast.error('Errore nella rimozione della notifica');
                                  }
                                }}
                                onMarkGroupAsRead={async (ids) => {
                                  try {
                                    await Promise.all(ids.map(id => markAsRead(id)));
                                    toast.success('Notifiche segnate come lette');
                                  } catch (err) {
                                    toast.error('Errore nel segnare le notifiche come lette');
                                  }
                                }}
                                onNavigateToUrl={(url) => navigate(url)}
                              />
                            );
                          } else {
                            // Renderizza notifica singola
                            return (
                              <NotificationItem
                                key={item.id}
                                notification={item}
                                onMarkAsRead={async (id) => {
                                  try {
                                    await markAsRead(id);
                                  } catch (err) {
                                    toast.error('Errore nel segnare la notifica come letta');
                                  }
                                }}
                                onRemove={async (id) => {
                                  try {
                                    await removeNotification(id);
                                    toast.success('Notifica rimossa');
                                  } catch (err) {
                                    toast.error('Errore nella rimozione della notifica');
                                  }
                                }}
                                onNavigateToUrl={(url) => navigate(url)}
                              />
                            );
                          }
                        });
                      })()
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Nessuna notifica</p>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Bottone chiudi mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
{/* Overview, Calendario, Prenotazioni */}
          {menuItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path ||
              (item.path !== '/partner/dashboard' && currentPath.startsWith(item.path));
            const dataTour = item.path === '/partner/dashboard' ? 'sidebar-overview' : item.path === '/partner/dashboard/calendario' ? 'sidebar-calendario' : item.path === '/partner/dashboard/prenotazioni' ? 'sidebar-prenotazioni' : undefined;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                {...(dataTour ? { 'data-tour': dataTour } : {})}
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

          {/* Voce Clienti Espandibile (4ª posizione, ex Profilo) */}
          <div data-tour="sidebar-clienti">
            <button
              onClick={handleClientiClick}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                ${currentPath.startsWith('/partner/dashboard/clienti')
                  ? 'bg-[#EEBA2B]/25 text-gray-900 border-l-4 border-[#EEBA2B] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span className="font-medium">Clienti</span>
              </div>
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 ${
                  clientiExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Sottomenu Progetti */}
            {clientiExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  data-tour="sidebar-progetti"
                  onClick={() => {
                    navigate('/partner/dashboard/clienti/progetti');
                    onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
                    ${currentPath === '/partner/dashboard/clienti/progetti'
                      ? 'bg-[#EEBA2B]/10 text-[#EEBA2B] font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }
                  `}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span className="text-sm">Progetti</span>
                </button>
              </div>
            )}
          </div>

{/* Servizi, Costi, Andamento, Recensioni, Abbonamento */}
          {menuItems.slice(3).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path ||
              (item.path !== '/partner/dashboard' && currentPath.startsWith(item.path));
            const pathToTour: Record<string, string> = {
              '/partner/dashboard/servizi': 'sidebar-servizi',
              '/partner/dashboard/costi-spese': 'sidebar-costi-spese',
              '/partner/dashboard/andamento': 'sidebar-andamento',
              '/partner/dashboard/recensioni': 'sidebar-recensioni',
              '/partner/dashboard/abbonamento': 'sidebar-abbonamento',
            };
            const dataTour = pathToTour[item.path];

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                {...(dataTour ? { 'data-tour': dataTour } : {})}
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

          {/* Profilo - sopra Impostazioni */}
          <Link
            to="/partner/dashboard/profilo"
            onClick={() => onClose()}
            data-tour="sidebar-profilo"
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${currentPath.startsWith('/partner/dashboard/profilo')
                ? 'bg-[#EEBA2B]/25 text-gray-900 border-l-4 border-[#EEBA2B] font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <UserCircle className="w-5 h-5" />
            <span>Profilo</span>
          </Link>

          {/* Impostazioni */}
          <Link
            to="/partner/dashboard/impostazioni"
            onClick={() => {
              onClose();
            }}
            data-tour="sidebar-impostazioni"
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${currentPath.startsWith('/partner/dashboard/impostazioni')
                ? 'bg-[#EEBA2B]/25 text-gray-900 border-l-4 border-[#EEBA2B] font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <Settings className="w-5 h-5" />
            <span>Impostazioni</span>
          </Link>
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

