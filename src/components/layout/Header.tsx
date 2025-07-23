import { Bell, Search, Menu, LogOut, ChevronDown } from 'lucide-react';
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
import { Home, Dumbbell, Calendar, Bot, User, FileText, Timer, CreditCard, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { fetchUserProfile, UserProfile } from '@/services/userService';

export const Header = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Nuovo allenamento disponibile", time: "2 ore fa" },
    { id: 2, message: "Ricordati di completare il tuo obiettivo settimanale", time: "1 giorno fa" },
    { id: 3, message: "Il tuo piano è stato aggiornato", time: "2 giorni fa" }
  ]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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

  const handleLogout = async () => {
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

  const removeNotification = (notificationId: number) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
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
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/689d57c4-e221-4d98-91fb-b40567d2e305.png" 
                alt="Performance Prime Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm lg:text-xl font-bold text-pp-gold leading-tight">Performance Prime</h1>
              <p className="text-xs text-pp-gold/80 leading-tight">Oltre ogni limite</p>
            </div>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-sm text-pp-gold/80 hidden sm:block">
                {userProfile?.name || user.email}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-pp-gold hover:bg-pp-gold hover:text-black"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-pp-gold hover:bg-pp-gold hover:text-black">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pp-gold text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-black border-pp-gold border-2 shadow-lg z-50">
                <div className="space-y-2">
                  <h3 className="font-semibold text-pp-gold border-b border-pp-gold/20 pb-2">Notifiche</h3>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="relative p-3 bg-pp-gold/10 rounded-lg border border-pp-gold/20 group">
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-500/20 rounded-full"
                        >
                          <X className="h-3 w-3 text-red-400 hover:text-red-300" />
                        </button>
                        <p className="text-pp-gold text-sm pr-6">{notification.message}</p>
                        <p className="text-pp-gold/60 text-xs mt-1">{notification.time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-pp-gold/60 text-sm py-4 text-center">Non ci sono notifiche al momento</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-pp-gold hover:bg-pp-gold hover:text-black">
                  <Menu className="h-5 w-5" />
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-black border-pp-gold border-2 shadow-lg"
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
                          ? "bg-pp-gold text-black"
                          : "text-pp-gold hover:bg-pp-gold/10 hover:text-pp-gold"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors text-pp-gold hover:bg-pp-gold/10 hover:text-pp-gold"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pp-gold" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca allenamenti, esercizi…"
                className="w-full pl-10 pr-10 py-2 bg-black border border-pp-gold rounded-lg text-pp-gold placeholder-pp-gold/50 focus:outline-none focus:ring-2 focus:ring-pp-gold"
              />
              <Button
                onClick={() => setShowSearch(false)}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-pp-gold hover:bg-pp-gold hover:text-black"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Results */}
            {searchQuery && (
              <div className="max-w-md mx-auto mt-2 bg-black border border-pp-gold rounded-lg shadow-lg">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchItemClick(item.path)}
                      className="w-full px-4 py-2 text-left text-pp-gold hover:bg-pp-gold hover:text-black transition-colors border-b border-pp-gold/20 last:border-b-0"
                    >
                      {item.label}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-pp-gold/60">Nessun risultato trovato</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
