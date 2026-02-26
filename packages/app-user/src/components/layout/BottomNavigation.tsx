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
          console.log('📱 Mobile BottomNavigation positioning forced');
        } else {
          console.log('🖥️ Desktop BottomNavigation positioning forced');
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
      {/* Effetto vetro con blur e trasparenza */}
      <div className="backdrop-blur-xl bg-black/20 shadow-lg border-t border-white/20">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200 ${
                  active 
                    ? 'text-yellow-400' 
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <IconComponent 
                  size={24} 
                  className={active ? 'mb-1' : 'mb-1 opacity-70'} 
                />
                <span className="text-xs font-medium">{item.label}</span>
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