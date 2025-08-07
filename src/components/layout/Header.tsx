import { Bell, Search, Menu, LogOut, ChevronDown, Home, Dumbbell, Calendar, Bot, User, FileText, Timer, CreditCard, X, Shield, FileText as FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useTranslation } from '@/hooks/useTranslation';
import { fetchUserProfile, UserProfile } from '@/services/userService';

// Interfaccia per le notifiche con stato "read"
interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

export const Header = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: "Nuovo allenamento disponibile", time: "2 ore fa", read: false },
    { id: 2, message: "Ricordati di completare il tuo obiettivo settimanale", time: "1 giorno fa", read: false },
    { id: 3, message: "Il tuo piano è stato aggiornato", time: "2 giorni fa", read: false }
  ]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Calcola le notifiche non lette
  const unreadNotifications = notifications.filter(notification => !notification.read);
  const unreadCount = unreadNotifications.length;

  const navigationItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Home, path: '/' },
    { id: 'subscriptions', label: 'Abbonamenti', icon: CreditCard, path: '/subscriptions' },
    { id: 'workouts', label: t('navigation.workouts'), icon: Dumbbell, path: '/workouts' },
    { id: 'schedule', label: t('navigation.schedule'), icon: Calendar, path: '/schedule' },
    { id: 'timer', label: t('navigation.timer'), icon: Timer, path: '/timer' },
    { id: 'ai-coach', label: t('navigation.aiCoach'), icon: Bot, path: '/ai-coach' },
    { id: 'notes', label: t('navigation.notes'), icon: FileText, path: '/notes' },
    { id: 'profile', label: t('navigation.profile'), icon: User, path: '/profile' },
  ];

  const searchableItems = [
    { label: t('navigation.dashboard'), path: '/' },
    { label: 'Abbonamenti', path: '/subscriptions' },
    { label: t('navigation.workouts'), path: '/workouts' },
    { label: t('navigation.schedule'), path: '/schedule' },
    { label: t('navigation.timer'), path: '/timer' },
    { label: t('navigation.aiCoach'), path: '/ai-coach' },
    { label: t('navigation.notes'), path: '/notes' },
    { label: t('navigation.profile'), path: '/profile' },
    { label: t('settings.personalInfo'), path: '/profile' },
  ];

  useEffect(() => {
    if (searchQuery) {
      const filtered = searchableItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(searchableItems);
    }
  }, [searchQuery]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const profile = await fetchUserProfile();
        setUserProfile(profile);
      }
    };
    loadUserProfile();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSearch]);

  const openLogoutDialog = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success('Logout effettuato con successo');
      navigate('/auth');
    } catch (error: any) {
      console.error('Errore durante il logout:', error);
      toast.error('Errore durante il logout');
    } finally {
      setShowLogoutDialog(false);
    }
  };

  const handleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  // Funzione per rimuovere una notifica
  const removeNotification = (notificationId: number) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  // Funzione per segnare una notifica come letta
  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ));
  };

  // Funzione per segnare tutte le notifiche come lette
  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true
    })));
  };

  const handleSearchItemClick = (path: string) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-surface-primary shadow-lg border-b-2 border-brand-primary z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-surface-secondary rounded-xl flex items-center justify-center overflow-hidden border border-border-primary">
              <img 
                src="/lovable-uploads/689d57c4-e221-4d98-91fb-b40567d2e305.png" 
                alt="Performance Prime Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm lg:text-xl font-bold text-brand-primary leading-tight">Performance Prime</h1>
              <p className="text-xs text-text-secondary leading-tight">Oltre ogni limite</p>
            </div>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-sm text-text-secondary hidden sm:block">
                {userProfile?.name || user.email}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-text-primary hover:bg-interactive-primary hover:text-background transition-colors"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-text-primary hover:bg-interactive-primary hover:text-background transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-interactive-warning text-background text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-surface-primary border border-border-primary shadow-lg z-50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-border-primary pb-2">
                    <h3 className="font-semibold text-brand-primary">Notifiche</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-interactive-primary hover:bg-interactive-primary/10"
                      >
                        Segna tutte come lette
                      </Button>
                    )}
                  </div>
                  {notifications.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`relative p-3 rounded-lg border border-border-secondary group transition-all duration-200 ${
                            notification.read 
                              ? 'bg-surface-secondary/50 opacity-75' 
                              : 'bg-surface-secondary'
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-interactive-danger/20 rounded-full"
                          >
                            <X className="h-3 w-3 text-interactive-danger hover:text-interactive-danger/80" />
                          </button>
                          <p className={`text-sm pr-6 ${notification.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                            {notification.message}
                          </p>
                          <p className="text-text-muted text-xs mt-1">{notification.time}</p>
                          {!notification.read && (
                            <div className="absolute top-2 left-2 w-2 h-2 bg-interactive-warning rounded-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-muted text-sm py-4 text-center">Non ci sono notifiche al momento</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-text-primary hover:bg-interactive-primary hover:text-background transition-colors">
                  <Menu className="h-5 w-5" />
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-surface-primary border border-border-primary shadow-lg"
              >
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                        isActive
                          ? "bg-interactive-primary text-background"
                          : "text-text-primary hover:bg-surface-secondary hover:text-text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem
                  onClick={openLogoutDialog}
                  className="flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors text-text-primary hover:bg-surface-secondary hover:text-text-primary"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
                
                {/* Separatore */}
                <div className="border-t border-border-primary my-2"></div>
                
                {/* Termini e Condizioni */}
                <DropdownMenuItem
                  onClick={() => navigate('/terms-and-conditions')}
                  className="flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors text-text-primary hover:bg-surface-secondary hover:text-text-primary"
                >
                  <FileTextIcon className="h-5 w-5" />
                  <span className="font-medium">Termini e Condizioni</span>
                </DropdownMenuItem>
                
                {/* GDPR */}
                <DropdownMenuItem
                  onClick={() => navigate('/privacy-policy')}
                  className="flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors text-text-primary hover:bg-surface-secondary hover:text-text-primary"
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Privacy Policy</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 bg-surface-primary border-b-2 border-brand-primary shadow-lg z-50" ref={searchRef}>
          <div className="container mx-auto px-4 py-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca allenamenti, esercizi…"
                className="w-full pl-10 pr-10 py-2 bg-surface-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
              />
              <Button
                onClick={() => setShowSearch(false)}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary hover:bg-interactive-primary hover:text-background transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Results */}
            {searchQuery && (
              <div className="max-w-md mx-auto mt-2 bg-surface-primary border border-border-primary rounded-lg shadow-lg">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchItemClick(item.path)}
                      className="w-full px-4 py-2 text-left text-text-primary hover:bg-surface-secondary hover:text-text-primary transition-colors border-b border-border-primary last:border-b-0"
                    >
                      {item.label}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-text-muted">Nessun risultato trovato</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-surface-primary border-2 border-border-primary max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-primary text-xl font-bold">
              Conferma Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Sei sicuro di voler effettuare il logout? Verrai reindirizzato alla pagina di accesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border border-border-primary text-text-primary hover:bg-surface-secondary hover:text-text-primary transition-colors">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLogout}
              className="bg-interactive-primary text-background hover:bg-interactive-primary/90 transition-colors"
            >
              Conferma Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};
