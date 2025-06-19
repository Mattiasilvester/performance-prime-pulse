
import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const [notifications] = useState(3);
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <header className="bg-black shadow-lg border-b-2 border-pp-gold">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black border-2 border-pp-gold rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/d81134b0-7f04-4ce8-8667-ba9f6c0064f5.png" 
                alt="Performance Prime Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-pp-gold">Performance Prime</h1>
              <p className="text-xs text-pp-gold/80">Oltre ogni limite</p>
            </div>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-sm text-pp-gold/80 hidden sm:block">
                {user.email}
              </span>
            )}
            <Button variant="ghost" size="sm" className="relative text-pp-gold hover:bg-pp-gold hover:text-black">
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
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-pp-gold hover:bg-pp-gold hover:text-black">
              <LogOut className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="lg:hidden text-pp-gold hover:bg-pp-gold hover:text-black">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
