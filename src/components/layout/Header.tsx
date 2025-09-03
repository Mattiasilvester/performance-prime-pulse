import { Bell, Search, Menu, LogOut, ChevronDown, Home, Dumbbell, Calendar, Bot, User, FileText, X, Shield, FileText as FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
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

export const Header = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // RIMOSSO: Timer, Note e Abbonamenti dalla navigazione principale
  // Ora la barra di navigazione è pulita e focalizzata sulle funzioni essenziali

  // Funzioni secondarie nel menu hamburger (mantenute per accesso completo)
  const secondaryNavigationItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Home, path: '/' },
    { id: 'workouts', label: t('navigation.workouts'), icon: Dumbbell, path: '/workouts' },
    { id: 'schedule', label: t('navigation.schedule'), icon: Calendar, path: '/schedule' },
    { id: 'ai-coach', label: t('navigation.aiCoach'), icon: Bot, path: '/ai-coach' },
    { id: 'profile', label: t('navigation.profile'), icon: User, path: '/profile' },
  ];

  const searchableItems = [
    { label: t('navigation.dashboard'), path: '/' },
    { label: t('navigation.workouts'), path: '/workouts' },
    { label: t('navigation.schedule'), path: '/schedule' },
    { label: t('navigation.aiCoach'), path: '/ai-coach' },
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

  const handleSearchItemClick = (path: string) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-black shadow-lg border-b-2 border-pp-gold z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden border border-pp-gold">
              <img 
                src="/lovable-uploads/689d57c4-e221-4d98-91fb-b40567d2e305.png" 
                alt="Performance Prime Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm lg:text-xl font-bold text-pp-gold leading-tight">Performance Prime</h1>
              <p className="text-xs text-gray-300 leading-tight">Oltre ogni limite</p>
            </div>
          </div>

          {/* RIMOSSO: Barra di navigazione rapida per desktop con Timer, Note e Abbonamenti */}
          {/* Ora l'header è pulito e focalizzato su logo, search e menu utente */}

          {/* User info and actions */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-sm text-gray-300 hidden sm:block">
                {userProfile?.name || user.email}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-gray-800 hover:text-pp-gold transition-colors"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-white hover:bg-gray-800 hover:text-pp-gold transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-800 border border-gray-600 shadow-lg z-50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-600 pb-2">
                    <h3 className="font-semibold text-pp-gold">Notifiche</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-blue-400 hover:bg-blue-400/10"
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
                          className={`relative p-3 rounded-lg border border-gray-600 group transition-all duration-200 ${
                            notification.read 
                              ? 'bg-gray-700/50 opacity-75' 
                              : 'bg-gray-700'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-500/20 rounded-full"
                          >
                            <X className="h-3 w-3 text-red-400 hover:text-red-300" />
                          </button>
                          <p className={`text-sm pr-6 ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                            {notification.message}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">{notification.time}</p>
                          {!notification.read && (
                            <div className="absolute top-2 left-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm py-4 text-center">Non ci sono notifiche al momento</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-pp-gold transition-colors">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border border-gray-600 shadow-lg z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-600">
                  <p className="text-sm font-medium text-white">{userProfile?.name || user?.email}</p>
                  <p className="text-xs text-gray-400">Utente Premium</p>
                </div>
                
                {/* Navigation Items */}
                {secondaryNavigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className="flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors text-white hover:bg-gray-700 hover:text-white"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                
                {/* Separatore */}
                <div className="border-t border-gray-600 my-2"></div>
                
                {/* Termini e Condizioni */}
                <DropdownMenuItem
                  onClick={() => navigate('/terms-and-conditions')}
                  className="flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors text-white hover:bg-gray-700 hover:text-white"
                >
                  <FileTextIcon className="h-5 w-5" />
                  <span className="font-medium">Termini e Condizioni</span>
                </DropdownMenuItem>
                
                {/* GDPR */}
                <DropdownMenuItem
                  onClick={() => navigate('/privacy-policy')}
                  className="flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors text-white hover:bg-gray-700 hover:text-white"
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
        <div className="absolute top-16 left-0 right-0 bg-black border-b-2 border-pp-gold shadow-lg z-50" ref={searchRef}>
          <div className="container mx-auto px-4 py-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca allenamenti, esercizi…"
                className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pp-gold transition-colors"
              />
              <Button
                onClick={() => setShowSearch(false)}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Results */}
            {searchQuery && (
              <div className="max-w-md mx-auto mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchItemClick(item.path)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-600 last:border-b-0"
                    >
                      {item.label}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-400">Nessun risultato trovato</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-gray-800 border-2 border-pp-gold max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-pp-gold text-xl font-bold">
              Conferma Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Sei sicuro di voler effettuare il logout? Verrai reindirizzato alla pagina di accesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-transparent border border-gray-600 text-white hover:bg-gray-700 hover:text-white transition-colors">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLogout}
              className="bg-pp-gold text-black hover:bg-yellow-400 transition-colors"
            >
              Conferma Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};
