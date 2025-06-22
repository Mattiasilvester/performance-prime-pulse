
import { Bell, Search, Menu, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
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
import { Home, Dumbbell, Calendar, Bot, User, FileText } from 'lucide-react';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
  { id: 'workouts', label: 'Allenamenti', icon: Dumbbell, path: '/workouts' },
  { id: 'schedule', label: 'Calendario', icon: Calendar, path: '/schedule' },
  { id: 'ai-coach', label: 'AI Coach', icon: Bot, path: '/ai-coach' },
  { id: 'notes', label: 'Note', icon: FileText, path: '/notes' },
  { id: 'profile', label: 'Profilo', icon: User, path: '/profile' },
];

export const Header = () => {
  const [notifications] = useState(3);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof navigationItems>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const filtered = navigationItems.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && searchResults.length > 0) {
      navigate(searchResults[0].path);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleResultClick = (path: string) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    // Close on Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
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

  return (
    <header className="bg-black shadow-lg border-b-2 border-pp-gold relative">
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
              <h1 className="text-base lg:text-lg font-bold text-pp-gold leading-tight">Performance Prime</h1>
              <p className="text-xs text-pp-gold/80 leading-tight">Oltre ogni limite</p>
            </div>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-sm text-pp-gold/80 hidden sm:block">
                {user.email}
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
            <Button variant="ghost" size="sm" className="relative text-pp-gold hover:bg-pp-gold hover:text-black">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-pp-gold text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {notifications}
                </span>
              )}
            </Button>

            {/* Menu a tendina per navigazione */}
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
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-pp-gold hover:bg-pp-gold hover:text-black">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 bg-black border-b-2 border-pp-gold p-4 z-50" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-pp-gold" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Cerca allenamenti, esercizi..."
                className="w-full pl-10 pr-4 py-2 bg-black border border-pp-gold rounded-lg text-pp-gold placeholder-pp-gold/50 focus:outline-none focus:ring-2 focus:ring-pp-gold"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-black border border-pp-gold rounded-lg shadow-lg">
                {searchResults.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(item.path)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-pp-gold/10 text-pp-gold first:rounded-t-lg last:rounded-b-lg"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </form>
        </div>
      )}
    </header>
  );
};
