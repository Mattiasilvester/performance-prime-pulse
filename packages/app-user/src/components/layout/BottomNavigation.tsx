import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Calendar, Users, User } from 'lucide-react';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'workouts',
      label: 'Allenamento',
      icon: Dumbbell,
      path: '/workouts'
    },
    {
      id: 'schedule',
      label: 'Appuntamenti',
      icon: Calendar,
      path: '/schedule'
    },
    {
      id: 'professionals',
      label: 'Professionisti',
      icon: Users,
      path: '/professionals'
    },
    {
      id: 'profile',
      label: 'Profilo',
      icon: User,
      path: '/profile'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Forza il rendering corretto dopo il mount
  useEffect(() => {
    const forcePositioning = () => {
      const nav = document.querySelector('.bottom-navigation') as HTMLElement;
      if (nav) {
        // Forza positioning per mobile
        nav.style.zIndex = '9999';
        nav.style.position = 'fixed';
        nav.style.bottom = '0';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.width = '100%';
        
        // Mobile-specific fixes
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          nav.style.transform = 'translateZ(0)'; // Force hardware acceleration
          nav.style.willChange = 'transform';
        }
      }
    };

    const timer = setTimeout(forcePositioning, 0);
    
    // Listener per resize (mobile rotation)
    window.addEventListener('resize', forcePositioning);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', forcePositioning);
    };
  }, []);

  return (
    <nav
      data-tour="bottom-nav"
      className="bottom-navigation fixed bottom-0 left-0 right-0 z-[9999] pb-safe sm:z-[9999] md:z-[9999] lg:z-[9999] xl:z-[9999]"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        width: '100%'
      }}
    >
      <div className="bg-background border-t border-[rgba(255,255,255,0.06)] pt-2 pb-3">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200"
              >
                {/* Indicatore barretta oro sopra icona quando attivo */}
                {active && (
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-[2px] bg-[#EEBA2B]" 
                    aria-hidden 
                  />
                )}
                <IconComponent 
                  size={24} 
                  className={active ? 'mb-1 text-[#EEBA2B]' : 'mb-1 text-[#5C5C66]'} 
                />
                <span className={`text-[10px] ${active ? 'font-bold text-[#EEBA2B]' : 'font-medium text-[#5C5C66]'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export { BottomNavigation };
export default BottomNavigation;